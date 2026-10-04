// Canonical cache/response implementation. Vercel bundles api/**/*.ts with
// no TS transpile for this path, so the runtime copy is plain JS; it is the
// source of truth (all importers resolve this file).

// How long a shared cache may serve a fresh body past its TTL while it
// refreshes behind the request. A day absorbs a slow origin refresh without
// letting an expired card linger indefinitely.
const STALE_WHILE_REVALIDATE_SECONDS = 86400;

// How long a shared cache may serve a body when revalidation *fails*. This is
// the directive that keeps a GitHub outage from blanking every README embed:
// the reader keeps the last good card instead of Camo's error response.
const STALE_IF_ERROR_SECONDS = 86400;

// Ceiling for a fallback body's advertised freshness. See
// `setFallbackCacheHeaders`.
const FALLBACK_MAX_SECONDS = 3600;

export function resolveCacheSeconds(url, envKeys, fallback) {
	const requested = url.searchParams.get("cache");
	let envDefault;
	for (const key of envKeys) {
		const raw = process.env[key];
		if (raw && !Number.isNaN(parseInt(raw, 10))) {
			envDefault = parseInt(raw, 10);
			break;
		}
	}
	const base = envDefault ?? fallback;
	const value = Math.min(
		Math.max(parseInt(requested || "", 10), 0) || base,
		604800,
	);
	return value;
}

/**
 * Fresh renders. `must-revalidate` is deliberately absent: paired with
 * `stale-while-revalidate` it forbids serving stale, so every TTL expiry made
 * the first visitor wait out the full cold path - and GitHub Camo gives up
 * after 10s, turning an expiry into a blank embed until a refresh. Without it,
 * an expiry is served instantly from the cached body while the origin refreshes
 * behind it. `stale-if-error` covers the same case when that refresh fails.
 */
export function setCacheHeaders(res, seconds) {
	res.setHeader(
		"Cache-Control",
		`public, max-age=${seconds}, s-maxage=${seconds}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}, stale-if-error=${STALE_IF_ERROR_SECONDS}`,
	);
}

export function setSvgHeaders(res) {
	res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
	res.setHeader("X-Content-Type-Options", "nosniff");
	res.setHeader("Vary", "Accept-Encoding");
	res.setHeader("Access-Control-Allow-Origin", "*");
}

export function setShortCacheHeaders(res, seconds = 60) {
	const s = Math.max(0, Math.min(seconds, 3600));
	res.setHeader(
		"Cache-Control",
		`public, max-age=${s}, s-maxage=${s}, stale-while-revalidate=30, must-revalidate`,
	);
	res.setHeader("X-Cache-Status", "transient");
}

/**
 * A previously rendered body being served in place of a failed refresh.
 *
 * Capped at an hour: Camo honours this `max-age`, so a fallback advertised for
 * a week would pin an out-of-date card in every reader's browser for a week
 * with no way to recover short of purging Camo by hand.
 */
export function setFallbackCacheHeaders(res, seconds) {
	const s = Math.max(60, Math.min(seconds, FALLBACK_MAX_SECONDS));
	const swr = Math.min(86400, Math.max(60, Math.floor(s / 2)));
	res.setHeader(
		"Cache-Control",
		`public, max-age=${s}, s-maxage=${s}, stale-while-revalidate=${swr}`,
	);
	res.setHeader("X-Cache-Status", "fallback");
}

export function isValidUsername(username) {
	if (!username) return false;
	return /^[A-Za-z0-9-]{1,39}$/.test(username);
}

