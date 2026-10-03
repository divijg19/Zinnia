//

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDebugFlag, newDiag, sendDebugJson } from "../lib/debug.js";
import {
	handleRouteError,
	sendErrorSvg,
	validationFailure,
} from "../lib/errors.js";
import { fetchWithTimeout } from "../lib/fetch-timeout.js";
import {
	importByPath,
	invokePossibleRequestHandler,
	pickHandlerFromModule,
	resolveCompiledHandler,
} from "../lib/loader/index.js";
import { getUsername, safeUrl } from "../lib/params.js";
import {
	getCachedRender,
	markCacheStatus,
	renderCacheKey,
	STALE_SERVE_SECONDS,
	setCachedRender,
} from "../lib/render-cache.js";

// renderer will be loaded from an API-local build folder at runtime; fall back to
// package src/dist during development. We dynamically import to avoid static
// resolution failures in serverless bundles.
type StreakRenderer = (
	user: string,
	params: Record<string, string>,
) => Promise<{ status?: number; body: string | Buffer; contentType: string }>;
let _renderForUser: StreakRenderer | undefined;

async function loadStreakRenderer(): Promise<StreakRenderer> {
	if (_renderForUser) return _renderForUser;
	try {
		// If a compiled API handler exists, prefer that path for production builds.
		try {
			const compiled =
				resolveCompiledHandler(
					import.meta.url,
					"..",
					"streak",
					"dist",
					"index.js",
				) ||
				resolveCompiledHandler(
					import.meta.url,
					"..",
					"api",
					"_build",
					"streak",
					"index.js",
				);
			if (compiled) {
				const mod = (await importByPath(compiled)) as any;
				try {
					console.debug("streak: imported compiled keys ->", Object.keys(mod));
				} catch {}
				const picked = pickHandlerFromModule(mod, [
					"default",
					"request",
					"handler",
				]);
				if (picked && typeof picked.fn === "function") {
					// Build a renderer wrapper that invokes compiled handler and returns normalized result
					_renderForUser = async (
						user: string,
						params: Record<string, string> = {},
					) => {
						const proto = "https";
						const host = "localhost";
						const url = new URL(
							`/api/streak?user=${encodeURIComponent(user)}`,
							`${proto}://${host}`,
						);
						for (const k of Object.keys(params || {}))
							url.searchParams.set(k, String((params as any)[k]));
						const headers = new Headers();
						const webReq = new Request(url.toString(), {
							method: "GET",
							headers,
						});
						const result = await invokePossibleRequestHandler(
							picked.fn as (...args: unknown[]) => unknown,
							webReq,
						);
						if (result && typeof (result as any).text === "function") {
							const webRes = result as Response;
							const body = await webRes.text();
							return {
								status: webRes.status || 200,
								body: String(body),
								contentType:
									webRes.headers.get("content-type") || "image/svg+xml",
							};
						}
						// If handler returned something else, normalize
						return {
							status: 200,
							body: String(result ?? ""),
							contentType: "image/svg+xml",
						};
					};
					try {
						(globalThis as any).__STREAK_RENDERER_SPEC = compiled;
					} catch {}
					return _renderForUser;
				}
			}
		} catch (e) {
			try {
				console.debug("streak: compiled handler probe failed", String(e));
			} catch {}
		}
		// Prefer compiled renderer in streak/dist or api/_build/streak
		const found =
			resolveCompiledHandler(
				import.meta.url,
				"..",
				"streak",
				"dist",
				"index.js",
			) ||
			resolveCompiledHandler(
				import.meta.url,
				"..",
				"api",
				"_build",
				"streak",
				"index.js",
			);
		if (found) {
			const mod = (await importByPath(found)) as any;
			try {
				console.debug("streak: imported module keys ->", Object.keys(mod));
			} catch {}
			// prefer named export renderForUser, then default function, then render
			let fn: any =
				mod.renderForUser ??
				(typeof mod.default === "function" ? mod.default : undefined) ??
				mod.render ??
				mod.handler;
			if (!fn && mod && typeof mod === "object") {
				// some builds export nested default
				if (mod.default && typeof mod.default.renderForUser === "function")
					fn = mod.default.renderForUser;
			}
			if (typeof fn === "function") {
				_renderForUser = async (
					user: string,
					params: Record<string, string> = {},
				) => {
					const candidate = await fn(user, params);
					// normalize to {status, body, contentType}
					if (candidate && typeof candidate === "object")
						return candidate as any;
					return {
						status: 200,
						body: String(candidate ?? ""),
						contentType: "image/svg+xml",
					};
				};
				try {
					(globalThis as any).__STREAK_RENDERER_SPEC = found;
				} catch {}
				return _renderForUser;
			}
		}
		// If we reach here without setting _renderForUser, throw so the catch
		// path runs and provides fallback renderers.
		throw new Error("streak renderer not available");
	} catch (e) {
		// If the centralized loader fails, log the diagnostic and attempt a
		// lightweight fallback using the loader's `renderFallbackSvg` helper.
		// This ensures the API returns a valid SVG for embeds instead of
		// propagating an import error that results in a 500 response.
		try {
			console.warn(
				"streak: centralized loader failed",
				e instanceof Error ? e.message : String(e),
			);
		} catch {}

		try {
			const fallbackMod = await import("../lib/canonical/loader.js");
			if (fallbackMod && typeof fallbackMod.renderFallbackSvg === "function") {
				_renderForUser = async (user: string) => {
					const svg = await fallbackMod.renderFallbackSvg(user);
					return { status: 200, body: svg, contentType: "image/svg+xml" };
				};
				return _renderForUser;
			}
		} catch (e2) {
			try {
				console.warn("streak: fallback renderer unavailable", e2);
			} catch {}
		}

		// If all recovery attempts fail, provide a minimal deterministic SVG
		// renderer as a last-resort so embeds remain functional in dev/CI.
		try {
			console.warn("streak: using minimal inline fallback renderer");
		} catch {}
		_renderForUser = async (user: string) => {
			const escaped = String(user).replace(/[&<>"'`]/g, (s) => {
				switch (s) {
					case "&":
						return "&amp;";
					case "<":
						return "&lt;";
					case ">":
						return "&gt;";
					case '"':
						return "&quot;";
					case "'":
						return "&#39;";
					default:
						return s;
				}
			});
			const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" viewBox="0 0 600 60" role="img" aria-label="Streak for ${escaped}"><title>Streak for ${escaped}</title><rect width="100%" height="100%" fill="#0f172a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">Streak for ${escaped}</text></svg>`;
			return { status: 200, body: svg, contentType: "image/svg+xml" };
		};
		return _renderForUser;
	}
}

