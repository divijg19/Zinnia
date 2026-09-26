/**
 * Shared status/error card SVG.
 *
 * Seven call sites previously inlined this exact template (lib/errors.ts,
 * leetcode/api, streak/api, trophy/api). The card is intentionally identical
 * everywhere: a 600x60 dark card with the message in the title, aria-label and
 * body text. Keep it in one place so a design change cannot drift per package.
 */

/**
 * Escape the XML metacharacters used in this card's double-quoted attributes
 * and text nodes. Matches the escaping api/health.ts already applies. The
 * inline templates this replaces interpolated messages raw, so a message
 * containing markup (e.g. a LeetCode sanitize error surfaced verbatim) used
 * to emit broken or injected SVG.
 */
function escapeXml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

/**
 * Render the status card. `marker` appends a trailing HTML comment carrying a
 * machine-readable code (used by the route error path so embedders and tests
 * can identify the failure); omit it for plain status/handler-failure cards.
 */
export function statusCardSvg(
	message: string,
	marker?: string,
	width = 600,
	height = 60,
): string {
	const safe = escapeXml(message);
	return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" role="img" aria-label="${safe}"><title>${safe}</title><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f9fafb" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">${safe}</text></svg>${marker ? `\n<!-- ${marker} -->` : ""}`;
}
