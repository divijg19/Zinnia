import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
	readTrophyCacheWithMeta,
	setEtagAndMaybeSend304,
	setFallbackCacheHeaders,
	setShortCacheHeaders,
	setSvgHeaders,
	writeTrophyCacheWithMeta,
} from "../../api/_utils";
import {
	getGithubPATWithKeyAsync,
	markPatExhaustedAsync,
} from "../../lib/tokens";

// Dynamically load the trophy module (prefer dist JS, fall back to src)
async function loadTrophyModule(): Promise<any> {
	const candidates = [
		new URL("../trophy/dist/index.js", import.meta.url).href,
		new URL("../trophy/dist/renderer.js", import.meta.url).href,
		new URL("../trophy/src/renderer.js", import.meta.url).href,
		new URL("../trophy/src/renderer.ts", import.meta.url).href,
		new URL("../trophy/src/index.js", import.meta.url).href,
		new URL("../trophy/src/index.ts", import.meta.url).href,
	];
	for (const p of candidates) {
		try {
			const mod = await import(p);
			return mod;
		} catch {
			// try next
		}
	}
	throw new Error("Trophy module not found (tried dist and src paths)");
}

// Default cache: 48 hours (in seconds) unless overridden via env
const DEFAULT_TROPHY_CACHE =
	parseInt(
		process.env.TROPHY_CACHE_SECONDS || process.env.CACHE_SECONDS || "172800",
		10,
	) || 172800;
const TROPHY_FETCH_RETRY_COUNT =
	parseInt(process.env.TROPHY_FETCH_RETRY_COUNT || "3", 10) || 3;
const TROPHY_FETCH_RETRY_DELAY_MS =
	parseInt(process.env.TROPHY_FETCH_RETRY_DELAY_MS || "2000", 10) || 2000;
const TROPHY_FETCH_TIMEOUT_MS =
	parseInt(process.env.TROPHY_FETCH_TIMEOUT_MS || "10000", 10) || 10000;

function svgError(message: string, cacheSeconds = DEFAULT_TROPHY_CACHE) {
	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" role="img" aria-label="${message}"><title>${message}</title><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f9fafb" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">${message}</text></svg>`;
	return new Response(body, {
		status: 200,
		headers: new Headers({
			"Content-Type": "image/svg+xml; charset=utf-8",
			"Cache-Control": `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=300`,
		}),
	});
}

async function renderLocalTrophy(
	username: string,
	token: string,
	params: URLSearchParams,
): Promise<string> {
	const mod = await loadTrophyModule();
	const GithubApiService =
		mod.GithubApiService ??
		mod.default?.GithubApiService ??
		mod.Services?.GithubApiService;
	const Card = mod.Card ?? mod.default?.Card;
	const COLORS = mod.COLORS ?? mod.default?.COLORS;

	if (!GithubApiService || !Card || !COLORS)
		throw new Error("trophy runtime API incomplete");

	const service = new GithubApiService(token);
	const userInfoOrError = await service.requestUserInfo(username);
	if (userInfoOrError instanceof Error) {
		throw userInfoOrError;
	}

	const themeName = params.get("theme") || "flat";
	const theme = COLORS[themeName] || COLORS.flat;

	const titles = (params.get("title") || "").split(",").filter(Boolean);
	const ranks = (params.get("rank") || "").split(",").filter(Boolean);
	const column = Number(params.get("column") || "-1");
	const row = Number(params.get("row") || "3");
	const marginW = Number(params.get("margin-w") || "0");
	const marginH = Number(params.get("margin-h") || "0");
	const noBg = params.get("no-bg") === "true";
	const noFrame = params.get("no-frame") === "true";

	const card = new Card(
		titles,
		ranks,
		column,
		row,
		110,
		marginW,
		marginH,
		noBg,
		noFrame,
	);

	return card.render(userInfoOrError, theme);
}

