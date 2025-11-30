import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendErrorSvg } from "../lib/errors.js";
import { filterThemeParam, getUsername } from "../lib/params.js";
import { getGithubPATAsync } from "../lib/tokens.js";
import {
	resolveCacheSeconds,
	setCacheHeaders,
	setEtagAndMaybeSend304,
	setShortCacheHeaders,
	setSvgHeaders,
} from "./_utils.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		const pat = await getGithubPATAsync();
		if (!pat) {
			return sendErrorSvg(
				req,
				res,
				"Set PAT_1 in Vercel for stats",
				"STATS_RATE_LIMIT",
			);
		}

		const { default: statsRequestHandler } = (await import(
			"../stats/api/index.js"
		)) as unknown as { default: (req: Request) => Promise<Response> };

		const proto = (req.headers["x-forwarded-proto"] || "https").toString();
		const host = (req.headers.host || "localhost").toString();
		const url = new URL(
			(req.url as string) || "/api/stats",
			`${proto}://${host}`,
		);

		const uname = getUsername(url, ["username"]);
		if (!uname) {
			return sendErrorSvg(req, res, "Missing or invalid ?username=", "UNKNOWN");
		}

		filterThemeParam(url);

		const headers = new Headers();
		for (const [k, v] of Object.entries(
			req.headers as Record<string, string>,
		)) {
			if (typeof v === "string") headers.set(k, v);
		}

		const webReq = new Request(url.toString(), { method: req.method, headers });
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
		} else if (webRes.status >= 500) {
			// Upstream error: mark transient so clients revalidate quickly.
			setShortCacheHeaders(res, Math.min(cacheSeconds, 60));
			res.setHeader("X-Cache-Status", "transient");
		} else {
			setCacheHeaders(res, cacheSeconds);
		}

		res.status(200);
		if (
			setEtagAndMaybeSend304(req.headers as Record<string, unknown>, res, body)
		)
			return res.send("");
		return res.send(body);
	} catch (_err) {
		return sendErrorSvg(req, res, "stats: internal error", "STATS_INTERNAL");
	}
}
