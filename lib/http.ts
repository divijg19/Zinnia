import type { VercelResponse } from "@vercel/node";
import { setEtagAndAlwaysSend200 } from "./canonical/http_cache.js";

/**
 * Forward a web-standard `Response` body to a `VercelResponse` under the
 * repo's embed contract.
 *
 * Upstream `status` / `cache-control` / `etag` are deliberately IGNORED: a
 * compiled handler may answer 304-empty, carry stale cache headers, or use
 * an error status, and some embedders treat a bare 304 as an error. We
 * always send 200 + the full body with a freshly computed ETag (never a
 * bare 304). Callers set SVG / cache headers themselves before forwarding.
 *
 * Returns `null` (without touching `res`) when the upstream body is empty
 * so the caller can fall through to its local renderer.
 */
export async function forwardWebResponseToVercel(
	res: VercelResponse,
	webRes: Response,
	defaultContentType = "image/svg+xml; charset=utf-8",
) {
	const body = Buffer.from(await webRes.arrayBuffer()).toString("utf-8");
	if (!body) return null;

	const ct = webRes.headers.get("content-type") || defaultContentType;
	if (ct) {
		try {
			res.setHeader("Content-Type", ct);
		} catch {}
	}

	setEtagAndAlwaysSend200(res, body);
	res.status(200);
	return res.send(body);
}