import {
	getCacheAdapterForService,
	resolveCacheSeconds,
	sendFallbackSvg,
	sendShortSvg,
	sendSuccessSvg,
	setCacheHeaders,
	setEtagAndAlwaysSend200,
	setShortCacheHeaders,
	setSvgHeaders,
} from "./_utils.js";

/**
 * Produce a streak response into `res` (which may be a recorder rather than the live
 * response). Every success and failure path of the historical flow lives here
 * unchanged; the caller decides whether to serve the result, cache it, or replace it
 * with the last known good render.
 */
async function produceStreak(
	req: VercelRequest,
	res: VercelResponse,
	url: URL,
	user: string,
): Promise<unknown> {
	// Serve the canonical local renderer by default on every environment.
	// The legacy upstream (zinnia-rho) derives its calendar from a rolling
	// one-year window, clipping current streaks longer than ~a year, and
	// re-enters this same deployment in production. Upstream is therefore
	// opt-in only: STREAK_PREFER_UPSTREAM=1 or ?prefer_upstream=1.
	let upstreamFailed = false;
	const preferUpstream =
		process.env.STREAK_PREFER_UPSTREAM === "1" ||
		url.searchParams.get("prefer_upstream") === "1";
	if (preferUpstream) {
		try {
			const upstream = new URL("https://zinnia-rho.vercel.app/");
			for (const [k, v] of url.searchParams) upstream.searchParams.set(k, v);
			upstream.searchParams.set("user", user as string);
			// Bounded like the sibling proxy in streak/api (10s there; 8s
			// here keeps Hobby headroom). Abort lands in catch below and
			// falls through to the local renderer.
			const resp = await fetchWithTimeout(upstream.toString(), undefined, 8000);
			const ct = resp?.headers?.get
				? resp.headers.get("content-type")
				: undefined;
			if (
				resp &&
				resp.status >= 200 &&
				resp.status < 300 &&
				ct?.includes("svg")
			) {
				const body = await resp.text();
				// Always 200 + full body with ETag set (never 304-empty, which
				// breaks embedders). Revalidation is handled client-side.
				try {
					res.setHeader("X-Streak-Renderer", "upstream");
				} catch {}
				res.setHeader("X-Upstream-Status", String(resp.status));
				return sendSuccessSvg(
					res,
					String(body),
					resolveCacheSeconds(
						url,
						["STREAK_CACHE_SECONDS", "CACHE_SECONDS"],
						86400,
					),
				);
			}
			// If upstream returned a successful but non-SVG payload, treat as an error
			// and fall back to the local renderer/cached fallback.
			if (
				resp &&
				resp.status >= 200 &&
				resp.status < 300 &&
				!ct?.includes("svg")
			) {
				// fall through to local renderer; upstream may be returning HTML due to
				// bot protection or other transient issues even with a 2xx status.
			}
			// If upstream returned a non-OK but SVG we still forward with transient cache
			if (resp && resp.status >= 400 && ct?.includes("svg")) {
				const body = await resp.text();
				// Same embed contract as the 2xx branch: always 200 + full
				// body with ETag set (never 304-empty). The upstream status
				// is exposed via X-Upstream-Status for diagnostics.
				try {
					res.setHeader("X-Streak-Renderer", "cache");
				} catch {}
				res.setHeader("X-Upstream-Status", String(resp.status));
				return sendShortSvg(res, String(body), 60);
			}
			// otherwise, fall through to local renderer below
		} catch {
			// upstream failed — we'll prefer a cached fallback or return
			// a standardized error SVG rather than invoking the heavy local
			// renderer which can be slow/heavy in tests.
			upstreamFailed = true;
		}
	}
	try {
		const cacheLocal = getCacheAdapterForService("streak");
		const paramsObj = Object.fromEntries(url.searchParams);
		const localKey = `streak:local:${user}:${JSON.stringify(paramsObj)}`;

		const baseCacheSeconds = resolveCacheSeconds(
			url,
			["STREAK_CACHE_SECONDS", "CACHE_SECONDS"],
			86400,
		);
		try {
			const cached = await cacheLocal.get(localKey);
			if (cached) {
				// Always 200 + full cached body with ETag set. The TTL is the
				// caller's, not a hardcoded day: Camo honours this max-age, and
				// a floor here would pin a stale body in every reader's browser
				// for a day no matter what `?cache=` asked for.
				return sendFallbackSvg(res, String(cached), baseCacheSeconds);
			}
		} catch {
			// ignore cache read errors
		}

		// If upstream permanently failed and we have no cached payload,
		// return a standardized error SVG quickly instead of importing
		// the local renderer which can be slow/heavy in tests.
		if (upstreamFailed) {
			return sendErrorSvg(
				req as VercelRequest,
				res,
				"Upstream streak fetch failed",
				"STREAK_UPSTREAM_FETCH",
			);
		}

		const renderer = await loadStreakRenderer();

		// Ensure outgoing GraphQL POST bodies do not include internal keys
		// (e.g. __patKey) that can cause GitHub's parser to error. We wrap
		// global fetch once to sanitize request bodies targeting the
		// GitHub GraphQL endpoint.
		try {
			const g = globalThis as any;
			if (!g.__zinnia_fetch_sanitized && typeof g.fetch === "function") {
				const origFetch = g.fetch.bind(g);
				g.fetch = async (input: any, init?: any) => {
					try {
						let url = input;
						if (
							typeof input === "object" &&
							input &&
							typeof input.url === "string"
						) {
							url = input.url;
						}
						const urlStr = String(url);
						const isGraphql = urlStr.includes("api.github.com/graphql");
						if (
							isGraphql &&
							init &&
							(init.method || "GET").toString().toUpperCase() === "POST" &&
							init.body
						) {
							try {
								let bodyStr = init.body;
								if (typeof bodyStr !== "string") {
									if (bodyStr instanceof Uint8Array)
										bodyStr = new TextDecoder().decode(bodyStr);
									else bodyStr = JSON.stringify(bodyStr);
								}
								const parsed = JSON.parse(bodyStr);
								if (parsed?.variables && typeof parsed.variables === "object") {
									let changed = false;
									for (const k of Object.keys(parsed.variables)) {
										if (k.startsWith("__")) {
											delete parsed.variables[k];
											changed = true;
										}
									}
									if (changed) {
										init = { ...(init || {}), body: JSON.stringify(parsed) };
									}
								}
							} catch {
								/* ignore parse errors and leave body as-is */
							}
						}
						return origFetch(input, init);
					} catch (_e) {
						return origFetch(input, init);
					}
				};
				g.__zinnia_fetch_sanitized = true;
			}
		} catch {
			/* defensive: don't let sanitizer break the handler */
		}
		if (typeof renderer !== "function") {
			throw new Error("streak renderer not available");
		}
		// Try multiple invocation shapes to support different bundle APIs:
		// 1) renderer(user, params)
		// 2) renderer({ user, ...params })
		// 3) renderer({ username: user, ...params })
		// 4) renderer({ name: user, ...params })
		async function invokeWithCompatibility(fn: any) {
			const shapes: Array<() => Promise<any>> = [
				() => fn(user as string, paramsObj as Record<string, string>),
				() => fn({ user: user as string, ...paramsObj } as any),
				() => fn({ username: user as string, ...paramsObj } as any),
				() => fn({ name: user as string, ...paramsObj } as any),
			];

			try {
				console.debug(
					"api/streak: renderer spec =>",
					(globalThis as any).__STREAK_RENDERER_SPEC || "unknown",
				);
			} catch {}

			for (let i = 0; i < shapes.length; i++) {
				const s = shapes[i];
				if (!s) {
					continue;
				}
				try {
					const candidate = await s();
					const bodyStr =
						typeof (candidate && (candidate.body ?? candidate)) === "string"
							? (candidate.body ?? candidate)
							: "";
					if (
						bodyStr &&
						/Expected\s+NAME|Expected\s+\w+,\s+actual/i.test(bodyStr)
					) {
						try {
							console.debug("api/streak: renderer rejected shape", i);
						} catch {}
						continue;
					}
					try {
						console.debug("api/streak: renderer accepted shape", i);
					} catch {}
					return candidate;
				} catch (err) {
					try {
						console.debug("api/streak: renderer shape error", i, String(err));
					} catch {}
					// try next
				}
			}
			// final attempt (let error bubble)
			return fn(user as string, paramsObj as Record<string, string>);
		}

		const out = await invokeWithCompatibility(renderer);

		// Defensive: some renderer bundles may embed textual error SVGs
		// when an internal parser fails (example: "Expected NAME...").
		// Detect those cases and try the canonical fallback renderer so
		// consumers receive a clean, deterministic SVG instead of an
		// error annotation.
		try {
			const bodyStr = typeof out.body === "string" ? out.body : "";
			if (
				out.contentType === "image/svg+xml" &&
				bodyStr &&
				/Expected\s+NAME|Expected\s+\w+,\s+actual/i.test(bodyStr)
			) {
				try {
					console.warn(
						"streak: renderer produced error SVG, attempting fallback",
					);
				} catch {}
				try {
					const lb = await import("../lib/canonical/loader.js");
					if (lb && typeof lb.renderFallbackSvg === "function") {
						const svg = await lb.renderFallbackSvg(user as string);
						try {
							res.setHeader("X-Streak-Renderer", "fallback");
						} catch {}
						return sendShortSvg(res, svg, 60);
					}
				} catch (e) {
					try {
						console.warn("streak: fallback render failed", String(e));
					} catch {}
				}

				// final-resort minimal inline SVG
				const escaped = String(user).replace(/[&<>"']/g, (s) => {
					switch (s) {
						case "&":
							return "&amp;";
						case "<":
							return "&lt;";
						case ">":
							return "&gt;";
						case '"':
							return "&quot;";
						case "'":
							return "&#39;";
						default:
							return s;
					}
				});
				const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" viewBox="0 0 600 60" role="img" aria-label="Streak for ${escaped}"><title>Streak for ${escaped}</title><rect width="100%" height="100%" fill="#0f172a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">Streak for ${escaped}</text></svg>`;
				try {
					res.setHeader("X-Streak-Renderer", "minimal-inline-fallback");
				} catch {}
				return sendShortSvg(res, svg, 60);
			}
		} catch {
			// ignore detection errors and continue to normal flow
		}
		if (out.status) res.status(out.status);

		// Renderer error payloads must never be persisted or sent with
		// long cache TTLs: a transient GitHub failure would otherwise
		// become sticky for days (cache entry + CDN/browser caching).
		const outIsError = typeof out.status === "number" && out.status >= 400;
		const applyResponseCacheHeaders = () => {
			if (outIsError) setShortCacheHeaders(res, 60);
			else setCacheHeaders(res, baseCacheSeconds);
		};

		const internalTTL = Math.max(baseCacheSeconds, 259200);
		try {
			if (!outIsError && typeof out.body === "string" && out.body) {
				await cacheLocal.set(localKey, out.body, internalTTL);
			}
		} catch {}

		try {
			// Always 200 + full body with ETag set (never 304-empty).
			setEtagAndAlwaysSend200(res, String(out.body));
		} catch {}

		try {
			if (typeof out.contentType === "string" && out.contentType) {
				res.setHeader("Content-Type", out.contentType);
			}
		} catch (err) {
			try {
				console.debug(
					"api/streak: invalid contentType from renderer",
					String(err),
				);
			} catch {}
		}
		if (out.contentType === "image/png") {
			applyResponseCacheHeaders();
			return res.send(out.body as Buffer);
		}
		if (out.contentType === "application/json") {
			applyResponseCacheHeaders();
			return res.send(out.body as string);
		}
		setSvgHeaders(res);
		applyResponseCacheHeaders();
		res.status(200);
		return res.send(out.body as string);
	} catch (e) {
		console.error("streak: local renderer error", e);
		return sendErrorSvg(
			req,
			res,
			"Streak local renderer failed",
			"STREAK_INTERNAL",
		);
	}
}

