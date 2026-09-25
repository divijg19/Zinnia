import fs from "node:fs";
import path from "node:path";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendErrorSvg } from "../lib/errors.js";
import { importByPath } from "../lib/loader/index.js";
import {
	filterThemeParam,
	isValidUsername,
	resolveCacheSeconds,
	safeUrl,
} from "../lib/params.js";
import { sendSuccessSvg } from "./_utils.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		const url = safeUrl(req, "/api/leetcode");
		// path param support: /api/leetcode/<username>
		const parts = url.pathname.replace(/^\//, "").split("/");
		if (parts[0] === "api" && parts[1] === "leetcode" && parts[2]) {
			url.searchParams.set("username", parts[2]);
		}
		const username = url.searchParams.get("username");
		if (!isValidUsername(username)) {
			return sendErrorSvg(
				req,
				res,
				"Missing or invalid ?username=...",
				"UNKNOWN",
			);
		}

		const config = Object.fromEntries(url.searchParams.entries()) as Record<
			string,
			string
		>;
		// Minimal Node-safe sanitization to avoid importing worker-only code.
		// Ensure required fields and set safe defaults. Extensions are optional.
		if (!config.username?.trim() || !isValidUsername(config.username)) {
			return sendErrorSvg(
				req,
				res,
				"Missing or invalid ?username=...",
				"UNKNOWN",
			);
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
			theme: { light: "light", dark: "dark" },
			cache: 60,
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
			// Re-read after filtering: unsupported singles are deleted above.
			const themeValue = (url.searchParams.get("theme") || "").trim();
			const themes = themeValue ? themeValue.split(",") : [];
			if (themes.length > 0) {
				sanitized.theme =
					themes.length === 1 || themes[1] === ""
						? themes[0]?.trim() || "light"
						: {
								light: themes[0]?.trim() || "light",
								dark: themes[1]?.trim() || "dark",
							};
			}
		}

		const cacheSeconds = resolveCacheSeconds(
			url,
			["LEETCODE_CACHE_SECONDS", "CACHE_SECONDS"],
			86400,
		);

		try {
			const { Generator } = coreMod as { Generator: any };
			const generator = new Generator(
				null as unknown as Cache,
				{} as Record<string, string>,
			);
			generator.verbose = false;
			const svgOut = await generator.generate(sanitized);
			if (!svgOut) throw new Error("leetcode renderer returned empty body");
			// Always 200 + full body with ETag set. Some embedders treat a 304
			// without a body as an error, so never send a bare 304.
			return sendSuccessSvg(res, svgOut, cacheSeconds);
		} catch (e) {
			const error = e as Error;
			console.error("LeetCode generation error:", error.message);
			return sendErrorSvg(
				req,
				res,
				error.message || "LeetCode generation failed",
				"LEETCODE_INTERNAL",
			);
		}
	} catch (_err) {
		return sendErrorSvg(
			req,
			res,
			"leetcode: internal error",
			"LEETCODE_INTERNAL",
		);
	}
}
