import type { VercelRequest, VercelResponse } from "@vercel/node";
import { resolveCacheSeconds, safeUrl, sendShortSvg } from "./_utils.js";

function escapeXml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function svg(body: string) {
	return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="320" height="40" role="img" aria-label="${body}"><title>${body}</title><rect width="100%" height="100%" fill="#111827"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#F9FAFB" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">${body}</text></svg>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		const url = safeUrl(req, "/api/health");

		const text = escapeXml(url.searchParams.get("text")?.trim() || "OK");
		const cacheSeconds = resolveCacheSeconds(
			url,
			["HEALTH_CACHE_SECONDS", "CACHE_SECONDS"],
			60,
		);

		// Health checks are transient; keep short TTL so status updates quickly.
		const body = svg(text);
		// Always 200 + full body with ETag set (never 304-empty).
		return sendShortSvg(res, body, cacheSeconds);
	} catch (_e) {
		// On error return a short-lived health response
		const body = svg("OK");
		return sendShortSvg(res, body, 60);
	}
}
