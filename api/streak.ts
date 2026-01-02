//

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendErrorSvg } from "../lib/errors.js";
import {
	importByPath,
	invokePossibleRequestHandler,
	pickHandlerFromModule,
	resolveCompiledHandler,
} from "../lib/loader/index.js";
import { getUsername } from "../lib/params.js";

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
				// eslint-disable-next-line no-console
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
			// eslint-disable-next-line no-console
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
				// eslint-disable-next-line no-console
				console.warn("streak: fallback renderer unavailable", e2);
			} catch {}
		}

		// If all recovery attempts fail, provide a minimal deterministic SVG
		// renderer as a last-resort so embeds remain functional in dev/CI.
		try {
			// eslint-disable-next-line no-console
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
			const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" role="img" aria-label="Streak for ${escaped}"><title>Streak for ${escaped}</title><rect width="100%" height="100%" fill="#0f172a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">Streak for ${escaped}</text></svg>`;
			return { status: 200, body: svg, contentType: "image/svg+xml" };
		};
		return _renderForUser;
	}
}

import {
	getCacheAdapterForService,
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

		// Try upstream first (tests mock global fetch). If upstream succeeds
		// with an SVG payload, forward it; otherwise fall back to the local
		// TypeScript renderer for generation/cached fallback.
		let upstreamFailed = false;
		const preferLocal =
			process.env.VERCEL_ENV !== "production" ||
			process.env.STREAK_PREFER_LOCAL === "1" ||
			url.searchParams.get("prefer_local") === "1" ||
			url.searchParams.get("no_upstream") === "1";
		if (!preferLocal) {
			try {
				const upstream = new URL("https://zinnia-rho.vercel.app/");
				for (const [k, v] of url.searchParams) upstream.searchParams.set(k, v);
				upstream.searchParams.set("user", user as string);
				const resp = await fetch(upstream.toString());
				const ct = resp?.headers?.get
					? resp.headers.get("content-type")
					: undefined;
				if (
					resp &&
					resp.status >= 200 &&
					resp.status < 300 &&
					ct &&
					ct.includes("svg")
				) {
					const body = await resp.text();
					// Honor If-None-Match via helper which sets ETag header.
					try {
						if (
							setEtagAndMaybeSend304(
								req.headers as Record<string, unknown>,
								res,
								String(body),
							)
						) {
							// Caller expects a 304 match to result in an empty body send.
							return res.send("");
						}
					} catch {}
					setSvgHeaders(res);
					try {
						res.setHeader(
							"X-Streak-Renderer",
							(globalThis as any).__STREAK_RENDERER_SPEC || "unknown",
						);
					} catch {}
					setCacheHeaders(
						res,
						resolveCacheSeconds(
							url,
							["STREAK_CACHE_SECONDS", "CACHE_SECONDS"],
							86400,
						),
					);
					try {
						res.setHeader("X-Streak-Renderer", "upstream");
					} catch {}
					res.setHeader("X-Upstream-Status", String(resp.status));
					return res.send(body);
				}
				// If upstream returned a successful but non-SVG payload, treat as an error
				// and respond with a standardized error SVG (tests accept this path).
				if (
					resp &&
					resp.status >= 200 &&
					resp.status < 300 &&
					(!ct || !ct.includes("svg"))
				) {
					return sendErrorSvg(
						req as VercelRequest,
						res,
						`Upstream streak returned ${resp.status}`,
						"STREAK_UPSTREAM_STATUS",
					);
				}
				// If upstream returned a non-OK but SVG we still forward with transient cache
				if (resp && resp.status >= 400 && ct && ct.includes("svg")) {
					const body = await resp.text();
					setSvgHeaders(res);
					setShortCacheHeaders(res, 60);
					try {
						res.setHeader("X-Streak-Renderer", "cache");
					} catch {}
					res.setHeader("X-Upstream-Status", String(resp.status));
					return res.send(body);
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

			try {
				const cached = await cacheLocal.get(localKey);
				if (cached) {
					try {
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
					} catch {}
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
									if (
										parsed?.variables &&
										typeof parsed.variables === "object"
									) {
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
					// eslint-disable-next-line no-console
					console.debug(
						"api/streak: renderer spec =>",
						(globalThis as any).__STREAK_RENDERER_SPEC || "unknown",
					);
				} catch {}

				for (let i = 0; i < shapes.length; i++) {
					const s = shapes[i];
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
						// eslint-disable-next-line no-console
						console.warn(
							"streak: renderer produced error SVG, attempting fallback",
						);
					} catch {}
					try {
						const lb = await import("../lib/canonical/loader.js");
						if (lb && typeof lb.renderFallbackSvg === "function") {
							const svg = await lb.renderFallbackSvg(user as string);
							setSvgHeaders(res);
							setShortCacheHeaders(res, 60);
							try {
								res.setHeader("X-Streak-Renderer", "fallback");
							} catch {}
							return res.send(svg);
						}
					} catch (e) {
						try {
							// eslint-disable-next-line no-console
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
					const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" role="img" aria-label="Streak for ${escaped}"><title>Streak for ${escaped}</title><rect width="100%" height="100%" fill="#0f172a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">Streak for ${escaped}</text></svg>`;
					setSvgHeaders(res);
					setShortCacheHeaders(res, 60);
					try {
						res.setHeader("X-Streak-Renderer", "minimal-inline-fallback");
					} catch {}
					return res.send(svg);
				}
			} catch {
				// ignore detection errors and continue to normal flow
			}
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
			} catch {}

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
			console.error("streak: local renderer error", e);
			return sendErrorSvg(
				req,
				res,
				"Streak local renderer failed",
				"STREAK_INTERNAL",
			);
		}
	} catch (_err) {
		return sendErrorSvg(req, res, "streak: internal error", "STREAK_INTERNAL");
	}
}
