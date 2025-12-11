import type { VercelRequest, VercelResponse } from "@vercel/node";
// Use direct relative path to api/_utils to avoid ESM resolution issues in local Vercel dev
import {
	setEtagAndMaybeSend304,
	setShortCacheHeaders,
	setSvgHeaders,
} from "../api/_utils.js";

export type ErrorCode =
	| "STATS_RATE_LIMIT"
	| "STATS_INTERNAL"
	| "TOP_LANGS_INTERNAL"
	| "STREAK_UPSTREAM_FETCH"
	| "STREAK_UPSTREAM_STATUS"
	| "STREAK_INTERNAL"
	| "TROPHY_UPSTREAM_FETCH"
	| "TROPHY_UPSTREAM_STATUS"
	| "TROPHY_INTERNAL"
	| "LEETCODE_INVALID"
	| "LEETCODE_INTERNAL"
	| "UNKNOWN";

/** Minimal standard error SVG with hidden error code comment. */
export function svgError(
	message: string,
	code: ErrorCode = "UNKNOWN",
	width = 600,
	height = 60,
): string {
	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" role="img" aria-label="${message}"><title>${message}</title><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f9fafb" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">${message}</text></svg>\n<!-- ZINNIA_ERR:${code} -->`;
	return body;
}

/** Send a standardized error SVG on the provided response with cache+etag handling. */
export function sendErrorSvg(
	req: VercelRequest,
	res: VercelResponse,
	message: string,
	code: ErrorCode,
	ttlSeconds = 60,
) {
	const body = svgError(message, code);
	setSvgHeaders(res);
	// Error responses are transient; use a short cache TTL so clients
	// revalidate quickly when the service recovers.
	setShortCacheHeaders(res, ttlSeconds);
	res.setHeader("X-Cache-Status", "transient");
	// Diagnostic headers: only expose when explicitly enabled to avoid
	// accidentally leaking messages in public production environments.
	try {
		const expose = (
			process.env.ZINNIA_EXPOSE_ERROR_HEADERS || ""
		).toLowerCase();
		if (expose === "1" || expose === "true") {
			res.setHeader("X-Error-Code", code);
			const msg = String(message).slice(0, 200);
			res.setHeader("X-Error-Message", msg);
		}
	} catch {
		// ignore header failures
	}
	res.status(200);
	if (
		setEtagAndMaybeSend304(req.headers as Record<string, unknown>, res, body)
	) {
		// Ensure embedders receive a full SVG body (some clients treat 304 without
		// body as an error). Reset status to 200 and send the body.
		res.status(200);
		return res.send(body);
	}
	return res.send(body);
}
