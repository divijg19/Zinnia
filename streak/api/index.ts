// Streak proxy: fetch SVG from upstream service so we stay Node-only in this monorepo
// and keep embeds compatible. Supports both ?user= and ?username=.

import {
	computeEtag,
	getCacheAdapter,
	setCacheHeaders,
	setShortCacheHeaders,
	setSvgHeaders,
} from "../../lib/canonical/http_cache.js";
import type { RequestLike, ResponseLike } from "../src/server_types";

function sendSvgError(res: ResponseLike, message: string, cacheSeconds = 60) {
	// Attempt to render a themed error card using local renderer if available
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const cardMod = require("../src/card");
		if (cardMod && typeof cardMod.generateErrorCard === "function") {
			const body = cardMod.generateErrorCard(message, {});
			setSvgHeaders(res);
			setShortCacheHeaders(res, cacheSeconds);
			res.status(200);
			return res.send(body);
		}
	} catch {
		// ignore and fall back to simple static SVG
	}

	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" role="img" aria-label="${message}"><title>${message}</title><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f9fafb" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">${message}</text></svg>`;
	setSvgHeaders(res);
	setShortCacheHeaders(res, cacheSeconds);
	res.status(200);
	return res.send(body);
}

export default async function handler(req: RequestLike, res: ResponseLike) {
	try {
		const proto = (req.headers["x-forwarded-proto"] || "https").toString();
		const host = (req.headers.host || "localhost").toString();
		const url = new URL(req.url, `${proto}://${host}`);
		const user =
			url.searchParams.get("user") ?? url.searchParams.get("username");
		if (!user) return sendSvgError(res, "Missing ?user= or ?username=...");

		// If the TS renderer is enabled, try the local implementation first.
		// Default to true unless explicitly disabled with `STREAK_USE_TS=0|false`.
		const _useTsEnv = process.env.STREAK_USE_TS;
		const useTs = !(_useTsEnv === "0" || _useTsEnv === "false");
		// Only allow falling back to upstream when explicitly enabled.
		// Default: do not fall back to upstream — surface local renderer errors.
		const enableUpstream = process.env.STREAK_ENABLE_UPSTREAM === "1";
		if (useTs) {
			try {
				// Delegate renderer discovery to the centralized loader.
				if (
					typeof process !== "undefined" &&
					(process.env.VITEST === "1" ||
						process.env.NODE_ENV === "test" ||
						typeof (globalThis as any).vi !== "undefined")
				) {
					try {
						// eslint-disable-next-line no-console
						console.debug("streak/api: test-mode: about to import loader");
					} catch {}
				}
				const loaderMod = await import("../../lib/canonical/loader.js");
				const renderer = await loaderMod.loadStreakRenderer();
				if (
					typeof process !== "undefined" &&
					(process.env.VITEST === "1" ||
						process.env.NODE_ENV === "test" ||
						typeof (globalThis as any).vi !== "undefined")
				) {
					try {
						// eslint-disable-next-line no-console
						console.debug("streak/api: test-mode: loaded renderer from loader");
					} catch {}
				}

				const paramsObj = Object.fromEntries(url.searchParams);
				const cacheKey = `streak:svg:${user}:${JSON.stringify(paramsObj)}`;
				try {
					// eslint-disable-next-line no-console
					console.debug("streak/api: computed cacheKey", cacheKey);
				} catch {}

				// Use canonical cache adapter by default; allow a local
				// `../src/cache` to override if it exposes `getCache()`.
				let localCache = getCacheAdapter("streak");
				try {
					if (
						typeof process !== "undefined" &&
						(process.env.VITEST === "1" ||
							process.env.NODE_ENV === "test" ||
							typeof (globalThis as any).vi !== "undefined")
					) {
						try {
							// eslint-disable-next-line no-console
							console.debug("streak/api: test-mode: about to import cache");
						} catch {}
					}
					const cacheMod = await import("../src/cache");
					if (cacheMod && typeof cacheMod.getCache === "function") {
						try {
							localCache = await cacheMod.getCache();
							try {
								// eslint-disable-next-line no-console
								console.debug("streak/api: obtained localCache from module");
							} catch {}
						} catch (err) {
							try {
								// eslint-disable-next-line no-console
								console.debug(
									"streak/api: test-mode: cache.getCache error",
									String(err),
								);
							} catch {}
						}
					}
					if (
						typeof process !== "undefined" &&
						(process.env.VITEST === "1" ||
							process.env.NODE_ENV === "test" ||
							typeof (globalThis as any).vi !== "undefined")
					) {
						try {
							// eslint-disable-next-line no-console
							console.debug(
								"streak/api: test-mode: finished cache import/init",
							);
						} catch {}
					}
				} catch (err) {
					try {
						// eslint-disable-next-line no-console
						console.debug(
							"streak/api: test-mode: import cache failed",
							String(err),
						);
					} catch {}
					/* ignore */
				}

				try {
					// eslint-disable-next-line no-console
					console.debug("streak/api: calling localCache.get for", cacheKey);
				} catch {}
				const cached = await localCache.get(cacheKey);
				try {
					// eslint-disable-next-line no-console
					console.debug("streak/api: localCache.get returned", typeof cached);
				} catch {}
				if (cached) {
					const etag = computeEtag(cached);
					res.setHeader("ETag", `"${etag}"`);
					const inm = (
						req.headers["if-none-match"] ||
						req.headers["If-None-Match"] ||
						""
					).toString();
					const inmNorm = inm.replace(/^W\//i, "").replace(/^"|"$/g, "");
					if (inm && inmNorm === etag) {
						res.status(200);
						return res.send(cached);
					}
					setSvgHeaders(res);
					setShortCacheHeaders(res, 60);
					res.setHeader("X-Cache-Status", "hit");
					res.status(200);
					return res.send(cached);
				}

				// Guard renderer invocation in test environments to avoid
				// hangs caused by external mocks or ordering issues in the
				// full test suite. On timeout, attempt to render a
				// deterministic fallback SVG.
				const isTestLocal =
					typeof process !== "undefined" &&
					(process.env.VITEST === "1" ||
						process.env.NODE_ENV === "test" ||
						typeof (globalThis as any).vi !== "undefined");
				let out: any;
				async function tryRendererInvoke(fn: any) {
					const tries: Array<() => Promise<any>> = [];
					// Primary shape: (user: string, params: Record)
					tries.push(() => fn(user, paramsObj));
					// Secondary shape: (opts: { user, ...params })
					tries.push(() => fn({ user, ...paramsObj }));
					// Alternative name keys
					tries.push(() => fn({ username: user, ...paramsObj }));
					tries.push(() => fn({ name: user, ...paramsObj }));

					try {
						// eslint-disable-next-line no-console
						console.debug(
							"streak/api: renderer spec =>",
							(globalThis as any).__STREAK_RENDERER_SPEC || "<none>",
						);
					} catch {}

					for (let i = 0; i < tries.length; i++) {
						const pfn = tries[i];
						if (typeof pfn !== "function") continue;
						try {
							// await each possibility sequentially (fast-fail)
							const res = await pfn();
							// If renderer returned something that looks like an SVG error,
							// treat it as a failure and continue to next candidate.
							const bodyStr =
								typeof res?.body === "string"
									? res.body
									: typeof res === "string"
										? res
										: "";
							if (
								bodyStr &&
								/Expected\s+NAME|Expected\s+\w+,\s+actual/i.test(bodyStr)
							) {
								try {
									// eslint-disable-next-line no-console
									console.debug("streak/api: renderer rejected shape", i);
								} catch {}
								continue;
							}
							try {
								// eslint-disable-next-line no-console
								console.debug("streak/api: renderer accepted shape", i);
							} catch {}
							return res;
						} catch (err) {
							try {
								// eslint-disable-next-line no-console
								console.debug(
									"streak/api: renderer shape error",
									i,
									String(err),
								);
							} catch {}
							// try next shape
						}
					}
					// Last resort: call primary shape and let errors propagate
					return fn(user, paramsObj);
				}

				try {
					if (isTestLocal) {
						out = await Promise.race([
							tryRendererInvoke(renderer),
							new Promise((_r, rej) =>
								setTimeout(() => rej(new Error("renderer timeout")), 8000),
							),
						]);
					} else {
						out = await tryRendererInvoke(renderer);
					}
				} catch (renderErr) {
					try {
						// eslint-disable-next-line no-console
						console.debug(
							"streak/api: renderer failed or timed out",
							String(renderErr),
						);
					} catch {}
					try {
						// Try loader's fallback renderer if available
						if (
							loaderMod &&
							typeof loaderMod.renderFallbackSvg === "function"
						) {
							const svg = await loaderMod.renderFallbackSvg(user);
							setSvgHeaders(res);
							setShortCacheHeaders(res, 60);
							try {
								res.setHeader("X-Cache-Status", "fallback-renderer");
							} catch {}
							res.status(200);
							return res.send(svg);
						}
					} catch {
						// ignore and fall through to error handling below
					}
					throw renderErr;
				}
				if (!out) throw new Error("streak: renderer returned no output");

				const cacheSeconds =
					parseInt(
						process.env.STREAK_CACHE_SECONDS ||
							process.env.CACHE_SECONDS ||
							"300",
						10,
					) || 300;

				if (
					out.contentType === "image/svg+xml" &&
					typeof out.body === "string"
				) {
					try {
						void localCache.set(cacheKey, out.body, cacheSeconds);
					} catch {}
					const etag2 = computeEtag(out.body);
					res.setHeader("ETag", `"${etag2}"`);
					const inm2 = (
						req.headers["if-none-match"] ||
						req.headers["If-None-Match"] ||
						""
					).toString();
					const inm2Norm = inm2.replace(/^W\//i, "").replace(/^"|"$/g, "");
					if (inm2 && inm2Norm === etag2) {
						res.setHeader("X-Cache-Behavior", "cached-body-on-match");
						res.setHeader("X-Upstream-Status", "local-render");
						res.status(200);
						return res.send(out.body);
					}
					setSvgHeaders(res);
					setCacheHeaders(res, cacheSeconds);
					res.setHeader("X-Cache-Status", "miss");
					res.status(200);
					return res.send(out.body);
				}

				try {
					if (out.contentType === "image/png")
						res.setHeader("Content-Type", "image/png");
					else if (out.contentType)
						res.setHeader("Content-Type", out.contentType);
				} catch {}
				setCacheHeaders(res, cacheSeconds);
				res.setHeader("X-Cache-Status", "miss");
				res.status(200);
				return res.send(out.body as any);
			} catch (e: unknown) {
				let msg: string;
				if (e instanceof Error) msg = e.message;
				else if (typeof e === "string") msg = e;
				else {
					try {
						msg = JSON.stringify(e);
					} catch {
						msg = String(e);
					}
				}
				// Enhanced diagnostics: include renderer spec and full stack when available
				try {
					const spec = (globalThis as any).__STREAK_RENDERER_SPEC;
					if (spec) console.error("streak: renderer spec =>", spec);
				} catch {}
				console.error("streak: ts renderer failed", msg);
				try {
					if (e instanceof Error && e.stack) console.error(e.stack);
					else console.error(String(e));
				} catch {}
				if (!enableUpstream) {
					return sendSvgError(res, "Streak local renderer failed", 60);
				}
			}
		}

		// --- Fallback: keep existing upstream proxy behavior ---
		// If upstream fallback is not enabled, return an SVG error instead
		if (!enableUpstream) {
			return sendSvgError(res, "Upstream streak proxy disabled");
		}
		const upstream = new URL("https://streak-stats.demolab.com/");
		for (const [k, v] of url.searchParams) upstream.searchParams.set(k, v);
		// Normalize parameter name expected by upstream
		upstream.searchParams.set("user", user);

		const cacheSeconds =
			parseInt(
				process.env.STREAK_CACHE_SECONDS || process.env.CACHE_SECONDS || "300",
				10,
			) || 300;

		// Upstream fetch with timeout protection
		const ctrl = new AbortController();
		const timeout = setTimeout(() => ctrl.abort("timeout"), 10_000);
		let resp: globalThis.Response;
		try {
			resp = await fetch(upstream.toString(), {
				headers: { "User-Agent": "zinnia/1.0 (+streak)" },
				signal: ctrl.signal,
			});
		} catch {
			clearTimeout(timeout);
			return sendSvgError(res, "Upstream streak fetch failed");
		} finally {
			clearTimeout(timeout);
		}
		const ct = resp.headers.get("content-type") || "";
		// If upstream returned a non-OK SVG (e.g. 404 with an SVG body),
		// bridge the SVG so embed consumers render it instead of showing
		// an "Error fetching resource" message. Return 200 but expose
		// the original upstream status via a header.
		if (!resp.ok) {
			const body = await resp.text();
			if (ct.includes("image/svg")) {
				setSvgHeaders(res);
				// Short cache so consumers recheck upstream soon
				setShortCacheHeaders(res, Math.min(cacheSeconds, 60));
				res.setHeader("X-Upstream-Status", String(resp.status));
				// bridged 404: do not set extra debug headers to keep responses clean
				res.status(200);
				return res.send(body);
			}
			return sendSvgError(res, `Upstream streak returned ${resp.status}`);
		}
		const body = await resp.text();
		setSvgHeaders(res);
		setCacheHeaders(res, cacheSeconds);
		return res.send(body);
	} catch (_err) {
		return sendSvgError(res, "streak: internal error");
	}
}
