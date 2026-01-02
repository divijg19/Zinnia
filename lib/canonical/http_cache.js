import crypto from "node:crypto";

// Runtime JS shim for lib/canonical/http_cache.ts
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

export function setCacheHeaders(res, seconds) {
	res.setHeader(
		"Cache-Control",
		`public, max-age=${seconds}, s-maxage=${seconds}, stale-while-revalidate=43200, must-revalidate`,
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

export function setFallbackCacheHeaders(res, seconds) {
	const s = Math.max(60, Math.min(seconds, 604800));
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

export function getUsername(url, keys = ["username", "user"]) {
	for (const k of keys) {
		const v = url.searchParams.get(k);
		if (isValidUsername(v)) return v;
	}
	return null;
}

export const ALLOWED_THEMES = new Set(["watchdog", "light", "dark", "onedark"]);

export function filterThemeParam(url, key = "theme") {
	const raw = url.searchParams.get(key);
	if (!raw) return;
	const value = raw.trim().toLowerCase();
	if (!ALLOWED_THEMES.has(value) && !value.includes(",")) {
		url.searchParams.delete(key);
	}
}

export function computeEtag(body) {
	const hash = crypto.createHash("sha1").update(body, "utf8").digest("hex");
	return hash.slice(0, 16);
}

// Delegate cache operations to api/cache implementation
import * as cache from "../../api/cache.js";

export async function writeTrophyCache(url, body) {
	return cache.writeCache("trophy", url, body);
}

export async function readTrophyCache(url) {
	return cache.readCache("trophy", url);
}

export async function readTrophyCacheWithMeta(url) {
	return cache.readCacheWithMeta("trophy", url);
}

export async function writeTrophyCacheWithMeta(url, body, etag, ttlSeconds) {
	return cache.writeCacheWithMeta("trophy", url, body, etag, ttlSeconds);
}

export const genericCache = cache;

export function getCacheAdapterForService(service) {
	return {
		get: async (key) => {
			try {
				return await cache.readCache(service, String(key));
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

export function setEtagAndMaybeSend304(reqHeaders, res, body) {
	const etag = computeEtag(body);
	const quoted = `"${etag}"`;
	res.setHeader("ETag", quoted);
	const inm = reqHeaders["if-none-match"] ?? reqHeaders["If-None-Match"];
	const inmValue = Array.isArray(inm) ? inm[0] : inm;
	if (inmValue) {
		const norm = String(inmValue).replace(/^W\//i, "").replace(/^"|"$/g, "");
		if (norm === etag) {
			try {
				if (typeof res.status === "function") res.status(304);
			} catch {
				// ignore
			}
			return true;
		}
	}
	return false;
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
	computeEtag,
	writeTrophyCache,
	readTrophyCache,
	readTrophyCacheWithMeta,
	writeTrophyCacheWithMeta,
	genericCache: cache,
	getCacheAdapter: getCacheAdapterForService,
	getCacheAdapterForService,
	setEtagAndMaybeSend304,
};
