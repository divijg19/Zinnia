import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendErrorSvg } from "../lib/errors.ts";
import { filterThemeParam, getUsername } from "../lib/params.ts";
import { renderTrophySVG } from "../trophy/src/renderer.ts";
import {
	resolveCacheSeconds,
	setCacheHeaders,
	setEtagAndMaybeSend304,
	setSvgHeaders,
} from "./_utils.ts";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		const proto = (req.headers["x-forwarded-proto"] || "https").toString();
		const host = (req.headers.host || "localhost").toString();
		const url = new URL(req.url as string, `${proto}://${host}`);
		const username = getUsername(url, ["username"]);
		if (!username) {
			return sendErrorSvg(
				req,
				res,
				"Missing or invalid ?username=...",
				"UNKNOWN",
			);
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
			return sendErrorSvg(
				req,
				res,
				"Upstream trophy fetch failed",
				"TROPHY_UPSTREAM_FETCH",
			);
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
		return sendErrorSvg(
			req,
			res,
			`Upstream trophy returned ${resp.status}`,
			"TROPHY_UPSTREAM_STATUS",
		);
	} catch (_err) {
		return sendErrorSvg(req, res, "trophy: internal error", "TROPHY_INTERNAL");
	}
}
