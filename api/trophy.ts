function svg(body: string, errCode?: string) {
	const comment = errCode ? `\n<!-- ZINNIA_ERR:${errCode} -->` : "";
	return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" role="img" aria-label="${body}"><title>${body}</title><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f9fafb" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">${body}</text></svg>${comment}`;
}

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { renderTrophySVG } from "../trophy/src/renderer";
import {
	filterThemeParam,
	getUsername,
	resolveCacheSeconds,
	setCacheHeaders,
	setEtagAndMaybeSend304,
	setSvgHeaders,
} from "./_utils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		const proto = (req.headers["x-forwarded-proto"] || "https").toString();
		const host = (req.headers.host || "localhost").toString();
		const url = new URL(req.url as string, `${proto}://${host}`);
		const username = getUsername(url, ["username"]);
		if (!username) {
			setSvgHeaders(res);
			res.status(200);
			const body = svg("Missing or invalid ?username=...", "E_BAD_INPUT");
			if (setEtagAndMaybeSend304(req.headers as any, res, body))
				return res.send("");
			return res.send(body);
		}
		const upstream = new URL("https://github-profile-trophy.vercel.app/");
		for (const [k, v] of url.searchParams) upstream.searchParams.set(k, v);
		const token = process.env.TROPHY_TOKEN;
		if (token && !upstream.searchParams.has("token"))
			upstream.searchParams.set("token", token);
		const cacheSeconds = resolveCacheSeconds(
			url,
			["TROPHY_CACHE_SECONDS", "CACHE_SECONDS"],
			86400,
		);

		// If theme=watchdog, render locally to support our custom theme
		filterThemeParam(url);
		const theme = (url.searchParams.get("theme") || "").toLowerCase();
		if (theme === "watchdog") {
			const title = url.searchParams.get("title") || undefined;
			const columns = parseInt(url.searchParams.get("columns") || "4", 10) || 4;
			const svgOut = renderTrophySVG({ username, theme, title, columns });
			setSvgHeaders(res);
			setCacheHeaders(res, cacheSeconds);
			if (setEtagAndMaybeSend304(req.headers as any, res, svgOut))
				return res.send("");
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
			setSvgHeaders(res);
			res.status(200);
			const body = svg("Upstream trophy fetch failed", "E_UPSTREAM_FETCH");
			if (setEtagAndMaybeSend304(req.headers as any, res, body))
				return res.send("");
			return res.send(body);
		} finally {
			clearTimeout(timeout);
		}
		const ct = resp.headers.get("content-type") || "";
		const body = await resp.text();
		setSvgHeaders(res);
		setCacheHeaders(res, cacheSeconds);
		if (ct.includes("image/svg")) {
			if (setEtagAndMaybeSend304(req.headers as any, res, body))
				return res.send("");
			return res.send(body);
		}
		{
			const errBody = svg(
				`Upstream trophy returned ${resp.status}`,
				"E_UPSTREAM_STATUS",
			);
			if (setEtagAndMaybeSend304(req.headers as any, res, errBody))
				return res.send("");
			return res.send(errBody);
		}
	} catch (_err) {
		setSvgHeaders(res);
		res.status(200);
		const body = svg("trophy: internal error", "E_INTERNAL");
		if (setEtagAndMaybeSend304(req.headers as any, res, body))
			return res.send("");
		return res.send(body);
	}
}
