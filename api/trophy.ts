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
		// Perform upstream fetch with retries on network errors or 5xx responses.
		// This reduces transient failures before falling back to cached or local
		// renderers. Attempts: initial + 2 retries (3 total). Exponential
		// backoff base 200ms.
		async function fetchWithRetries(
			urlStr: string,
			attempts = 3,
			baseDelay = 200,
		) {
			let lastErr: unknown = null;
			let lastResp: Response | null = null;
			for (let i = 0; i < attempts; i++) {
				const ctrlAttempt = new AbortController();
				const timeout = setTimeout(() => ctrlAttempt.abort("timeout"), 10_000);
				try {
					const r = await fetch(urlStr, {
						headers: { "User-Agent": "zinnia/1.0 (+trophy)" },
						signal: ctrlAttempt.signal,
					});
					lastResp = r;
					// If upstream returned 5xx, consider retrying
					if (r.status >= 500) {
						lastErr = new Error(`upstream status ${r.status}`);
						// fallthrough to retry
					} else {
						clearTimeout(timeout);
						return r;
					}
				} catch (e) {
					lastErr = e;
				} finally {
					clearTimeout(timeout);
				}
				// If we're going to retry, wait with exponential backoff
				if (i < attempts - 1) {
					const delay = baseDelay * 2 ** i;
					await new Promise((res) => setTimeout(res, delay));
				}
			}
			// If we have a lastResp (likely 5xx), return it so caller can branch
			if (lastResp) return lastResp;
			throw lastErr ?? new Error("fetch failed");
		}

		let resp: Response;
		try {
			resp = await fetchWithRetries(upstream.toString(), 3, 200);
		} catch (_e) {
			// Network-level failure after retries — try to serve last-successful cached SVG
			try {
				const cached = await readTrophyCache(upstream.toString());
				if (cached) {
					setSvgHeaders(res);
					// Serve cached SVG for a longer duration to reduce visible errors
					setCacheHeaders(res, Math.max(cacheSeconds, 86400));
					if (setEtagAndMaybeSend304(req.headers as any, res, cached))
						return res.send("");
					return res.send(cached);
				}
			} catch (_e2) {
				// fallthrough to error
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
		// Set SVG headers for any SVG passthrough or error response
		setSvgHeaders(res);

		// If upstream returned a 404 and the body is an SVG, forward it
		// (preserve the upstream payload to help debugging clients).
		if (resp.status === 404) {
			if (ct.includes("image/svg")) {
				// Keep any caching short for upstream 404s
				setCacheHeaders(res, Math.min(cacheSeconds, 60));
				if (setEtagAndMaybeSend304(req.headers as any, res, body))
					return res.send("");
				res.status(404);
				return res.send(body);
			}
			return sendErrorSvg(
				req,
				res,
				`Upstream trophy returned 404`,
				"TROPHY_UPSTREAM_STATUS",
			);
		}

		// For upstream 5xx errors prefer the last-successful cached SVG, then
		// fall back to a local render. Cached SVGs are served longer to reduce
		// client-visible outages.
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
				// ignore and continue to local render
			}

			// No cached SVG available — try a local render as a last resort.
			try {
				const title = url.searchParams.get("title") || undefined;
				const columns =
					parseInt(url.searchParams.get("columns") || "4", 10) || 4;
				const themeParam = (url.searchParams.get("theme") || "").toLowerCase();
				const svgOut = renderTrophySVG({
					username,
					theme: themeParam || undefined,
					title,
					columns,
				});
				setCacheHeaders(res, 30);
				if (setEtagAndMaybeSend304(req.headers as any, res, svgOut))
					return res.send("");
				return res.send(svgOut);
			} catch (_e) {
				return sendErrorSvg(
					req,
					res,
					`Upstream trophy returned ${resp.status}`,
					"TROPHY_UPSTREAM_STATUS",
					30,
				);
			}
		}

		// Normal successful SVG passthrough. Persist a copy for future fallbacks.
		setCacheHeaders(res, cacheSeconds);
		if (ct.includes("image/svg")) {
			try {
				// Best-effort: store the successful upstream body for later fallback
				await writeTrophyCache(upstream.toString(), body);
			} catch (_e) {
				// ignore cache errors
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
