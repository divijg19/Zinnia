import crypto from "node:crypto";

export type ResponseLike = {
	setHeader: (name: string, value: string) => unknown;
	status?: (code: number) => unknown;
};

export function resolveCacheSeconds(
	url: URL,
	envKeys: string[],
	fallback: number,
): number {
	const requested = url.searchParams.get("cache");
	let envDefault: number | undefined;
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

export function setCacheHeaders(res: ResponseLike, seconds: number) {
	res.setHeader(
		"Cache-Control",
		`public, max-age=${seconds}, s-maxage=${seconds}, stale-while-revalidate=43200, must-revalidate`,
	);
}

export function setSvgHeaders(res: ResponseLike) {
	res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
	res.setHeader("X-Content-Type-Options", "nosniff");
	res.setHeader("Vary", "Accept-Encoding");
	res.setHeader("Access-Control-Allow-Origin", "*");
}

export function setShortCacheHeaders(res: ResponseLike, seconds = 60) {
	const s = Math.max(0, Math.min(seconds, 3600));
	res.setHeader(
		"Cache-Control",
		`public, max-age=${s}, s-maxage=${s}, stale-while-revalidate=30, must-revalidate`,
	);
	res.setHeader("X-Cache-Status", "transient");
}

export function setFallbackCacheHeaders(res: ResponseLike, seconds: number) {
	const s = Math.max(60, Math.min(seconds, 604800));
	const swr = Math.min(86400, Math.max(60, Math.floor(s / 2)));
	res.setHeader(
		"Cache-Control",
		`public, max-age=${s}, s-maxage=${s}, stale-while-revalidate=${swr}`,
	);
	res.setHeader("X-Cache-Status", "fallback");
}

export function isValidUsername(username: string | null | undefined): boolean {
	if (!username) return false;
	return /^[A-Za-z0-9-]{1,39}$/.test(username);
}

/** Request shape needed for URL parsing (subset of VercelRequest). */
export interface RequestLike {
	headers: Record<string, string | string[] | undefined>;
	url?: unknown;
}

/**
 * Build an absolute URL from a request, never throwing: malformed or
 * missing `req.url` falls back to `fallbackPath` on the request host.
 */
export function safeUrl(req: RequestLike, fallbackPath: string): URL {
	const host = String(req.headers.host ?? req.headers.Host ?? "localhost");
	const proto = String(
		req.headers["x-forwarded-proto"] ??
			req.headers["X-Forwarded-Proto"] ??
			"http",
	);
	const raw = (req.url as string | undefined) || fallbackPath;
	try {
		if (/^https?:\/\//i.test(raw)) return new URL(raw);
		return new URL(raw, `${proto}://${host}`);
	} catch {
		return new URL(fallbackPath, `${proto}://${host}`);
	}
}

export function getUsername(
	url: URL,
	keys: string[] = ["username", "user"],
): string | null {
	for (const k of keys) {
		const v = url.searchParams.get(k);
		if (isValidUsername(v)) return v as string;
	}
	return null;
}

export const ALLOWED_THEMES = new Set<string>([
	"watchdog",
	"light",
	"dark",
	"onedark",
]);

export function filterThemeParam(url: URL, key = "theme") {
	const raw = url.searchParams.get(key);
	if (!raw) return;
	const value = raw.trim().toLowerCase();
	if (!ALLOWED_THEMES.has(value) && !value.includes(",")) {
		url.searchParams.delete(key);
	}
}

export function computeEtag(body: string): string {
	const hash = crypto.createHash("sha1").update(body, "utf8").digest("hex");
	return hash.slice(0, 16);
}

// Delegate cache operations to api/cache implementation
import * as cache from "../../api/cache.js";

export async function writeTrophyCache(url: string, body: string) {
	return cache.writeCache("trophy", url, body);
}

export async function readTrophyCache(url: string) {
	return cache.readCache("trophy", url);
}

export async function readTrophyCacheWithMeta(url: string) {
	return cache.readCacheWithMeta("trophy", url);
}

export async function writeTrophyCacheWithMeta(
	url: string,
	body: string,
	etag: string,
	ttlSeconds?: number,
) {
	return cache.writeCacheWithMeta("trophy", url, body, etag, ttlSeconds);
}

export { cache as genericCache };

export type CacheAdapter = {
	get: (key: string) => Promise<string | null>;
	set: (key: string, value: string, ttlSeconds?: number) => Promise<void>;
};

export function getCacheAdapterForService(service: string): CacheAdapter {
	return {
		// Reads honor the TTL embedded in the entry's meta file: `writeCacheWithMeta`
		// persists `ttlSeconds` and `ts`, and an expired entry is treated as a miss
		// so a stale rendered SVG cannot be served forever.
		get: async (key: string) => {
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
		set: async (key: string, value: string, ttlSeconds?: number) => {
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

// Backwards-compatible alias used by older modules/tests: `getCacheAdapter`
export function getCacheAdapter(service: string): CacheAdapter {
	return getCacheAdapterForService(service);
}

/**
 * Formalized ETag contract for SVG card endpoints: always send `200` with the
 * full body, and always set the `ETag` header from that body.
 *
 * Many embedders (GitHub readme cards, dashboards) treat a `304` without a body
 * as an error and fail to render, so we never return `304` here. Setting `ETag`
 * still lets clients revalidate and reuse their cached copy on later requests.
 * This is purely HTTP revalidation; the internal cache layer (TTL/fallback, see
 * `getCacheAdapterForService`) is a separate concern and unaffected.
 */
export function setEtagAndAlwaysSend200(res: ResponseLike, body: string): void {
	res.setHeader("ETag", `"${computeEtag(body)}"`);
}

/** Response capable of carrying a full send (status + send). */
export type SendableResponse = ResponseLike & {
	status: (code: number) => unknown;
	send: (body: unknown) => unknown;
};

/**
 * Send a successful SVG response in one step: SVG headers, standard cache
 * headers, fresh ETag, explicit 200, full body. Always 200 + full body
 * with ETag set (never 304-empty, which some embedders treat as an error).
 */
export function sendSuccessSvg(
	res: SendableResponse,
	body: string,
	cacheSeconds: number,
): unknown {
	setSvgHeaders(res);
	setCacheHeaders(res, cacheSeconds);
	setEtagAndAlwaysSend200(res, body);
	res.status(200);
	return res.send(body);
}

/**
 * Send an SVG response with short transient caching (fallbacks, health
 * checks, bridged upstream payloads). Same always-200 + ETag contract.
 */
export function sendShortSvg(
	res: SendableResponse,
	body: string,
	seconds = 60,
): unknown {
	setSvgHeaders(res);
	setShortCacheHeaders(res, seconds);
	setEtagAndAlwaysSend200(res, body);
	res.status(200);
	return res.send(body);
}

/**
 * Send an SVG response with fallback caching (served-from-cache hits).
 * Same always-200 + ETag contract.
 */
export function sendFallbackSvg(
	res: SendableResponse,
	body: string,
	seconds: number,
): unknown {
	setSvgHeaders(res);
	setFallbackCacheHeaders(res, seconds);
	setEtagAndAlwaysSend200(res, body);
	res.status(200);
	return res.send(body);
}

export default {
	resolveCacheSeconds,
	setCacheHeaders,
	setSvgHeaders,
	setShortCacheHeaders,
	setFallbackCacheHeaders,
	isValidUsername,
	getUsername,
	ALLOWED_THEMES,
	filterThemeParam,
	safeUrl,
	computeEtag,
	writeTrophyCache,
	readTrophyCache,
	readTrophyCacheWithMeta,
	writeTrophyCacheWithMeta,
	genericCache: cache,
	// keep old name available on the default export for compatibility
	getCacheAdapter: getCacheAdapterForService,
	getCacheAdapterForService,
	setEtagAndAlwaysSend200,
	sendSuccessSvg,
	sendShortSvg,
	sendFallbackSvg,
};
