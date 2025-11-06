import crypto from "node:crypto";
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
	return `"sha1-${hash}"`;
}

/**
 * Set ETag and honor If-None-Match. Returns true if a 304 was sent and
 * the caller should stop further writes.
 */
export function setEtagAndMaybeSend304(
	reqHeaders: Record<string, unknown>,
	res: VercelResponse,
	body: string,
): boolean {
	const etag = computeEtag(body);
	res.setHeader("ETag", etag);
	const inm = (reqHeaders["if-none-match"] ?? reqHeaders["If-None-Match"]) as
		| string
		| string[]
		| undefined;
	const inmValue = Array.isArray(inm) ? inm[0] : inm;
	if (inmValue && inmValue === etag) {
		// Not Modified
		res.status(304);
		// It is typical to omit body for 304
		return true;
	}
	return false;
}
