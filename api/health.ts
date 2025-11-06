import type { VercelRequest, VercelResponse } from "@vercel/node";
import { resolveCacheSeconds, setCacheHeaders, setSvgHeaders } from "./_utils";

function svg(body: string) {
	return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="320" height="40" role="img" aria-label="${body}"><title>${body}</title><rect width="100%" height="100%" fill="#111827"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#F9FAFB" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">${body}</text></svg>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		const proto = (req.headers["x-forwarded-proto"] || "https").toString();
		const host = (req.headers.host || "localhost").toString();
		const url = new URL((req.url as string) || "/api/health", `${proto}://${host}`);

		const text = url.searchParams.get("text")?.trim() || "OK";
		const cacheSeconds = resolveCacheSeconds(url, ["HEALTH_CACHE_SECONDS", "CACHE_SECONDS"], 60);

		setSvgHeaders(res);
		setCacheHeaders(res, cacheSeconds);
		res.status(200);
		return res.send(svg(text));
	} catch (_e) {
		setSvgHeaders(res);
		res.status(200);
		return res.send(svg("OK"));
	}
}

