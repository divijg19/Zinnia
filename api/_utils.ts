import type { VercelResponse } from "@vercel/node";

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
export function setCacheHeaders(res: VercelResponse, seconds: number) {
    res.setHeader(
        "Cache-Control",
        `public, max-age=${seconds}, s-maxage=${seconds}, stale-while-revalidate=43200, must-revalidate`,
    );
}

/**
 * Ensure SVG response headers are correct for GitHub embeds and proxies.
 */
export function setSvgHeaders(res: VercelResponse) {
    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("X-Content-Type-Options", "nosniff");
}
