function svg(body: string) {
	return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" role="img" aria-label="${body}"><title>${body}</title><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f9fafb" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">${body}</text></svg>`;
}

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { renderTrophySVG } from "../trophy/src/renderer";
import { resolveCacheSeconds, setCacheHeaders } from "./_utils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		const proto = (req.headers["x-forwarded-proto"] || "https").toString();
		const host = (req.headers.host || "localhost").toString();
		const url = new URL(req.url as string, `${proto}://${host}`);
		const username = url.searchParams.get("username");
		if (!username) {
			res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
			res.status(200);
			return res.send(svg("Missing ?username=..."));
		}
		const upstream = new URL("https://github-profile-trophy.vercel.app/");
		for (const [k, v] of url.searchParams) upstream.searchParams.set(k, v);
		const token = process.env.TROPHY_TOKEN;
		if (token && !upstream.searchParams.has("token"))
			upstream.searchParams.set("token", token);
		const cacheSeconds = resolveCacheSeconds(url, [
			"TROPHY_CACHE_SECONDS",
			"CACHE_SECONDS",
		], 86400);

		// If theme=watchdog, render locally to support our custom theme
		const theme = (url.searchParams.get("theme") || "").toLowerCase();
		if (theme === "watchdog") {
			const title = url.searchParams.get("title") || undefined;
			const columns = parseInt(url.searchParams.get("columns") || "4", 10) || 4;
			const svgOut = renderTrophySVG({ username, theme, title, columns });
			res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
			setCacheHeaders(res, cacheSeconds);
			return res.send(svgOut);
		}
		const ctrl = new AbortController();
		const timeout = setTimeout(() => ctrl.abort("timeout"), 10_000);
		let resp: Response;
		try {
			resp = await fetch(upstream.toString(), {
				headers: { "User-Agent": "zinnia/1.0 (+trophy)" },
				signal: ctrl.signal,
			});
		} catch (_e) {
			clearTimeout(timeout);
			res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
			res.status(200);
			return res.send(svg("Upstream trophy fetch failed"));
		} finally {
			clearTimeout(timeout);
		}
		const ct = resp.headers.get("content-type") || "";
		const body = await resp.text();
		res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
		setCacheHeaders(res, cacheSeconds);
		if (ct.includes("image/svg")) {
			return res.send(body);
		}
		return res.send(svg(`Upstream trophy returned ${resp.status}`));
	} catch (_err) {
		res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
		res.status(200);
		return res.send(svg("trophy: internal error"));
	}
}
