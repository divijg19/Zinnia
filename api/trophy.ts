import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendErrorSvg } from "../lib/errors.js";
import { filterThemeParam, getUsername } from "../lib/params.js";
import { renderTrophySVG } from "../trophy/src/renderer.js";
import {
	readTrophyCache,
	resolveCacheSeconds,
	setCacheHeaders,
	setEtagAndMaybeSend304,
	setSvgHeaders,
	writeTrophyCache,
} from "./_utils.js";

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
		// Fetch upstream with retries (network errors and 5xx will retry).
		async function fetchWithRetries(
			urlStr: string,
			attempts = 3,
			baseDelay = 200,
		) {
			let lastResp: Response | null = null;
			let lastErr: unknown = null;
			for (let i = 0; i < attempts; i++) {
				const ctrl = new AbortController();
				const timeout = setTimeout(() => ctrl.abort("timeout"), 10_000);
				try {
					const r = await fetch(urlStr, {
						headers: { "User-Agent": "zinnia/1.0 (+trophy)" },
						signal: ctrl.signal,
					});
					lastResp = r;
					if (r.status >= 500) {
						lastErr = new Error(`upstream status ${r.status}`);
						// will retry
					} else {
						clearTimeout(timeout);
						return r;
					}
				} catch (e) {
					lastErr = e;
				} finally {
					clearTimeout(timeout);
				}
				if (i < attempts - 1)
					await new Promise((s) => setTimeout(s, baseDelay * 2 ** i));
			}
			if (lastResp) return lastResp;
			throw lastErr ?? new Error("fetch failed");
		}

		let resp: Response;
		try {
			resp = await fetchWithRetries(upstream.toString(), 3, 200);
		} catch (_e) {
			// Network-level failure after retries: try cached SVG before failing
			try {
				const cached = await readTrophyCache(upstream.toString());
				if (cached) {
					setSvgHeaders(res);
					setCacheHeaders(res, Math.max(cacheSeconds, 86400));
					if (setEtagAndMaybeSend304(req.headers as any, res, cached))
						return res.send("");
					return res.send(cached);
				}
			} catch (_e2) {
				// ignore
			}
			return sendErrorSvg(
				req,
				res,
				"Upstream trophy fetch failed",
				"TROPHY_UPSTREAM_FETCH",
			);
		}
		const ct = resp.headers.get("content-type") || "";
		const body = await resp.text();
		// If upstream returned 5xx, try cached SVG first
		if (resp.status >= 500) {
			try {
				const cached = await readTrophyCache(upstream.toString());
				if (cached) {
					setSvgHeaders(res);
					setCacheHeaders(res, Math.max(cacheSeconds, 86400));
					if (setEtagAndMaybeSend304(req.headers as any, res, cached))
						return res.send("");
					return res.send(cached);
				}
			} catch (_e) {
				// ignore and continue to send error
			}
			return sendErrorSvg(
				req,
				res,
				`Upstream trophy returned ${resp.status}`,
				"TROPHY_UPSTREAM_STATUS",
				30,
			);
		}

		// Normal successful SVG passthrough. Persist a copy for later fallbacks.
		setSvgHeaders(res);
		setCacheHeaders(res, cacheSeconds);
		if (ct.includes("image/svg")) {
			try {
				await writeTrophyCache(upstream.toString(), body);
			} catch (_e) {
				// ignore
			}
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
