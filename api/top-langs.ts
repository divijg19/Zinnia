import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
	ERR_MISSING_USERNAME,
	emptyRenderer,
	handleRouteError,
	missingUsername,
	sendDebugJson,
	sendErrorSvg,
} from "../lib/errors.js";
import {
	filterThemeParam,
	getDebugFlag,
	getUsername,
	parseArray,
	parseBoolean,
	parseNumber,
	safeUrl,
} from "../lib/params.js";
import {
	getGithubPATForService,
	hasAnyPatEnv,
	seedPatFromRequestHeaders,
	withPatEnv,
} from "../lib/tokens.js";
import { renderTopLanguages } from "../stats/src/cards/top-languages.js";
import { fetchTopLanguages } from "../stats/src/fetchers/top-languages.js";
import { resolveCacheSeconds, sendSuccessSvg } from "./_utils.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	let debug = false;
	let diag: Record<string, unknown> = {
		service: "top-langs",
		ok: false,
		stage: "init",
		timing: {},
	};
	return withPatEnv(async () => {
		try {
			const url = safeUrl(req, "/api/top-langs");
			debug = getDebugFlag(url);
			const t0 = Date.now();
			diag = {
				service: "top-langs",
				ok: false,
				stage: "init",
				timing: {},
			};
			const username = getUsername(url, ["username", "user"]);
			if (!username) {
				if (debug) {
					return sendDebugJson(res, {
						...diag,
						stage: "validation",
						error: ERR_MISSING_USERNAME,
						code: "UNKNOWN",
					});
				}
				return missingUsername(req, res);
			}
			filterThemeParam(url);

			const token = getGithubPATForService("top-langs");
			try {
				if (
					token &&
					(!process.env.PAT_1 || process.env.PAT_1.trim().length === 0)
				) {
					process.env.PAT_1 = String(token);
				}
			} catch {}
			seedPatFromRequestHeaders(req);

			// PAT presence only — never values. Safe to expose in ?debug=1.
			const patConfigured = hasAnyPatEnv();
			diag.params = {
				username,
				theme: url.searchParams.get("theme") ?? "default",
			};
			diag.validation = { username: true, patConfigured };

			if (!patConfigured) {
				if (debug) {
					return sendDebugJson(res, {
						...diag,
						stage: "validation",
						error: "Set PAT_1 (or GITHUB_TOKEN) in Vercel for top-langs",
						code: "TOP_LANGS_RATE_LIMIT",
					});
				}
				return sendErrorSvg(
					req,
					res,
					"Set PAT_1 (or GITHUB_TOKEN) in Vercel for top-langs",
					"TOP_LANGS_RATE_LIMIT",
				);
			}

			const exclude_repo = parseArray(
				url.searchParams.get("exclude_repo") ?? undefined,
			);
			const size_weight = parseNumber(
				url.searchParams.get("size_weight") ?? undefined,
			);
			const count_weight = parseNumber(
				url.searchParams.get("count_weight") ?? undefined,
			);

			const tFetch0 = Date.now();
			const topLangs = await fetchTopLanguages(
				username,
				exclude_repo,
				typeof size_weight === "number" ? size_weight : 1,
				typeof count_weight === "number" ? count_weight : 0,
			);
			(diag.timing as Record<string, unknown>).fetchMs = Date.now() - tFetch0;

			const layoutRaw = url.searchParams.get("layout") ?? undefined;
			const layout =
				layoutRaw === "compact" ||
				layoutRaw === "normal" ||
				layoutRaw === "donut" ||
				layoutRaw === "donut-vertical" ||
				layoutRaw === "pie"
					? layoutRaw
					: undefined;
			(diag.params as Record<string, unknown>).layout = layout ?? "normal";
			const statsFormatRaw = url.searchParams.get("stats_format") ?? undefined;
			const stats_format =
				statsFormatRaw === "percentages" || statsFormatRaw === "bytes"
					? statsFormatRaw
					: undefined;

			const tRender0 = Date.now();
			const svg = renderTopLanguages(topLangs, {
				hide: parseArray(url.searchParams.get("hide") ?? undefined),
				hide_progress: parseBoolean(
					url.searchParams.get("hide_progress") ?? undefined,
				),
				hide_title: parseBoolean(
					url.searchParams.get("hide_title") ?? undefined,
				),
				hide_border: parseBoolean(
					url.searchParams.get("hide_border") ?? undefined,
				),
				custom_title: url.searchParams.get("custom_title") ?? undefined,
				// Top-langs renderer uses a narrow theme union; accept any user-provided theme.
				theme: (url.searchParams.get("theme") ?? "default") as any,
				layout,
				locale: url.searchParams.get("locale") ?? undefined,
				langs_count: parseNumber(
					url.searchParams.get("langs_count") ?? undefined,
				),
				card_width: parseNumber(
					url.searchParams.get("card_width") ?? undefined,
				),
				border_radius: parseNumber(
					url.searchParams.get("border_radius") ?? undefined,
				),
				title_color: url.searchParams.get("title_color") ?? undefined,
				text_color: url.searchParams.get("text_color") ?? undefined,
				bg_color: url.searchParams.get("bg_color") ?? undefined,
				border_color: url.searchParams.get("border_color") ?? undefined,
				stats_format,
				disable_animations: parseBoolean(
					url.searchParams.get("disable_animations") ?? undefined,
				),
			});

			const cacheSeconds = resolveCacheSeconds(
				url,
				["TOP_LANGS_CACHE_SECONDS", "CACHE_SECONDS"],
				86400,
			);
			// Never send an empty body: route to the error path instead so
			// embedders always receive a renderable SVG.
			if (!svg) emptyRenderer("top-langs");
			(diag.timing as Record<string, unknown>).renderMs = Date.now() - tRender0;
			(diag.timing as Record<string, unknown>).totalMs = Date.now() - t0;
			if (debug) {
				return sendDebugJson(res, {
					...diag,
					ok: true,
					stage: "done",
					render: { bytes: svg.length, cacheSeconds },
				});
			}
			// Always 200 + full SVG with ETag set (never 304-empty).
			return sendSuccessSvg(res, svg, cacheSeconds);
		} catch (err) {
			return handleRouteError(req, res, err, {
				service: "top-langs",
				code: "TOP_LANGS_INTERNAL",
				debug,
				diag,
			});
		}
	});
}
