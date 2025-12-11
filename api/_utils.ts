import crypto from "node:crypto";

// Minimal response-like interface used by handlers across runtimes (Vercel,
// mocked ResponseLike in streak, lightweight Response wrappers). This keeps
// header-setting code generic so helper functions can be reused without
// importing heavy runtime types in packages that define their own Response
// shapes.
export type ResponseLike = {
	setHeader: (name: string, value: string) => unknown;
	status?: (code: number) => unknown;
};

/**
 * Resolve cache seconds using a per-request ?cache override, env fallbacks, and safe bounds.
 * - Bounds: [0, 604800] (7 days)
 */
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

/**
 * Apply a standard Cache-Control policy for SVG endpoints.
 */
export function setCacheHeaders(res: ResponseLike, seconds: number) {
	res.setHeader(
		"Cache-Control",
		`public, max-age=${seconds}, s-maxage=${seconds}, stale-while-revalidate=43200, must-revalidate`,
	);
}

/**
 * Ensure SVG response headers are correct for GitHub embeds and proxies.
 */
export function setSvgHeaders(res: ResponseLike) {
	res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
	res.setHeader("X-Content-Type-Options", "nosniff");
	// Ensure caches and proxies vary on encoding so compressed responses are
	// correctly served.
	res.setHeader("Vary", "Accept-Encoding");
}

/**
 * Use for short-lived/transient responses (errors, upstream 404s, local fallbacks).
 * Keeps TTL small so clients revalidate quickly when upstream recovers.
 */
export function setShortCacheHeaders(res: ResponseLike, seconds = 60) {
	const s = Math.max(0, Math.min(seconds, 3600));
	res.setHeader(
		"Cache-Control",
		`public, max-age=${s}, s-maxage=${s}, stale-while-revalidate=30, must-revalidate`,
	);
	// Mark as transient/fallback so debugging and caches can treat differently.
	res.setHeader("X-Cache-Status", "transient");
}

/**
 * Use when serving a cached "last-known-good" payload. These are safe to
 * serve longer to reduce visible outages, but mark them as fallbacks so
 * clients and observability can detect degraded responses.
 */
export function setFallbackCacheHeaders(res: ResponseLike, seconds: number) {
	const s = Math.max(60, Math.min(seconds, 604800));
	// Allow a reasonable stale-while-revalidate so caches can serve old copy
	// while revalidating upstream.
	const swr = Math.min(86400, Math.max(60, Math.floor(s / 2)));
	res.setHeader(
		"Cache-Control",
		`public, max-age=${s}, s-maxage=${s}, stale-while-revalidate=${swr}`,
	);
	res.setHeader("X-Cache-Status", "fallback");
}

/** Username must be 1..39 chars, alnum or dash. */
export function isValidUsername(username: string | null | undefined): boolean {
	if (!username) return false;
	return /^[A-Za-z0-9-]{1,39}$/.test(username);
}

/** Try to read a username from common keys and validate it. */
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

/** Allowed themes across services. Extend cautiously. */
export const ALLOWED_THEMES = new Set<string>([
	"watchdog",
	"light",
	"dark",
	"onedark",
	"dracula",
	"radical",
	"tokyonight",
	"merko",
	"github_dark",
]);

/** Remove unsupported theme values; keep if allowlisted. */
export function filterThemeParam(url: URL, key = "theme") {
	const raw = url.searchParams.get(key);
	if (!raw) return;
	const value = raw.trim().toLowerCase();
	if (!ALLOWED_THEMES.has(value) && !value.includes(",")) {
		// allow light,dark pair for services that support it
		url.searchParams.delete(key);
	}
}

/** Compute a stable SHA1-based ETag for a response body. */
export function computeEtag(body: string): string {
	const hash = crypto.createHash("sha1").update(body, "utf8").digest("hex");
	// Use first 16 hex chars per spec and return without quotes
	return hash.slice(0, 16);
}

// Delegate cache operations to the generic cache module so multiple
// services can reuse the same implementation (see `api/cache.ts`).
export { computeEtag as computeCacheKey } from "./cache.js";

// --- Backwards-compatible wrappers that delegate to `api/cache.ts` ---
// This keeps existing handlers/tests working while enabling a generic
// cache implementation.
import * as cache from "./cache.js";

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

/**
 * Set ETag and honor If-None-Match. Returns true if a 304 was sent and
 * the caller should stop further writes.
 */
export function setEtagAndMaybeSend304(
	reqHeaders: Record<string, unknown>,
	res: ResponseLike,
	body: string,
): boolean {
	const etag = computeEtag(body);
	// Use a quoted ETag per RFC; make comparisons tolerant of weak/quoted values.
	const quoted = `"${etag}"`;
	res.setHeader("ETag", quoted);
	const inm = (reqHeaders["if-none-match"] ?? reqHeaders["If-None-Match"]) as
		| string
		| string[]
		| undefined;
	const inmValue = Array.isArray(inm) ? inm[0] : inm;
	if (inmValue) {
		// Normalize: remove weak prefix W/, strip surrounding quotes, then compare.
		const norm = String(inmValue).replace(/^W\//i, "").replace(/^"|"$/g, "");
		if (norm === etag) {
			// Prefer to signal a 304-match by setting status if available.
			// Some runtimes (mini ResponseLike) may not implement `status`.
			try {
				if (typeof res.status === "function") res.status(304);
			} catch {
				// ignore
			}
			// Caller may choose to send a full body instead of an empty 304.
			return true;
		}
	}
	return false;
}
