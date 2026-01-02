import type { VercelResponse } from "@vercel/node";
import {
	computeEtag as _computeEtag,
	resolveCacheSeconds as _resolveCacheSeconds,
	setCacheHeaders as _setCacheHeaders,
	setEtagAndMaybeSend304 as _setEtagAndMaybeSend304,
	setSvgHeaders as _setSvgHeaders,
} from "./canonical/http_cache.js";

export const resolveCacheSeconds = _resolveCacheSeconds;
export const setCacheHeaders = _setCacheHeaders;
export const setSvgHeaders = _setSvgHeaders;
export const computeEtag = _computeEtag;

export function setEtagAndMaybeSend304(
	reqHeaders: Record<string, unknown>,
	res: VercelResponse,
	body: string,
): boolean {
	return _setEtagAndMaybeSend304(reqHeaders, res, body);
}

/**
 * Forward a web-standard `Response` object to a `VercelResponse`.
 * Copies common headers (`content-type`, `cache-control`, `etag`) and
 * sends the response body as a Buffer.
 */
export async function forwardWebResponseToVercel(
	res: VercelResponse,
	webRes: Response,
	defaultContentType = "image/svg+xml; charset=utf-8",
) {
	const ct = webRes.headers.get("content-type") || defaultContentType;
	const cache = webRes.headers.get("cache-control");
	const etag = webRes.headers.get("etag");

	if (ct) {
		try {
			res.setHeader("Content-Type", ct);
		} catch {}
	}
	if (cache) {
		try {
			res.setHeader("Cache-Control", cache);
		} catch {}
	}
	if (etag) {
		try {
			res.setHeader("ETag", etag);
		} catch {}
	}

	const status =
		typeof (webRes as any).status === "number" ? (webRes as any).status : 200;
	res.status(status);

	const buf = Buffer.from(await webRes.arrayBuffer());
	return res.send(buf);
}
