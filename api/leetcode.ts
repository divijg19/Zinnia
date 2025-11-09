import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendErrorSvg } from "../lib/errors.js";
import { filterThemeParam, isValidUsername } from "../lib/params.js";
import {
	setCacheHeaders,
	setEtagAndMaybeSend304,
	setSvgHeaders,
} from "./_utils.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		const proto = (req.headers["x-forwarded-proto"] || "https").toString();
		const host = (req.headers.host || "localhost").toString();
		const url = new URL(
			(req.url as string) || "/api/leetcode",
			`${proto}://${host}`,
		);
		// path param support: /api/leetcode/<username>
		const path = url.pathname.replace(/^\//, "").split("/");
		if (path[0] === "api" && path[1] === "leetcode" && path[2]) {
			url.searchParams.set("username", path[2]);
		}
		const username = url.searchParams.get("username");
		if (!isValidUsername(username)) {
			return sendErrorSvg(
				req,
				res,
				"Missing or invalid ?username=...",
				"LEETCODE_INVALID",
			);
		}

		const config = Object.fromEntries(url.searchParams.entries()) as Record<
			string,
			string
		>;
		// Minimal Node-safe sanitization to avoid importing worker-only code.
		// Ensure required fields and set safe defaults. Extensions are optional.
		if (
			!config.username ||
			!config.username.trim() ||
			!isValidUsername(config.username)
		) {
			return sendErrorSvg(
				req,
				res,
				"Missing or invalid ?username=...",
				"LEETCODE_INVALID",
			);
		}
		const sanitized: any = {
			username: config.username.trim(),
			site: (config.site || "us").toLowerCase(),
			width: parseInt(config.width || "500", 10) || 500,
			height: parseInt(config.height || "200", 10) || 200,
			css: [] as string[],
			extensions: [] as any[],
			font: (config.font?.trim() || "baloo_2") as any,
			animation:
				config.animation !== undefined
					? !/^false|0|no$/i.test((config.animation || "").trim())
					: true,
			theme: { light: "light", dark: "dark" } as any,
			cache: 60,
		};

		// Add extensions based on ext/extension parameter
		const { FontExtension, AnimationExtension, ThemeExtension, HeatmapExtension, ActivityExtension, ContestExtension } = await import("../leetcode/packages/core/src/index.js");

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
			const themeValue = config.theme.trim();
			const themes = themeValue.split(",");
			sanitized.theme =
				themes.length === 1 || themes[1] === ""
					? themes[0]?.trim() || "light"
					: { light: themes[0]?.trim() || "light", dark: themes[1]?.trim() || "dark" };
		}

		const envDefault =
			parseInt(
				process.env.LEETCODE_CACHE_SECONDS ||
				process.env.CACHE_SECONDS ||
				"86400",
				10,
			) || 86400;
		const cacheSeconds = config.cache
			? parseInt(config.cache, 10) || envDefault
			: envDefault;

		try {
			const { Generator } = (await import(
				"../leetcode/packages/core/src/card.js"
			)) as { Generator: any };
			const generator = new Generator(
				null as unknown as Cache,
				{} as Record<string, string>,
			);
			generator.verbose = false;
			const svgOut = await generator.generate(sanitized);
			setSvgHeaders(res);
			setCacheHeaders(res, cacheSeconds);
			if (setEtagAndMaybeSend304(req.headers as any, res, svgOut))
				return res.send("");
			return res.send(svgOut);
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
