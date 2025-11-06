import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendErrorSvg } from "../lib/errors.ts";
import { filterThemeParam, getUsername } from "../lib/params.ts";
import { getGithubPAT } from "../lib/tokens.ts";
import {
	resolveCacheSeconds,
	setCacheHeaders,
	setEtagAndMaybeSend304,
	setSvgHeaders,
} from "./_utils.ts";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		if (!getGithubPAT()) {
			return sendErrorSvg(
				req,
				res,
				"Set PAT_1 in Vercel for stats",
				"STATS_RATE_LIMIT",
			);
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
			return sendErrorSvg(req, res, "Missing or invalid ?username=", "UNKNOWN");
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
		return sendErrorSvg(req, res, "stats: internal error", "STATS_INTERNAL");
	}
}
