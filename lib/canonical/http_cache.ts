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

export function getUsername(url: URL, keys: string[] = ["username", "user"]): string | null {
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
        get: async (key: string) => {
            try {
                return await cache.readCache(service, String(key));
            } catch {
                return null;
            }
        },
        set: async (key: string, value: string, ttlSeconds?: number) => {
            try {
                const etag = computeEtag(String(value));
                await cache.writeCacheWithMeta(service, String(key), value, etag, ttlSeconds);
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

export function setEtagAndMaybeSend304(
    reqHeaders: Record<string, unknown>,
    res: ResponseLike,
    body: string,
): boolean {
    const etag = computeEtag(body);
    const quoted = `"${etag}"`;
    res.setHeader("ETag", quoted);
    const inm = (reqHeaders["if-none-match"] ?? reqHeaders["If-None-Match"]) as string | string[] | undefined;
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
    // keep old name available on the default export for compatibility
    getCacheAdapter: getCacheAdapterForService,
    getCacheAdapterForService,
    setEtagAndMaybeSend304,
};