// Request shape needed for URL parsing (subset of VercelRequest).
export function safeUrl(req, fallbackPath) {
	const host = String(req.headers.host ?? req.headers.Host ?? "localhost");
	const proto = String(
		req.headers["x-forwarded-proto"] ??
			req.headers["X-Forwarded-Proto"] ??
			"http",
	);
	const raw = req.url || fallbackPath;
	try {
		if (/^https?:\/\//i.test(raw)) return new URL(raw);
		return new URL(raw, `${proto}://${host}`);
	} catch {
		return new URL(fallbackPath, `${proto}://${host}`);
	}
}

export function getUsername(url, keys = ["username", "user"]) {
	for (const k of keys) {
		const v = url.searchParams.get(k);
		if (isValidUsername(v)) return v;
	}
	return null;
}

/**
 * Headers worth forwarding to an upstream service.
 *
 * Deliberately an allowlist: forwarding the whole inbound header bag would let
 * a caller inject `host`, `content-length` or hop-by-hop headers into the
 * upstream request.
 *
 * `cookie` is deliberately absent. An allowlist that included it would hand the
 * viewer's own session cookies to a third party on any direct hit of the card
 * URL, and the LeetCode GraphQL query needs no authentication at all - it reads
 * public profile data. There is nothing to gain and a credential to leak.
 */
const FORWARDABLE_REQUEST_HEADERS = ["referer", "user-agent"];

/**
 * Adapt a `{ get, set }` service adapter to the Web `Cache` interface.
 *
 * `getCacheAdapterForService` speaks `{ get, set }`, but the LeetCode core takes
 * a real `Cache` and calls `match()` and `put()` in three places: user data in
 * `card.ts`, plus `exts/font.ts` and `exts/remote-style.ts` for subresources.
 * Handing it the bare adapter made `this.cache?.match(...)` throw
 * `TypeError: this.cache.match is not a function` on every request, which the
 * fetch error path turned into an error card for the whole route.
 *
 * `put` forwards the TTL rather than leaving it undefined: `get()` only enforces
 * expiry when the stored `ttl` is a finite number, so a write without one would
 * produce an entry that never expires. The core encodes its own intent in the
 * response's `cache-control: max-age`, so that is the value to propagate.
 *
 * @param {{ get: (key: string) => Promise<unknown>, set: (key: string, value: string, ttlSeconds?: number) => Promise<void> }} adapter
 * @returns {{ match: (key: string) => Promise<Response | undefined>, put: (key: string, response: Response) => Promise<void> }}
 */
export function asWebCache(adapter) {
	return {
		async match(key) {
			const body = await adapter.get(key);
			if (body === null || body === undefined) return undefined;
			return new Response(String(body));
		},
		async put(key, response) {
			const cacheControl = response.headers.get("cache-control") || "";
			const maxAge = /max-age=(\d+)/.exec(cacheControl);
			await adapter.set(
				key,
				await response.text(),
				maxAge ? Number(maxAge[1]) : undefined,
			);
		},
	};
}

/**
 * Pick the allowlisted headers off an inbound request for an upstream call.
 *
 * LeetCode's GraphQL endpoint is fronted by infrastructure that rejects
 * anonymous-looking requests, and the card route was passing `{}` - so every
 * embed view went out headerless. `leetcode/api/index.ts` took the caller's
 * headers as a parameter for exactly this reason.
 *
 * @param {Record<string, string | string[] | undefined> | undefined | null} headers inbound headers
 * @param {string[]} [allowed] header names to forward
 * @returns {Record<string, string>} forwardable headers
 */
export function pickForwardedHeaders(
	headers,
	allowed = FORWARDABLE_REQUEST_HEADERS,
) {
	const out = {};
	if (!headers || typeof headers !== "object") return out;
	for (const name of allowed) {
		const value = headers[name];
		if (typeof value === "string" && value.length > 0) {
			out[name] = value;
		}
	}
	return out;
}

import * as cache from "../../api/cache.js";
// Cache operations and the etag hash both live in api/cache (the
// filesystem layer); re-export rather than reimplement so the digest
// algorithm has exactly one definition.

export const computeEtag = cache.computeEtag;

export const genericCache = cache;

export function getCacheAdapterForService(service) {
	return {
		// Reads honor the TTL embedded in the entry's meta file: `writeCacheWithMeta`
		// persists `ttlSeconds` and `ts`, and an expired entry is treated as a miss
		// so a stale rendered SVG cannot be served forever.
		get: async (key) => {
			try {
				const entry = await cache.readCacheWithMeta(service, String(key));
				if (!entry) return null;
				if (typeof entry.ttl === "number" && Number.isFinite(entry.ttl)) {
					const wroteAt = typeof entry.ts === "number" ? entry.ts : 0;
					if (wroteAt > 0 && Date.now() - wroteAt > entry.ttl * 1000) {
						return null;
					}
				}
				return entry.body;
			} catch {
				return null;
			}
		},
		set: async (key, value, ttlSeconds) => {
			try {
				const etag = computeEtag(String(value));
				await cache.writeCacheWithMeta(
					service,
					String(key),
					value,
					etag,
					ttlSeconds,
				);
			} catch {
				// best-effort
			}
		},
	};
}

export function getCacheAdapter(service) {
	return getCacheAdapterForService(service);
}

// Response send helpers. Always 200 + full body with ETag set;
// never 304-empty (embedders treat empty 304 as an error).
export function sendSuccessSvg(res, body, cacheSeconds) {
	setSvgHeaders(res);
	setCacheHeaders(res, cacheSeconds);
	setEtagAndAlwaysSend200(res, body);
	res.status(200);
	return res.send(body);
}

export function sendShortSvg(res, body, seconds = 60) {
	setSvgHeaders(res);
	setShortCacheHeaders(res, seconds);
	setEtagAndAlwaysSend200(res, body);
	res.status(200);
	return res.send(body);
}

export function sendFallbackSvg(res, body, seconds) {
	setSvgHeaders(res);
	setFallbackCacheHeaders(res, seconds);
	setEtagAndAlwaysSend200(res, body);
	res.status(200);
	return res.send(body);
}
export function setEtagAndAlwaysSend200(res, body) {
	res.setHeader("ETag", `"${computeEtag(body)}"`);
}

export default {
	resolveCacheSeconds,
	setCacheHeaders,
	setSvgHeaders,
	setShortCacheHeaders,
	setFallbackCacheHeaders,
	isValidUsername,
	getUsername,
	asWebCache,
	pickForwardedHeaders,
	safeUrl,
	computeEtag,
	genericCache: cache,
	getCacheAdapter: getCacheAdapterForService,
	getCacheAdapterForService,
	setEtagAndAlwaysSend200,
	sendSuccessSvg,
	sendShortSvg,
	sendFallbackSvg,
};
