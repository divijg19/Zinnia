//

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendErrorSvg } from "../lib/errors.js";
import { filterThemeParam, getUsername } from "../lib/params.js";
import {
	incrementFallbackServed,
	incrementUpstreamError,
} from "../lib/telemetry.js";
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
		// Delegate to the streak-provided vercel handler when available.
		// Disabled by default; enable by setting `STREAK_DELEGATE_VERCEL_HANDLER=1`.
		if (process.env.STREAK_DELEGATE_VERCEL_HANDLER === "1") {
			try {
				const tryImport = async (base: string) => {
					try {
						return await import(`${base}.js`);
					} catch (_e) {
						return await import(`${base}.ts`);
					}
				};
				let vh: any = null;
				try {
					vh = await tryImport("../streak/dist/vercel_handler");
				} catch {
					try {
						vh = await tryImport("../streak/src/vercel_handler");
					} catch {
						vh = null;
					}
				}
				if (vh && typeof vh.default === "function") {
					return await vh.default(
						req as unknown as VercelRequest,
						res as unknown as VercelResponse,
					);
				}
			} catch (delegErr) {
				// delegation failed — fall back to built-in logic below
				console.warn("streak: vercel handler delegation failed", delegErr);
			}
		}

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

		// If the TS renderer is enabled, try local implementation first.
		// Default to true unless explicitly disabled with `STREAK_USE_TS=0|false`.
		const _useTsEnv = process.env.STREAK_USE_TS;
		const useTs = !(_useTsEnv === "0" || _useTsEnv === "false");
		if (useTs) {
			try {
				// Try to import a bundled `streak/dist/index.js` first (prod),
				// then fall back to local source `streak/src` for dev.
				const tryImport = async (base: string) => {
					try {
						return await import(`${base}.js`);
					} catch (_e) {
						return await import(`${base}.ts`);
					}
				};
				let idx: any;
				try {
					idx = await tryImport("../streak/dist/index");
				} catch {
					idx = await tryImport("../streak/src/index");
				}
				const { renderForUser, getCache: getCacheLocal } = idx;
				const cacheLocal = await getCacheLocal();

				const paramsObj = Object.fromEntries(url.searchParams);
				const localKey = `streak:local:${user}:${JSON.stringify(paramsObj)}`;
				// Try in-memory/Upstash cache first (streak/src/cache)
				try {
					const cached = await cacheLocal.get(localKey);
					if (cached) {
						const etag = cache.computeEtag
							? cache.computeEtag(cached)
							: undefined;
						if (etag) res.setHeader("ETag", `"${etag}"`);
						if (
							etag &&
							setEtagAndMaybeSend304(
								req.headers as Record<string, unknown>,
								res,
								cached,
							)
						) {
							// Send cached body with 200 so embedders get valid SVG
							res.status(200);
							return res.send(cached);
						}
						setSvgHeaders(res);
						setFallbackCacheHeaders(
							res,
							Math.max(
								resolveCacheSeconds(
									url,
									["STREAK_CACHE_SECONDS", "CACHE_SECONDS"],
									86400,
								),
								86400,
							),
						);
						return res.send(cached);
					}
				} catch {
					// ignore cache read errors and fall through
				}

				// Render using centralized renderer
				try {
					const out = await renderForUser(
						user as string,
						paramsObj as Record<string, string>,
					);
					if (out.status) res.status(out.status);

					// Persist to local cache (try best-effort)
					// Use a minimum 3-day retention for internal cache to survive GitHub/Upstream outages
					const internalTTL = Math.max(
						resolveCacheSeconds(
							url,
							["STREAK_CACHE_SECONDS", "CACHE_SECONDS"],
							86400,
						),
						259200,
					);

					try {
						await cacheLocal.set(localKey, out.body, internalTTL);
					} catch {
						// ignore cache write failures
					}

					// Compute and set ETag, honor If-None-Match
					try {
						const etag = cache.computeEtag(String(out.body));
						if (etag) res.setHeader("ETag", `"${etag}"`);
						if (
							etag &&
							setEtagAndMaybeSend304(
								req.headers as Record<string, unknown>,
								res,
								String(out.body),
							)
						) {
							res.status(200);
							return res.send(String(out.body));
						}
					} catch {
						// ignore etag failures
					}

					res.setHeader("Content-Type", out.contentType);
					if (out.contentType === "image/png") {
						setCacheHeaders(
							res,
							resolveCacheSeconds(
								url,
								["STREAK_CACHE_SECONDS", "CACHE_SECONDS"],
								86400,
							),
						);
						return res.send(out.body as Buffer);
					}
					if (out.contentType === "application/json") {
						setCacheHeaders(
							res,
							resolveCacheSeconds(
								url,
								["STREAK_CACHE_SECONDS", "CACHE_SECONDS"],
								86400,
							),
						);
						return res.send(out.body as string);
					}
					// default to svg
					setSvgHeaders(res);
					setCacheHeaders(
						res,
						resolveCacheSeconds(
							url,
							["STREAK_CACHE_SECONDS", "CACHE_SECONDS"],
							86400,
						),
					);
					return res.send(out.body as string);
				} catch (e) {
					console.error("streak: renderer output error", e);
					// fallthrough to default behavior
				}
			} catch (e) {
				console.error("streak: ts renderer error", e);
				// fall through to upstream proxy
			}
		}
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
				4,
				200,
				cachedMeta?.etag,
			);
		} catch (_e) {
			// Network-level failure after retries: try cached SVG before failing
			try {
				const cached = await cache.readCache("streak", upstream.toString());
				if (cached) {
					// record that we served a cached fallback due to upstream/network failure
					try {
						incrementFallbackServed();
					} catch {
						// ignore telemetry failures
					}
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
				"Upstream streak fetch failed",
				"STREAK_UPSTREAM_FETCH",
			);
		}
		const ct = resp.headers.get("content-type") || "";

		// Handle 304 Not Modified: serve cached body if available
		if (resp.status === 304) {
			if (cachedMeta?.body) {
				setSvgHeaders(res);
				setFallbackCacheHeaders(res, Math.max(cacheSeconds, 259200));
				if (
					setEtagAndMaybeSend304(
						req.headers as Record<string, unknown>,
						res,
						String(cachedMeta.body),
					)
				) {
					res.status(200);
					return res.send(cachedMeta.body);
				}
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
				// bridged 404s are indicated via X-Upstream-Status; avoid extra debug headers
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
			// On successful upstream SVG, persist a cached copy to help
			// future fallbacks and conditional requests.
			setCacheHeaders(res, cacheSeconds);
			try {
				const etag = cache.computeEtag(body);
				// Use a 3-day (259200s) internal TTL to survive upstream outages
				const internalTTL = Math.max(cacheSeconds, 259200);
				await cache.writeCacheWithMeta(
					"streak",
					upstream.toString(),
					body,
					etag,
					internalTTL,
				);
			} catch (_e) {
				// ignore cache write failures
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
		// record upstream error metric and expose upstream status for diagnosis
		try {
			incrementUpstreamError();
		} catch {
			// ignore telemetry failures
		}
		res.setHeader("X-Upstream-Status", String(resp.status));
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