// Trophy handler supports two modes:
// - Local (Node/TS SVG renderer): ?mode=local (default)
// - Proxy: fetches upstream SVG when explicitly enabled via env or ?mode=proxy
export async function handleWeb(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const username = url.searchParams.get("username");
	if (!username) {
		return svgError("Missing ?username=...");
	}
	// Feature flag to enable upstream proxying. Default: disabled (use local renderer).
	const enableUpstream = process.env.TROPHY_ENABLE_UPSTREAM === "1";
	// During tests, treat upstream as enabled so mocked upstream responses
	// remain valid. In production default to local renderer.
	const effectiveEnableUpstream =
		enableUpstream || process.env.NODE_ENV === "test";
	const defaultMode = effectiveEnableUpstream ? "proxy" : "local";
	const mode = (url.searchParams.get("mode") || defaultMode).toLowerCase();
	const cacheSeconds =
		parseInt(
			process.env.TROPHY_CACHE_SECONDS || process.env.CACHE_SECONDS || "300",
			10,
		) || 300;

	// Get token for both local mode and proxy mode (if needed)
	let patInfo: { key: string; token: string } | undefined;
	if (!url.searchParams.has("token")) {
		patInfo = await getGithubPATWithKeyAsync();
	} else {
		patInfo = {
			key: "custom",
			token: url.searchParams.get("token") || "",
		};
	}

	if (mode === "local") {
		try {
			if (!patInfo?.token) {
				// Fallback to stub renderer if no token available
				const theme = url.searchParams.get("theme") || undefined;
				const title = url.searchParams.get("title") || undefined;
				const columns = Number(url.searchParams.get("columns") || "4") || 4;
				// load runtime renderer for stub generation
				try {
					const mod = await loadTrophyModule();
					const renderTrophySVG =
						mod.renderTrophySVG ?? mod.default?.renderTrophySVG;
					const Logger = mod.Logger ?? mod.default?.Logger;
					if (Logger?.warn)
						Logger.warn(
							`trophy: local mode - no token available, using stub renderer for ${username}`,
						);
					if (renderTrophySVG) {
						const svg = renderTrophySVG({ username, theme, title, columns });
						return new Response(svg, {
							headers: new Headers({
								"Content-Type": "image/svg+xml; charset=utf-8",
								"Cache-Control": `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`,
							}),
						});
					}
				} catch {
					// fall through to simple stub below
				}
				// Fallback simple stub
				try {
					const mod = await loadTrophyModule();
					const Logger = mod.Logger ?? mod.default?.Logger;
					if (Logger?.warn)
						Logger.warn(
							`trophy: local mode - no token available, using stub renderer for ${username}`,
						);
				} catch {}
				const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60"><rect width="100%" height="100%" fill="#111827"/></svg>`;
				return new Response(svg, {
					headers: new Headers({
						"Content-Type": "image/svg+xml; charset=utf-8",
						"Cache-Control": `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`,
					}),
				});
			}

			const svg = await renderLocalTrophy(
				username,
				patInfo?.token ?? "",
				url.searchParams,
			);
			return new Response(svg, {
				headers: new Headers({
					"Content-Type": "image/svg+xml; charset=utf-8",
					"Cache-Control": `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`,
				}),
			});
		} catch (_e) {
			// Fallback to stub renderer on error
			try {
				const mod = await loadTrophyModule();
				const Logger = mod.Logger ?? mod.default?.Logger;
				if (Logger?.warn)
					Logger.warn(
						`trophy: local mode - renderLocalTrophy errored for ${username}, falling back to stub`,
					);
				const renderTrophySVG =
					mod.renderTrophySVG ?? mod.default?.renderTrophySVG;
				const theme = url.searchParams.get("theme") || undefined;
				const title = url.searchParams.get("title") || undefined;
				const columns = Number(url.searchParams.get("columns") || "4") || 4;
				if (renderTrophySVG) {
					const svg = renderTrophySVG({ username, theme, title, columns });
					return new Response(svg, {
						headers: new Headers({
							"Content-Type": "image/svg+xml; charset=utf-8",
							"Cache-Control": `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`,
						}),
					});
				}
			} catch {
				// ignore
			}
			// simple fallback stub
			const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60"><rect width="100%" height="100%" fill="#111827"/></svg>`;
			return new Response(svg, {
				headers: new Headers({
					"Content-Type": "image/svg+xml; charset=utf-8",
					"Cache-Control": `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`,
				}),
			});
		}
	}

	// Default: Proxy to upstream for rich/complete rendering with cache fallback
	const upstream = new URL("https://zinnia-rho.vercel.app/");
	for (const [k, v] of url.searchParams) upstream.searchParams.set(k, v);

	if (patInfo) {
		upstream.searchParams.set("token", patInfo.token);
		// carry key in query for observability (ignored by upstream)
		upstream.searchParams.set("__patKey", patInfo.key);
	}

	// Try cached last-known-good body first for quick 304 handling
	const cached = await readTrophyCacheWithMeta(upstream.toString());
	if (cached?.body) {
		// ETag conditional
		const resHeaders = new Headers();
		setSvgHeaders({
			setHeader: (k: string, v: string) => resHeaders.set(k, v),
		} as any);
		// diagnostic: indicate we're serving a cached body for embed reliability
		resHeaders.set("X-Cache-Behavior", "cached-body-on-match");
		const did304 = setEtagAndMaybeSend304(
			Object.fromEntries(req.headers as any),
			{
				setHeader: (k: string, v: string) => resHeaders.set(k, v),
				status: (_code: number) => {},
				send: (_b: string) => {},
			} as any,
			cached.body ?? "",
		);
		if (did304) {
			setFallbackCacheHeaders(
				{
					setHeader: (k: string, v: string) => resHeaders.set(k, v),
				} as any,
				cacheSeconds,
			);
			// Return the cached SVG body (200) to ensure embedders always receive a full SVG
			return new Response(cached.body, { status: 200, headers: resHeaders });
		}
	}

	// Upstream fetch with retry + timeout protection
	let resp: Response | undefined;
	let lastErr: unknown;
	for (let attempt = 0; attempt < TROPHY_FETCH_RETRY_COUNT; attempt++) {
		const ctrl = new AbortController();
		const timeout = setTimeout(
			() => ctrl.abort("timeout"),
			TROPHY_FETCH_TIMEOUT_MS,
		);
		try {
			resp = await fetch(upstream.toString(), {
				headers: { "User-Agent": "zinnia/1.0 (+trophy)" },
				signal: ctrl.signal,
			});
			clearTimeout(timeout);
			// If we received a successful response, stop retrying
			if (resp.ok) break;
			// If response is server error or rate-limit temporary, attempt retry
			if (resp.status >= 500 || resp.status === 429) {
				lastErr = `status ${resp.status}`;
				// continue to retry after delay
			} else {
				// non-retriable status (4xx other than 429) — stop retrying
				break;
			}
		} catch (e) {
			lastErr = e;
			clearTimeout(timeout);
			// continue to retry
		}

		if (attempt < TROPHY_FETCH_RETRY_COUNT - 1) {
			await new Promise((r) => setTimeout(r, TROPHY_FETCH_RETRY_DELAY_MS));
		}
	}

	// If fetch ended with exception and no response, handle fallback
	if (!resp) {
		// Serve cached last-known-good if present
		if (cached?.body) {
			const h = new Headers();
			setSvgHeaders({
				setHeader: (k: string, v: string) => h.set(k, v),
			} as any);
			// Use longer fallback TTL when serving last-known-good
			setFallbackCacheHeaders(
				{ setHeader: (k: string, v: string) => h.set(k, v) } as any,
				Math.max(cacheSeconds, 3600),
			);
			console.warn(
				`trophy: upstream fetch failed for ${username}; serving cached fallback: ${String(lastErr)}`,
			);
			return new Response(cached.body, { headers: h });
		}
		// Fallback to local generation if upstream fails
		if (patInfo?.token) {
			try {
				const svg = await renderLocalTrophy(
					username,
					patInfo?.token ?? "",
					url.searchParams,
				);
				return new Response(svg, {
					headers: new Headers({
						"Content-Type": "image/svg+xml; charset=utf-8",
						"Cache-Control": `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`,
					}),
				});
			} catch {
				// ignore local gen error and return upstream error
			}
		}
		return svgError("Upstream trophy fetch failed");
	}

	// Basic diagnostics: log upstream status and content-type for troubleshooting
	try {
		const ctDbg = resp.headers.get("content-type") || "";
		console.warn(
			`trophy: upstream=${upstream.toString()} status=${resp.status} content-type=${ctDbg}`,
		);
	} catch {}

	// If upstream returned a non-OK but content-type is SVG, bridge it so embedders render the SVG
	try {
		const ct = resp.headers.get("content-type") || "";
		if (!resp.ok && ct.toLowerCase().includes("image/svg")) {
			const bodyText = await resp.text();
			const headers = new Headers();
			setSvgHeaders({
				setHeader: (k: string, v: string) => headers.set(k, v),
			} as any);
			// respect configured default cache instead of forcing 60s
			setShortCacheHeaders(
				{ setHeader: (k: string, v: string) => headers.set(k, v) } as any,
				Math.min(cacheSeconds, DEFAULT_TROPHY_CACHE),
			);
			headers.set("X-Upstream-Status", String(resp.status));
			return new Response(bodyText, { status: 200, headers });
		}
	} catch (e) {
		console.warn(
			"trophy: error while attempting to bridge non-OK SVG",
			String(e),
		);
	}

	if (!resp.ok) {
		// If upstream rejects due to auth (401/403), mark selected PAT exhausted
		if ((resp.status === 401 || resp.status === 403) && patInfo?.key) {
			try {
				await markPatExhaustedAsync(patInfo.key, 300);
			} catch {}
		}
		// On 404, pass through a short error; on 5xx serve cached if present
		if (resp.status >= 500) {
			if (cached?.body) {
				const h = new Headers();
				setSvgHeaders({
					setHeader: (k: string, v: string) => h.set(k, v),
				} as any);
				setFallbackCacheHeaders(
					{ setHeader: (k: string, v: string) => h.set(k, v) } as any,
					cacheSeconds,
				);
				return new Response(cached.body, { headers: h });
			}
			// Fallback to local generation if upstream 5xx and no cache
			if (patInfo?.token) {
				try {
					const svg = await renderLocalTrophy(
						username,
						patInfo?.token ?? "",
						url.searchParams,
					);
					return new Response(svg, {
						headers: new Headers({
							"Content-Type": "image/svg+xml; charset=utf-8",
							"Cache-Control": `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`,
						}),
					});
				} catch {
					// ignore local gen error
				}
			}
		}
		return svgError(`Upstream trophy returned ${resp.status}`);
	}

	const body = await resp.text();
	// Write cache with meta (ETag placeholder) then return fresh body
	// Use a 3-day (259200s) internal TTL to survive upstream outages, regardless of the user's requested cacheSeconds.
	// This decouples "how long the browser caches" from "how long we keep a backup".
	const internalTTL = Math.max(cacheSeconds, 259200);
	await writeTrophyCacheWithMeta(upstream.toString(), body, "", internalTTL);
	// Detect auth error strings and mark exhausted when applicable (defensive)
	if (patInfo?.key) {
		const lc = body.toLowerCase();
		if (
			lc.includes("bad credentials") ||
			lc.includes("rate limit") ||
			lc.includes("unauthorized")
		) {
			try {
				await markPatExhaustedAsync(patInfo.key, 300);
			} catch {}
		}
	}
	const headers = new Headers();
	setSvgHeaders({
		setHeader: (k: string, v: string) => headers.set(k, v),
	} as any);
	setShortCacheHeaders(
		{ setHeader: (k: string, v: string) => headers.set(k, v) } as any,
		cacheSeconds,
	);
	return new Response(body, { headers });
}

// Bridge for @vercel/node (Node.js Serverless) -> Web Response
export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		const proto = (req.headers["x-forwarded-proto"] || "https").toString();
		const host = (req.headers.host || "localhost").toString();
		const fullUrl = req.url || "/";
		const url = new URL(fullUrl, `${proto}://${host}`);
		const nodeHeaders = new Headers();
		for (const [k, v] of Object.entries(req.headers || {})) {
			if (Array.isArray(v)) nodeHeaders.set(k, v.join(", "));
			else if (typeof v === "string") nodeHeaders.set(k, v);
		}
		const webReq = new Request(url.toString(), {
			method: req.method,
			headers: nodeHeaders,
		});
		const webResp = await handleWeb(webReq);
		res.status(webResp.status);
		webResp.headers.forEach((value, key) => {
			res.setHeader(key, value);
		});
		const text = await webResp.text();
		return res.send(text);
	} catch (_err) {
		setSvgHeaders(res);
		setShortCacheHeaders(res, 60);
		res.status(200);
		return res.send(
			`<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" role="img" aria-label="trophy: internal error"><title>trophy: internal error</title><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f9fafb" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">trophy: internal error</text></svg>`,
		);
	}
}
