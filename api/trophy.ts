import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendErrorSvg } from "../lib/errors.js";
import { filterThemeParam, getUsername } from "../lib/params.js";
import { renderTrophySVG } from "../trophy/src/renderer.js";
import {
	computeEtag,
	readTrophyCache,
	readTrophyCacheWithMeta,
	resolveCacheSeconds,
	setCacheHeaders,
	setEtagAndMaybeSend304,
	setFallbackCacheHeaders,
	setShortCacheHeaders,
	setSvgHeaders,
	writeTrophyCacheWithMeta,
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
			if (
				setEtagAndMaybeSend304(
					req.headers as Record<string, unknown>,
					res,
					svgOut,
				)
			) {
				// Send the full SVG body with 200 so embedders receive valid content
				res.status(200);
				return res.send(svgOut);
			}
			return res.send(svgOut);
		}
		// Read existing cached metadata (etag) to send If-None-Match.
		let cachedMeta = null;
		try {
			cachedMeta = await readTrophyCacheWithMeta(upstream.toString());
		} catch (_e) {
			/* ignore */
		}

		// Fetch upstream with retries (network errors and 5xx will retry).
		async function fetchWithRetries(
			urlStr: string,
			attempts = 3,
			baseDelay = 200,
			ifNoneMatch?: string,
		) {
			let lastResp: Response | null = null;
			let lastErr: unknown = null;
			for (let i = 0; i < attempts; i++) {
				const ctrl = new AbortController();
				const timeout = setTimeout(() => ctrl.abort("timeout"), 10_000);
				try {
					const headers: Record<string, string> = {
						"User-Agent": "zinnia/1.0 (+trophy)",
					};
					if (ifNoneMatch) headers["If-None-Match"] = ifNoneMatch;
					const r = await fetch(urlStr, {
						headers,
						signal: ctrl.signal,
					});
					lastResp = r;
					if (r.status === 304) {
						clearTimeout(timeout);
						return r;
					}
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
			resp = await fetchWithRetries(
				upstream.toString(),
				4,
				200,
				cachedMeta?.etag,
			);
		} catch (_e) {
			// Network-level failure after retries: try cached SVG before failing
			try {
				const cached = await readTrophyCache(upstream.toString());
				if (cached) {
					setSvgHeaders(res);
					setFallbackCacheHeaders(res, Math.max(cacheSeconds, 259200));
					if (
						setEtagAndMaybeSend304(
							req.headers as Record<string, unknown>,
							res,
							cached,
						)
					) {
						res.status(200);
						return res.send(cached);
					}
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
		// Handle 304 Not Modified: serve cached body if available
		if (resp.status === 304) {
			try {
				const cached =
					cachedMeta ?? (await readTrophyCacheWithMeta(upstream.toString()));
				if (cached?.body) {
					setSvgHeaders(res);
					setFallbackCacheHeaders(res, Math.max(cacheSeconds, 259200));
					if (
						setEtagAndMaybeSend304(
							req.headers as Record<string, unknown>,
							res,
							String(cached.body),
						)
					) {
						res.status(200);
						return res.send(cached.body);
					}
					return res.send(cached.body);
				}
			} catch (_e) {
				// fall through to fetch body below
			}
		}

		const body = await resp.text();
		// If upstream returned 5xx, try cached SVG first
		if (resp.status >= 500) {
			try {
				const cached = await readTrophyCache(upstream.toString());
				if (cached) {
					setSvgHeaders(res);
					setFallbackCacheHeaders(res, Math.max(cacheSeconds, 259200));
					if (
						setEtagAndMaybeSend304(
							req.headers as Record<string, unknown>,
							res,
							cached,
						)
					) {
						res.status(200);
						return res.send(cached);
					}
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

		// If upstream returned a 404 and the body is an SVG, forward it
		// If upstream returned a 404 and the body is an SVG, forward it
		// but return 200 so embed consumers (e.g., GitHub README images)
		// will display the badge instead of showing an error icon.
		if (resp.status === 404) {
			if (ct.includes("image/svg")) {
				// Keep any caching short for upstream 404s
				setShortCacheHeaders(res, Math.min(cacheSeconds, 60));
				// Expose original upstream status as a diagnostic header
				res.setHeader("X-Upstream-Status", String(resp.status));
				if (
					setEtagAndMaybeSend304(
						req.headers as Record<string, unknown>,
						res,
						String(body),
					)
				) {
					res.status(200);
					return res.send(body);
				}
				// intentionally return 200 so embed consumers receive the SVG
				return res.send(body);
			}
			return sendErrorSvg(
				req,
				res,
				`Upstream trophy returned 404`,
				"TROPHY_UPSTREAM_STATUS",
			);
		}

		// (handled above) fallthrough to normal successful passthrough

		// Normal successful SVG passthrough. Persist a copy for future fallbacks.
		setCacheHeaders(res, cacheSeconds);
		if (ct.includes("image/svg")) {
			try {
				const etag = computeEtag(body);
				// Use a 3-day (259200s) internal TTL to survive upstream outages
				const internalTTL = Math.max(cacheSeconds, 259200);
				await writeTrophyCacheWithMeta(
					upstream.toString(),
					body,
					etag,
					internalTTL,
				);
			} catch (_e) {
				// ignore
			}
			if (
				setEtagAndMaybeSend304(
					req.headers as Record<string, unknown>,
					res,
					String(body),
				)
			) {
				res.status(200);
				return res.send(body);
			}
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
