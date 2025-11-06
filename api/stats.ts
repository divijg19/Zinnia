import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
	filterThemeParam,
	getUsername,
	resolveCacheSeconds,
	setCacheHeaders,
	setEtagAndMaybeSend304,
	setSvgHeaders,
} from "./_utils";

function svg(body: string, errCode?: string) {
	const comment = errCode ? `\n<!-- ZINNIA_ERR:${errCode} -->` : "";
	return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" role="img" aria-label="${body}"><title>${body}</title><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f9fafb" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">${body}</text></svg>${comment}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		if (
			!process.env.PAT_1 &&
			!process.env.PAT_2 &&
			!process.env.PAT_3 &&
			!process.env.PAT_4 &&
			!process.env.PAT_5
		) {
			setSvgHeaders(res);
			res.status(200);
			const body = svg("Set PAT_1 in Vercel for stats", "E_NO_PAT");
			if (setEtagAndMaybeSend304(req.headers as any, res, body))
				return res.send("");
			return res.send(body);
		}
		// Use the Request-based TS handler to avoid Express coupling and bundling surprises.
		// Import the JS handler to avoid runtime .ts resolution issues on serverless
		const { default: statsRequestHandler } = (await import(
			"../stats/api/index.js"
		)) as { default: (req: Request) => Promise<Response> };
		const proto = (req.headers["x-forwarded-proto"] || "https").toString();
		const host = (req.headers.host || "localhost").toString();
		const url = new URL(
			(req.url as string) || "/api/stats",
			`${proto}://${host}`,
		);
		// sanitize basic inputs
		const uname = getUsername(url, ["username"]);
		if (!uname) {
			setSvgHeaders(res);
			res.status(200);
			const body = svg("Missing or invalid ?username=", "E_BAD_INPUT");
			if (setEtagAndMaybeSend304(req.headers as any, res, body))
				return res.send("");
			return res.send(body);
		}
		filterThemeParam(url);
		const fullUrl = url.toString();
		const headers = new Headers();
		for (const [k, v] of Object.entries(
			req.headers as Record<string, string>,
		)) {
			if (typeof v === "string") headers.set(k, v);
		}
		const webReq = new Request(fullUrl, { method: req.method, headers });
		const webRes = await statsRequestHandler(webReq as unknown as Request);
		const body = await webRes.text();
		setSvgHeaders(res);
		const cacheSeconds = resolveCacheSeconds(
			url,
			["STATS_CACHE_SECONDS", "CACHE_SECONDS"],
			86400,
		);
		const cacheHeader = webRes.headers.get("cache-control");
		if (cacheHeader) {
			res.setHeader("Cache-Control", cacheHeader);
		} else {
			setCacheHeaders(res, cacheSeconds);
		}
		res.status(200);
		if (setEtagAndMaybeSend304(req.headers as any, res, body))
			return res.send("");
		return res.send(body);
	} catch (_err) {
		setSvgHeaders(res);
		res.status(200);
		const body = svg("stats: internal error", "E_INTERNAL");
		if (setEtagAndMaybeSend304(req.headers as any, res, body))
			return res.send("");
		return res.send(body);
	}
}
