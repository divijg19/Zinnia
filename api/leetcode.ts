import type { VercelRequest, VercelResponse } from "@vercel/node";
import { setCacheHeaders } from "./_utils";

function svg(body: string) {
	return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" role="img" aria-label="${body}"><title>${body}</title><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f9fafb" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">${body}</text></svg>`;
}

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
		if (!username) {
			res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
			res.status(200);
			return res.send(svg("Missing ?username=..."));
		}

		const config = Object.fromEntries(url.searchParams.entries()) as Record<
			string,
			string
		>;
		// Minimal Node-safe sanitization to avoid importing worker-only code.
		// Ensure required fields and set safe defaults. Extensions are optional.
		if (!config.username || !config.username.trim()) {
			res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
			res.status(200);
			return res.send(svg("Missing ?username=..."));
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

		// Parse theme= param (supports "name" or "light,dark")
		if (config.theme?.trim()) {
			const themes = config.theme.trim().split(",");
			sanitized.theme =
				themes.length === 1 || themes[1] === ""
					? themes[0].trim()
					: { light: themes[0].trim(), dark: themes[1].trim() };
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
			const { generate } = (await import(
				"../leetcode/packages/core/src/index.ts"
			)) as { generate: (config: any) => Promise<string> };
			const svgOut = await generate(sanitized);
			res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
			setCacheHeaders(res, cacheSeconds);
			return res.send(svgOut);
		} catch (_e) {
			res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
			res.status(200);
			return res.send(svg("LeetCode generation failed"));
		}
	} catch (_err) {
		res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
		res.status(200);
		return res.send(svg("leetcode: internal error"));
	}
}
