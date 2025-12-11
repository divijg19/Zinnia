import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
	resolveCacheSeconds,
	setEtagAndMaybeSend304,
	setShortCacheHeaders,
	setSvgHeaders,
} from "./_utils.js";

function svg(body: string) {
	return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="320" height="40" role="img" aria-label="${body}"><title>${body}</title><rect width="100%" height="100%" fill="#111827"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#F9FAFB" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">${body}</text></svg>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		const proto = (req.headers["x-forwarded-proto"] || "https").toString();
		const host = (req.headers.host || "localhost").toString();
		const url = new URL(
			(req.url as string) || "/api/health",
			`${proto}://${host}`,
		);

		const text = url.searchParams.get("text")?.trim() || "OK";
		const cacheSeconds = resolveCacheSeconds(
			url,
			["HEALTH_CACHE_SECONDS", "CACHE_SECONDS"],
			60,
		);

		setSvgHeaders(res);
		// Health checks are transient; keep short TTL so status updates quickly.
		setShortCacheHeaders(res, cacheSeconds);
		res.status(200);
		const body = svg(text);
		if (
			setEtagAndMaybeSend304(req.headers as Record<string, unknown>, res, body)
		) {
			// Send full body with 200 to avoid embedders treating empty 304 as error
			res.status(200);
			return res.send(body);
		}
		return res.send(body);
	} catch (_e) {
		setSvgHeaders(res);
		// On error return a short-lived health response
		setShortCacheHeaders(res, 60);
		res.status(200);
		const body = svg("OK");
		if (
			setEtagAndMaybeSend304(req.headers as Record<string, unknown>, res, body)
		) {
			res.status(200);
			return res.send(body);
		}
		return res.send(body);
	}
}
