//

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendErrorSvg } from "../lib/errors.js";
import { filterThemeParam, getUsername } from "../lib/params.js";
import {
	incrementFallbackServed,
	incrementUpstreamError,
} from "../lib/telemetry.js";
import { WATCHDOG } from "../lib/themes.js";
import { getCache as getCacheLocal, renderForUser } from "../streak/src/index";
import vercelHandler from "../streak/src/vercel_handler";
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
		// If enabled, delegate to the streak Vercel adapter (statically imported).
		if (process.env.STREAK_DELEGATE_VERCEL_HANDLER === "1") {
			try {
				return await vercelHandler(
					req as unknown as VercelRequest,
					res as unknown as VercelResponse,
				);
			} catch (delegErr) {
				console.warn("streak: vercel handler delegation failed", delegErr);
				// fall through to built-in logic
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

		// Upstream fallback controlled via env. Default: disabled.
		const enableUpstream = process.env.STREAK_ENABLE_UPSTREAM === "1";
		let upstream: URL | null = null;
		if (enableUpstream) {
			upstream = new URL(
				process.env.STREAK_UPSTREAM || "https://streak-stats.demolab.com/",
			);
			for (const [k, v] of url.searchParams) upstream.searchParams.set(k, v);
			upstream.searchParams.set("user", user);
		}

		// If the TS renderer is enabled, try local implementation first.
		// Default to true unless explicitly disabled with `STREAK_USE_TS=0|false`.
		const _useTsEnv = process.env.STREAK_USE_TS;
		const useTs = !(_useTsEnv === "0" || _useTsEnv === "false");
		if (useTs) {
			try {
				const cacheLocal = await getCacheLocal();

				const paramsObj = Object.fromEntries(url.searchParams);
				const localKey = `streak:local:${user}:${JSON.stringify(paramsObj)}`;
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
								String(cached),
							)
						) {
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

					const internalTTL = Math.max(
						resolveCacheSeconds(
							url,
							["STREAK_CACHE_SECONDS", "CACHE_SECONDS"],
							86400,
						),
						259200,
					);

					try {
						if (typeof out.body === "string") {
							await cacheLocal.set(localKey, out.body, internalTTL);
						}
					} catch {
						// ignore cache write failures
					}

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
					// fallthrough to fallback/upstream
				}
			} catch (e) {
				console.error("streak: ts renderer error", e);
				if (!enableUpstream) {
					return sendErrorSvg(
						req,
						res,
						"Streak local renderer failed",
						"STREAK_INTERNAL",
					);
				}
			}
		}

		// Map theme=watchdog to explicit color params supported by upstream
		filterThemeParam(url);
		const theme = (url.searchParams.get("theme") || "").toLowerCase();
		if (theme === "watchdog" && upstream) {
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
			if (upstream)
				cachedMeta = await cache.readCacheWithMeta(
					"streak",
					upstream.toString(),
				);
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
						"User-Agent": "zinnia/1.0 (+streak)",
					};
					if (ifNoneMatch) headers["If-None-Match"] = ifNoneMatch;
					const r = await fetch(urlStr, { headers, signal: ctrl.signal });
					lastResp = r;
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
			if (!upstream) {
				return sendErrorSvg(
					req,
					res,
					"Upstream streak proxy disabled",
					"STREAK_UPSTREAM_STATUS",
				);
			}
			resp = await fetchWithRetries(
				upstream.toString(),
				4,
				200,
				cachedMeta?.etag,
			);
		} catch (_e) {
			// Network-level failure after retries: try cached SVG before failing
			try {
				const cached = upstream
					? await cache.readCache("streak", upstream.toString())
					: null;
				if (cached) {
					try {
						incrementFallbackServed();
					} catch {
						/* ignore telemetry failures */
					}
					setSvgHeaders(res);
					setFallbackCacheHeaders(res, Math.max(cacheSeconds, 259200));
					if (
						setEtagAndMaybeSend304(
							req.headers as Record<string, unknown>,
							res,
							String(cached),
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

		if (resp.status === 304) {
			if (cachedMeta?.body) {
				setSvgHeaders(res);
				setFallbackCacheHeaders(res, Math.max(cacheSeconds, 259200));
				res.setHeader("X-Cache-Behavior", "cached-body-on-match");
				res.setHeader("X-Upstream-Status", String(resp.status));
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
		}

		const body = await resp.text();
		setSvgHeaders(res);
		if (ct.includes("image/svg")) {
			if (resp.status === 404) {
				setShortCacheHeaders(res, Math.min(cacheSeconds, 60));
				res.setHeader("X-Upstream-Status", String(resp.status));
				res.status(200);
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
			setCacheHeaders(res, cacheSeconds);
			try {
				const etag = cache.computeEtag(body);
				const internalTTL = Math.max(cacheSeconds, 259200);
				await cache.writeCacheWithMeta(
					"streak",
					upstream?.toString(),
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
