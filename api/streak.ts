//

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendErrorSvg } from "../lib/errors.js";
import { filterThemeParam, getUsername } from "../lib/params.js";
import { WATCHDOG } from "../lib/themes.js";
import {
	resolveCacheSeconds,
	setCacheHeaders,
	setEtagAndMaybeSend304,
	setFallbackCacheHeaders,
	setShortCacheHeaders,
	setSvgHeaders,
} from "./_utils.js";
import * as cache from "./cache.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		const proto = (req.headers["x-forwarded-proto"] || "https").toString();
		const host = (req.headers.host || "localhost").toString();
		const url = new URL(req.url as string, `${proto}://${host}`);
		const user = getUsername(url, ["user", "username"]);
		if (!user) {
			return sendErrorSvg(
				req,
				res,
				"Missing or invalid ?user= or ?username=...",
				"UNKNOWN",
			);
		}
		const upstream = new URL("https://streak-stats.demolab.com/");
		for (const [k, v] of url.searchParams) upstream.searchParams.set(k, v);
		upstream.searchParams.set("user", user);
		// Map theme=watchdog to explicit color params supported by upstream
		filterThemeParam(url);
		const theme = (url.searchParams.get("theme") || "").toLowerCase();
		if (theme === "watchdog") {
			// Remove theme to avoid overriding our colors upstream
			upstream.searchParams.delete("theme");
			const wd = WATCHDOG as Record<string, string>;
			for (const [k, v] of Object.entries({
				background: wd.background,
				border: wd.border,
				stroke: wd.stroke,
				ring: wd.ring,
				fire: wd.fire,
				currStreakNum: wd.currStreakNum,
				sideNums: wd.sideNums,
				currStreakLabel: wd.currStreakLabel,
				sideLabels: wd.sideLabels,
				dates: wd.dates,
				excludeDaysLabel: wd.excludeDaysLabel,
			})) {
				if (!upstream.searchParams.has(k)) upstream.searchParams.set(k, v);
			}
		}
		const token = process.env.TOKEN;
		if (token && !upstream.searchParams.has("token"))
			upstream.searchParams.set("token", token);
		const cacheSeconds = resolveCacheSeconds(
			url,
			["STREAK_CACHE_SECONDS", "CACHE_SECONDS"],
			86400,
		);
		// Read existing cached metadata (etag) to send If-None-Match and to
		// enable serving a cached fallback on upstream failures.
		let cachedMeta: { body: string; etag?: string; ts?: number } | null = null;
		try {
			cachedMeta = await cache.readCacheWithMeta("streak", upstream.toString());
		} catch (_e) {
			/* ignore */
		}

		// Fetch upstream with retries (network errors and 5xx will retry).
		// Accept an optional If-None-Match value so we can send conditional
		// requests to upstream when we have cached metadata.
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
						"User-Agent": "zinnia/1.0 (+streak)",
					};
					if (ifNoneMatch) headers["If-None-Match"] = ifNoneMatch;
					const r = await fetch(urlStr, {
						headers,
						signal: ctrl.signal,
					});
					lastResp = r;
					// treat 5xx as retryable
					if (r.status >= 500) {
						lastErr = new Error(`upstream status ${r.status}`);
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
				3,
				200,
				cachedMeta?.etag,
			);
		} catch (_e) {
			// Network-level failure after retries: try cached SVG before failing
			try {
				const cached = await cache.readCache("streak", upstream.toString());
				if (cached) {
					setSvgHeaders(res);
					setFallbackCacheHeaders(res, Math.max(cacheSeconds, 86400));
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
				"Upstream streak fetch failed",
				"STREAK_UPSTREAM_FETCH",
			);
		}
		const ct = resp.headers.get("content-type") || "";

		// Handle 304 Not Modified: serve cached body if available
		if (resp.status === 304) {
			if (cachedMeta?.body) {
				setSvgHeaders(res);
				setFallbackCacheHeaders(res, Math.max(cacheSeconds, 86400));
				if (setEtagAndMaybeSend304(req.headers as any, res, cachedMeta.body))
					return res.send("");
				return res.send(cachedMeta.body);
			}
			// fall through to reading body
		}

		const body = await resp.text();
		setSvgHeaders(res);
		if (ct.includes("image/svg")) {
			// If upstream returned 404 with an SVG payload, forward the
			// payload and preserve the 404 status for clients.
			if (resp.status === 404) {
				// Use a short cache TTL for upstream 404s so clients recheck soon.
				setShortCacheHeaders(res, Math.min(cacheSeconds, 60));
				// To keep badges embeddable (e.g., GitHub README images), return
				// a 200 status while exposing the original upstream status via
				// a diagnostic header. Clients embedding via <img> will then
				// display the SVG instead of showing an "Error Fetching Resource".
				res.setHeader("X-Upstream-Status", String(resp.status));
				// Explicitly return 200 so embedders which treat non-2xx as
				// errors will still render the SVG.
				res.status(200);
				// Debug header to make it easier to identify bridged 404s in logs
				// and downstream requests (safe to expose internally).
				res.setHeader("X-Zinnia-Debug", "streak-404-bridged");
				if (setEtagAndMaybeSend304(req.headers as any, res, body))
					return res.send("");
				// intentionally return 200 so embed consumers receive the SVG
				return res.send(body);
			}
			// On successful upstream SVG, persist a cached copy to help
			// future fallbacks and conditional requests.
			setCacheHeaders(res, cacheSeconds);
			try {
				const etag = cache.computeEtag(body);
				await cache.writeCacheWithMeta(
					"streak",
					upstream.toString(),
					body,
					etag,
				);
			} catch (_e) {
				// ignore cache write failures
			}
			if (setEtagAndMaybeSend304(req.headers as any, res, body))
				return res.send("");
			return res.send(body);
		}
		return sendErrorSvg(
			req,
			res,
			`Upstream streak returned ${resp.status}`,
			"STREAK_UPSTREAM_STATUS",
		);
	} catch (_err) {
		return sendErrorSvg(req, res, "streak: internal error", "STREAK_INTERNAL");
	}
}
