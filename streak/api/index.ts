// Streak proxy: fetch SVG from upstream service so we stay Node-only in this monorepo
// and keep embeds compatible. Supports both ?user= and ?username=.

import {
	setCacheHeaders,
	setShortCacheHeaders,
	setSvgHeaders,
} from "../../api/_utils.js";
import type { RequestLike, ResponseLike } from "../src/server_types";
import type { Stats } from "../src/stats";
import type { ContributionDay } from "../src/types";

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
				// If STREAK_USE_TS is explicitly enabled (`"1"` or `"true"`),
				// prefer local source imports so tests and dev mocks take effect.
				const explicitUseTs =
					_useTsEnv === "1" || String(_useTsEnv).toLowerCase() === "true";

				const tryImport = async (base: string) => {
					try {
						return await import(`${base}.js`);
					} catch (_e) {
						return await import(`${base}.ts`);
					}
				};

				let coreMod: unknown = null;
				// Prefer source modules when explicitly requested (STREAK_USE_TS=1),
				// otherwise try the bundled `dist` first for production behavior.
				if (!explicitUseTs) {
					try {
						coreMod = await tryImport("../dist/index");
					} catch {
						coreMod = null;
					}
				}
				let fetchContributions:
					| ((user: string) => Promise<ContributionDay[]>)
					| undefined;
				let getContributionStats:
					| ((days: ContributionDay[]) => Stats)
					| undefined;
				let getWeeklyContributionStats:
					| ((days: ContributionDay[]) => Stats)
					| undefined;
				// `generateOutput` is preferred; individual `generateCard` is not used here.
				let getCache:
					| (() => Promise<{
							get: (k: string) => Promise<string | null>;
							set: (k: string, v: string, ttl: number) => Promise<void>;
					  }>)
					| undefined;
				let THEMES: Record<string, Record<string, string>> | undefined;
				if (coreMod) {
					// bundled single-module exports
					// Narrow exported members with runtime checks to avoid `any` leaks.
					if (typeof coreMod === "object" && coreMod !== null) {
						const c = coreMod as Record<string, unknown>;
						if (typeof c.fetchContributions === "function")
							fetchContributions = c.fetchContributions as (
								user: string,
							) => Promise<ContributionDay[]>;
						if (typeof c.getContributionStats === "function")
							getContributionStats = c.getContributionStats as (
								days: ContributionDay[],
							) => Stats;
						if (typeof c.getWeeklyContributionStats === "function")
							getWeeklyContributionStats = c.getWeeklyContributionStats as (
								days: ContributionDay[],
							) => Stats;
						if (typeof c.getCache === "function")
							getCache = c.getCache as () => Promise<{
								get: (k: string) => Promise<string | null>;
								set: (k: string, v: string, ttl: number) => Promise<void>;
							}>;
					}
					// themes may still be present under a separate module; attempt to load
					try {
						const themesMod = await tryImport("../src/themes");
						if (themesMod && typeof themesMod === "object") {
							THEMES =
								((themesMod as Record<string, unknown>).THEMES as Record<
									string,
									Record<string, string>
								>) ?? {};
						} else {
							THEMES = {};
						}
					} catch {
						THEMES = {};
					}
				}

				if (!coreMod) {
					// fall back to per-module imports for dev (or when explicitly asked)
					const fetcherMod = await tryImport("../src/fetcher");
					const statsMod = await tryImport("../src/stats");
					const themesMod = await tryImport("../src/themes");
					const cacheMod = await tryImport("../src/cache");
					if (fetcherMod && typeof fetcherMod === "object") {
						const f = fetcherMod as Record<string, unknown>;
						if (typeof f.fetchContributions === "function")
							fetchContributions = f.fetchContributions as (
								user: string,
							) => Promise<ContributionDay[]>;
					}
					if (statsMod && typeof statsMod === "object") {
						const s = statsMod as Record<string, unknown>;
						if (typeof s.getContributionStats === "function")
							getContributionStats = s.getContributionStats as (
								days: ContributionDay[],
							) => Stats;
						if (typeof s.getWeeklyContributionStats === "function")
							getWeeklyContributionStats = s.getWeeklyContributionStats as (
								days: ContributionDay[],
							) => Stats;
					}
					// `generateCard` may exist in older bundles but we prefer `generateOutput`.
					if (cacheMod && typeof cacheMod === "object") {
						const cacheM = cacheMod as Record<string, unknown>;
						if (typeof cacheM.getCache === "function")
							getCache = cacheM.getCache as () => Promise<{
								get: (k: string) => Promise<string | null>;
								set: (k: string, v: string, ttl: number) => Promise<void>;
							}>;
					}
					if (themesMod && typeof themesMod === "object") {
						THEMES =
							((themesMod as Record<string, unknown>).THEMES as Record<
								string,
								Record<string, string>
							>) ?? {};
					} else {
						THEMES = {};
					}
				}

				// Ensure a safe cache object is available. If `getCache` wasn't
				// provided by the imported module, fall back to a no-op cache.
				const noopCache = {
					get: async (_: string) => null as string | null,
					set: async (_: string, _v: string, _ttl: number) => undefined,
				};

				let cache: {
					get: (k: string) => Promise<string | null>;
					set: (k: string, v: string, ttl: number) => Promise<void>;
				} = noopCache;
				if (typeof getCache === "function") {
					try {
						cache = await getCache();
					} catch {
						cache = noopCache;
					}
				}

				const paramsObj = Object.fromEntries(url.searchParams);
				// If a theme name was provided, merge its values into paramsObj
				try {
					const themeName = (url.searchParams.get("theme") || "").toString();
					if (themeName && THEMES && THEMES[themeName]) {
						// normalize legacy snake_case keys using shared helper
						// eslint-disable-next-line @typescript-eslint/no-var-requires
						const {
							normalizeThemeKeys,
						} = require("../../lib/theme-helpers.ts");
						const normalized = normalizeThemeKeys(
							THEMES[themeName] as Record<string, string | undefined>,
						);
						// If the theme provides a gradient background token (comma-separated),
						// explicitly preserve it on `background` so downstream rendering
						// receives the raw token instead of only individual solid-color keys.
						try {
							const bgVal = normalized.background;
							if (typeof bgVal === "string" && bgVal.includes(",")) {
								if (!("background" in paramsObj)) paramsObj.background = bgVal;
							}
						} catch {
							// ignore
						}
						for (const [k, v] of Object.entries(normalized)) {
							// Do not overwrite an explicit background param if present.
							if (k === "background") continue;
							if (!(k in paramsObj) && v !== undefined)
								paramsObj[k] = v as string;
						}
					}
				} catch (_e) {
					// ignore theme merge failures
				}
				const cacheKey = `streak:svg:${user}:${JSON.stringify(paramsObj)}`;
				const cached = await cache.get(cacheKey);

				// Helper: compute ETag (sha1 first 16 hex chars)
				const computeEtag = (body: string) => {
					try {
						// lazy require to avoid import issues in some runtimes
						// eslint-disable-next-line @typescript-eslint/no-var-requires
						const crypto = require("node:crypto");
						const hash = crypto
							.createHash("sha1")
							.update(body, "utf8")
							.digest("hex");
						return hash.slice(0, 16);
					} catch {
						return "";
					}
				};

				if (cached) {
					// If client has matching ETag, respond 304
					const etag = computeEtag(cached);
					// Quote ETag per RFC and compare tolerantly to quoted/weak If-None-Match
					res.setHeader("ETag", `"${etag}"`);
					const inm = (
						req.headers["if-none-match"] ||
						req.headers["If-None-Match"] ||
						""
					).toString();
					const inmNorm = inm.replace(/^W\//i, "").replace(/^"|"$/g, "");
					if (inm && inmNorm === etag) {
						// Client's ETag matches cached payload — return the cached
						// SVG body with 200 so embedders receive valid content.
						res.status(200);
						return res.send(cached);
					}

					// Cache hit: return cached payload
					setSvgHeaders(res);
					res.setHeader("X-Cache-Status", "hit");
					res.status(200);
					return res.send(cached);
				}

				if (typeof fetchContributions !== "function") {
					throw new Error("streak: fetchContributions not available");
				}
				const days = (await fetchContributions(user)) as ContributionDay[];
				// Respect mode parameter (weekly/daily)
				const modeParam =
					url.searchParams.get("mode") || url.searchParams.get("period");
				let stats: Stats;
				if (modeParam === "weekly") {
					if (typeof getWeeklyContributionStats !== "function") {
						throw new Error("streak: weekly stats not available");
					}
					stats = getWeeklyContributionStats(days);
				} else {
					if (typeof getContributionStats !== "function") {
						throw new Error("streak: contribution stats not available");
					}
					stats = getContributionStats(days as ContributionDay[]);
				}

				// Prefer the module's `generateOutput` which handles sanitization
				// and optional PNG conversion. This centralizes output creation
				// so ETag/cache decisions use the final body.
				let out: { contentType: string; body: string | Buffer } | null = null;
				try {
					if (
						coreMod &&
						typeof coreMod === "object" &&
						typeof (coreMod as Record<string, unknown>).generateOutput ===
							"function"
					) {
						out = (await (coreMod as Record<string, any>).generateOutput(
							stats,
							paramsObj,
						)) as {
							contentType: string;
							body: string | Buffer;
						};
					} else {
						// fall back to importing the local index module which exports generateOutput
						const idx = await import("../src/index");
						if (idx && typeof idx.generateOutput === "function") {
							out = (await idx.generateOutput(stats, paramsObj)) as {
								contentType: string;
								body: string | Buffer;
							};
						}
					}
				} catch (e) {
					// If module-level rendering fails, surface an error and fall back
					// to upstream behavior below.
					console.error(
						"streak: module generateOutput failed",
						e instanceof Error ? e.message : String(e),
					);
					out = null;
				}

				if (!out) throw new Error("streak: generateOutput not available");

				const cacheSeconds =
					parseInt(
						process.env.STREAK_CACHE_SECONDS ||
							process.env.CACHE_SECONDS ||
							"300",
						10,
					) || 300;

				// Only cache/svg-etag for SVG bodies (keep PNGs as-is)
				if (
					out.contentType === "image/svg+xml" &&
					typeof out.body === "string"
				) {
					try {
						void cache.set(cacheKey, out.body, cacheSeconds);
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

				// For PNG or other content types, send directly with appropriate headers
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
				// If TS path fails, log the error. Only fall back to upstream
				// if `STREAK_ENABLE_UPSTREAM=1` is set; otherwise return an SVG error.
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
				console.error("streak: ts renderer failed", msg);
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