/**
 * Serve `/api/streak`.
 *
 * Wraps the historical render flow (see {@link produceStreak}) with the shared
 * render cache and `?debug=1` diagnostics. That flow is unchanged and writes
 * into a recorder, so this wrapper can tell a real card apart from an error
 * card and, in the latter case, serve the previous render instead.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
	const diag = newDiag("streak");
	try {
		const t0 = Date.now();
		const url = safeUrl(req, "/api/streak");
		const debug = getDebugFlag(url);
		const user = getUsername(url, ["username", "user"]);
		if (!user) {
			return validationFailure(req, res, {
				debug,
				diag,
				message: "Missing or invalid ?user= or ?username=...",
				username:
					url.searchParams.get("user") ?? url.searchParams.get("username"),
			});
		}
		diag.params = {
			username: user,
			theme: url.searchParams.get("theme") ?? "default",
		};

		const cacheSeconds = resolveCacheSeconds(
			url,
			["STREAK_CACHE_SECONDS", "CACHE_SECONDS"],
			86400,
		);
		const cacheKey = renderCacheKey(url);
		diag.cache = { key: cacheKey, ttlSeconds: cacheSeconds };

		// Fresh cached render: answer without touching GitHub at all.
		const cached = await getCachedRender("streak", cacheKey);
		if (cached && Date.now() < cached.freshUntilMs) {
			diag.timing = { totalMs: Date.now() - t0 };
			diag.cache = {
				...(diag.cache as Record<string, unknown>),
				status: "hit",
				ageMs: Date.now() - cached.storedAtMs,
			};
			if (debug) {
				return sendDebugJson(res, {
					...diag,
					ok: true,
					stage: "done",
					render: { bytes: cached.svg.length, cacheSeconds },
				});
			}
			markCacheStatus(res, "hit");
			return sendSuccessSvg(res, cached.svg, cacheSeconds);
		}

		const recorder = createRecorder();
		await produceStreak(req, recorder.res, url, user);
		const captured = recorder.captured();
		diag.timing = { totalMs: Date.now() - t0 };

		// A non-SVG payload (the PNG/JSON compatibility branches) is not an
		// embeddable card, so it is never cached as one.
		const contentType = headerOf(captured, "content-type");
		const isSvg = !contentType || contentType.includes("svg");
		const bodyText = typeof captured.body === "string" ? captured.body : "";
		// The flow marks its own degraded payloads (`transient` for renderer
		// errors and upstream error SVGs) and its cached ones (`fallback` for a
		// body replayed from the filesystem cache); a real render sets nothing.
		// Only `transient` means "do not trust this body". A `fallback` body is a
		// perfectly good earlier render, so it is served as-is and promoted into
		// the render cache rather than being treated as a failure and replaced.
		const isErrorPayload = headerOf(captured, "x-cache-status") === "transient";

		// A fresh error card is precisely when the previous render is worth more
		// than the new one: keep the card visible and let upstream recover.
		if (isSvg && isErrorPayload && cached) {
			diag.cache = {
				...(diag.cache as Record<string, unknown>),
				status: "stale",
				ageMs: Date.now() - cached.storedAtMs,
			};
			if (debug) {
				return sendDebugJson(res, {
					...diag,
					ok: true,
					stage: "done",
					render: {
						bytes: cached.svg.length,
						cacheSeconds: STALE_SERVE_SECONDS,
					},
				});
			}
			markCacheStatus(res, "stale");
			return sendSuccessSvg(res, cached.svg, STALE_SERVE_SECONDS);
		}

		const freshCard = isSvg && !isErrorPayload && bodyText !== "";
		if (freshCard) {
			await setCachedRender("streak", cacheKey, bodyText, cacheSeconds);
		}
		diag.cache = {
			...(diag.cache as Record<string, unknown>),
			status: freshCard ? "miss" : "fallback",
		};

		if (debug) {
			return sendDebugJson(res, {
				...diag,
				ok: freshCard,
				stage: freshCard ? "done" : "error",
				...(freshCard
					? {
							render: { bytes: bodyText.length, cacheSeconds },
						}
					: { code: "STREAK_INTERNAL" }),
			});
		}

		// Replay the flow's own headers, status and body so the route keeps
		// honouring the content type the renderer chose.
		for (const [key, value] of captured.headers) {
			try {
				res.setHeader(key, value);
			} catch {}
		}
		// Error and compatibility paths already set their own X-Cache-Status
		// (transient); only a freshly rendered card reports `miss`.
		if (freshCard) markCacheStatus(res, "miss");
		res.status(captured.status);
		return res.send(captured.body as string);
	} catch (err) {
		return handleRouteError(req, res, err, {
			service: "streak",
			code: "STREAK_INTERNAL",
			debug: getDebugFlag(safeUrl(req, "/api/streak")),
			diag,
		});
	}
}

type Captured = {
	status: number;
	headers: [string, string][];
	body: unknown;
};

/**
 * A `VercelResponse`-shaped sink that records instead of writing.
 *
 * Lets the historical render flow run untouched while the wrapper inspects what
 * it produced - the only way to tell a real card from an error card, and so
 * decide whether to cache it or substitute the previous render.
 */
function createRecorder(): { res: VercelResponse; captured: () => Captured } {
	const headers: [string, string][] = [];
	let status = 200;
	let body: unknown = "";
	const res = {
		setHeader: (key: string, value: unknown) => {
			const lower = String(key).toLowerCase();
			const at = headers.findIndex(([k]) => k.toLowerCase() === lower);
			const entry: [string, string] = [String(key), String(value)];
			if (at >= 0) headers[at] = entry;
			else headers.push(entry);
			return res;
		},
		getHeader: (key: string) =>
			headers.find(([k]) => k.toLowerCase() === String(key).toLowerCase())?.[1],
		status: ((code: number) => {
			status = code;
			return res;
		}) as unknown as (code: number) => unknown,
		send: (payload: unknown) => {
			body = payload;
			return res;
		},
	};
	return {
		res: res as unknown as VercelResponse,
		captured: () => ({ status, headers, body }),
	};
}

/** First recorded header matching `name`, case-insensitively. */
function headerOf(captured: Captured, name: string): string {
	return (
		captured.headers.find(
			([k]) => k.toLowerCase() === name.toLowerCase(),
		)?.[1] ?? ""
	);
}
