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
