import {
	ALLOWED_THEMES as _ALLOWED_THEMES,
	filterThemeParam as _filterThemeParam,
	getUsername as _getUsername,
	isValidUsername as _isValidUsername,
	resolveCacheSeconds as _resolveCacheSeconds,
	safeUrl as _safeUrl,
	sendFallbackSvg as _sendFallbackSvg,
	sendShortSvg as _sendShortSvg,
	sendSuccessSvg as _sendSuccessSvg,
} from "./canonical/http_cache.js";

export const isValidUsername = _isValidUsername;
export const getUsername = _getUsername;
export const ALLOWED_THEMES = _ALLOWED_THEMES;
export const filterThemeParam = _filterThemeParam;
export const resolveCacheSeconds = _resolveCacheSeconds;
export const safeUrl = _safeUrl;
export const sendSuccessSvg = _sendSuccessSvg;
export const sendShortSvg = _sendShortSvg;
export const sendFallbackSvg = _sendFallbackSvg;

export function parseBoolean(value: string | undefined): boolean | undefined {
	if (typeof value !== "string") return undefined;
	const v = value.toLowerCase();
	if (v === "true") return true;
	if (v === "false") return false;
	return undefined;
}

export function parseArray(value: string | undefined): string[] {
	if (!value) return [];
	return value
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
}

export function parseNumber(value: string | undefined): number | undefined {
	if (!value) return undefined;
	const n = Number(value);
	if (Number.isFinite(n)) return n;
	return undefined;
}

/** `?debug=1` / `?debug=true` diagnostics flag shared by card routes. */
export function getDebugFlag(url: URL): boolean {
	const debugParam = (url.searchParams.get("debug") || "").toLowerCase();
	return debugParam === "1" || debugParam === "true";
}
