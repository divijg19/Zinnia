import type { VercelResponse } from "@vercel/node";
import {
	computeEtag as _computeEtag,
	resolveCacheSeconds as _resolveCacheSeconds,
	setCacheHeaders as _setCacheHeaders,
	setEtagAndMaybeSend304 as _setEtagAndMaybeSend304,
	setSvgHeaders as _setSvgHeaders,
} from "./canonical/http_cache";

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
