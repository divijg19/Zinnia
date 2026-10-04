import fs from "node:fs";
import path from "node:path";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
	describeCacheOutcome,
	getDebugFlag,
	newDiag,
	sendDebugJson,
} from "../lib/debug.js";
import {
	emptyRenderer,
	handleRouteError,
	sendErrorSvg,
	validationFailure,
} from "../lib/errors.js";
import { importByPath } from "../lib/loader/index.js";
import {
	filterThemeParam,
	isValidUsername,
	resolveCacheSeconds,
	safeUrl,
} from "../lib/params.js";
import {
	getCachedRender,
	markCacheStatus,
	renderCacheKey,
	renderWithFallback,
	ttlForOutcome,
} from "../lib/render-cache.js";
import {
	getCacheAdapterForService,
	pickForwardedHeaders,
	sendSuccessSvg,
} from "./_utils.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	let debug = false;
	let username: string | undefined;
	const diag = newDiag("leetcode");
	try {
		const url = safeUrl(req, "/api/leetcode");
		debug = getDebugFlag(url);
		const t0 = Date.now();
		// path param support: /api/leetcode/<username>
		const parts = url.pathname.replace(/^\//, "").split("/");
		if (parts[0] === "api" && parts[1] === "leetcode" && parts[2]) {
			url.searchParams.set("username", parts[2]);
		}
		const rawUsername = url.searchParams.get("username");
		if (!isValidUsername(rawUsername)) {
			return validationFailure(req, res, {
				debug,
				diag,
				username: rawUsername,
			});
		}
		username = rawUsername ?? undefined;

		const config = Object.fromEntries(url.searchParams.entries()) as Record<
			string,
			string
		>;
		// Minimal Node-safe sanitization to avoid importing worker-only code.
		// Ensure required fields and set safe defaults. Extensions are optional.
		if (!config.username?.trim() || !isValidUsername(config.username)) {
			return validationFailure(req, res, {
				debug,
				diag,
				username: config.username,
			});
		}
		type SanitizedOptions = {
			username: string;
			site: string;
			width: number;
			height: number;
			css: string[];
			extensions: unknown[];
			font: string;
			animation: boolean;
			theme: string | { light: string; dark: string };
			cache: number;
		};

		const sanitized: SanitizedOptions = {
			username: config.username.trim(),
			site: (config.site || "us").toLowerCase(),
			width: parseInt(config.width || "500", 10) || 500,
			height: parseInt(config.height || "200", 10) || 200,
			css: [] as string[],
			extensions: [] as unknown[],
			font: (config.font?.trim() || "baloo_2") as string,
			animation:
				config.animation !== undefined
					? !/^false|0|no$/i.test((config.animation || "").trim())
					: true,
			// A single default theme, not a light/dark pair. The pair meant an
			// unrecognised `theme` value resolved to light/dark rather than to the
			// theme that was asked for, and light/dark takes the dual-theme path
			// where the theme's gradient defs are not emitted.
			theme: "default",
			cache: 60,
		};

		diag.params = {
			username: sanitized.username,
			theme: config.theme ?? "default",
			animation: sanitized.animation,
		};
		diag.validation = {
			username: true,
			// The LeetCode API needs no GitHub token.
			patConfigured: true,
		};

		// Add extensions based on ext/extension parameter
		// Construct the expected compiled path directly to avoid a
		// multi-argument helper call that causes TS confusion in some setups.
		const metaDir = path.dirname(new URL(import.meta.url).pathname);
		let found = path.resolve(
			metaDir,
			"..",
			"leetcode",
			"packages",
			"core",
			"dist",
			"index.js",
		);
		if (!fs.existsSync(found)) {
			const alt = path.join(
				process.cwd(),
				"leetcode",
				"packages",
				"core",
				"dist",
				"index.js",
			);
			if (fs.existsSync(alt)) {
				if (process.env.LOADER_DEBUG === "1")
					console.debug("leetcode: using cwd fallback ->", alt);
				found = alt;
			}
		}
		if (!found || !fs.existsSync(found)) {
			return sendErrorSvg(
				req,
				res,
				"Missing compiled leetcode core (run build)",
				"LEETCODE_BUILD_MISSING",
			);
		}
		const coreMod = (await importByPath(found)) as any;
		const {
			FontExtension,
			AnimationExtension,
			ThemeExtension,
			HeatmapExtension,
			ActivityExtension,
			ContestExtension,
		} = coreMod;

		sanitized.extensions = [FontExtension, AnimationExtension, ThemeExtension];

		const extName = config.ext || config.extension;
		if (extName === "activity") {
			sanitized.extensions.push(ActivityExtension);
		} else if (extName === "contest") {
			sanitized.extensions.push(ContestExtension);
		} else if (extName === "heatmap") {
			sanitized.extensions.push(HeatmapExtension);
		}

		// Parse theme= param (supports "name" or "light,dark"); filter unsupported single names
		if (config.theme?.trim()) {
			filterThemeParam(url);
			// Re-read after filtering: names the registry does not know are
			// dropped above. When every name is rejected the param is deleted and
			// the card keeps the `default` theme set above, which is a real theme
			// rather than the unstyled base palette.
			const themeValue = (url.searchParams.get("theme") || "").trim();
			const themes = themeValue ? themeValue.split(",") : [];
			if (themes.length > 0) {
				sanitized.theme =
					themes.length === 1 || themes[1] === ""
						? themes[0]?.trim() || "default"
						: {
								light: themes[0]?.trim() || "default",
								dark: themes[1]?.trim() || "default",
							};
			}
		}

		const cacheSeconds = resolveCacheSeconds(
			url,
			["LEETCODE_CACHE_SECONDS", "CACHE_SECONDS"],
			86400,
		);
		const cacheKey = renderCacheKey(url);
		diag.cache = { key: cacheKey, ttlSeconds: cacheSeconds };
		const cached = await getCachedRender("leetcode", cacheKey);

		const tRender0 = Date.now();
		const timing: Record<string, unknown> = {};
		const outcome = await renderWithFallback({
			service: "leetcode",
			cacheKey,
			freshSeconds: cacheSeconds,
			cached,
			produce: async () => {
				const { Generator } = coreMod as { Generator: any };
				// Both arguments used to be placeholders: `null` disabled the
				// Generator's own KV data cache, so every embed view re-queried
				// LeetCode's GraphQL endpoint, and `{}` sent that request with no
				// headers at all - which is how an anonymous-looking request from a
				// shared egress address draws a rate limit. A rate limit then became
				// a fabricated card. `leetcode/api/index.ts` accepted the caller's
				// headers as a parameter for this reason.
				const generator = new Generator(
					getCacheAdapterForService("leetcode") as unknown as Cache,
					pickForwardedHeaders(req.headers),
				);
				generator.verbose = false;
				const svgOut = await generator.generate(sanitized);
				if (!svgOut) emptyRenderer("leetcode");
				return { svg: svgOut, headers: {} };
			},
		});
		if (outcome.status !== "hit") timing.renderMs = Date.now() - tRender0;

		diag.timing = { ...timing, totalMs: Date.now() - t0 };
		diag.cache = {
			...(diag.cache as Record<string, unknown>),
			...describeCacheOutcome(outcome),
		};
		const serveSeconds = ttlForOutcome(outcome, cacheSeconds);
		if (debug) {
			return sendDebugJson(res, {
				...diag,
				ok: true,
				stage: "done",
				render: { bytes: outcome.svg.length, cacheSeconds: serveSeconds },
			});
		}
		markCacheStatus(res, outcome.status);
		// Always 200 + full body with ETag set. Some embedders treat a 304
		// without a body as an error, so never send a bare 304.
		return sendSuccessSvg(res, outcome.svg, serveSeconds);
	} catch (err) {
		return handleRouteError(req, res, err, {
			service: "leetcode",
			code: "LEETCODE_INTERNAL",
			debug,
			diag,
			username,
		});
	}
}
