import {
	getUsername as _getUsername,
	isValidUsername as _isValidUsername,
	resolveCacheSeconds as _resolveCacheSeconds,
	safeUrl as _safeUrl,
	sendSuccessSvg as _sendSuccessSvg,
} from "./canonical/http_cache.js";

import { themes } from "./themes/registry.js";

export const isValidUsername = _isValidUsername;
export const getUsername = _getUsername;
export const resolveCacheSeconds = _resolveCacheSeconds;
export const safeUrl = _safeUrl;
export const sendSuccessSvg = _sendSuccessSvg;

/**
 * Every theme name the registry knows about.
 *
 * This used to be a hand-kept literal of four names, which silently rejected the
 * other 92: `?theme=radical` was deleted from the URL, and because the caller
 * never restored the original value the card fell back to its default palette.
 * The registry is the single source of truth and README already states there is
 * no static theme table to keep in sync, so derive it rather than duplicate it.
 *
 * It lives here rather than in `canonical/http_cache.js` because this is the
 * TypeScript layer: the canonical module is otherwise `.js` importing only
 * `.js`, and a `.js` file reaching into a `.ts` module is a resolution the
 * bundler is not asked to handle anywhere else in the repo.
 */
export const ALLOWED_THEMES = new Set(Object.keys(themes));

/**
 * Lowercased name -> canonical registry spelling.
 *
 * Lookups are case-insensitive because a query param is user input, but the
 * canonical spelling is what has to go downstream: `supported` in the renderer is
 * keyed by the exact registry name, and those are not all lowercase -
 * `codeSTACKr` is one of them - so a lowercased name would miss.
 */
const CANONICAL_THEME_NAMES = new Map(
	[...ALLOWED_THEMES].map((name) => [name.toLowerCase(), name]),
);

/**
 * Drop unsupported names from a `theme` param, keeping the ones that resolve.
 *
 * A `theme=a,b` value previously skipped validation entirely because the guard
 * tested `!value.includes(",")`, so a typo in either half reached the renderer.
 * Each name is now checked on its own and rewritten to its canonical spelling;
 * the param is removed only when nothing in it is a real theme, so
 * `theme=radical,bogus` renders `radical` rather than being discarded wholesale.
 */
export function filterThemeParam(url: URL, key = "theme"): void {
	const raw = url.searchParams.get(key);
	if (!raw) return;
	const kept: string[] = [];
	for (const part of raw.split(",")) {
		const canonical = CANONICAL_THEME_NAMES.get(part.trim().toLowerCase());
		if (canonical) kept.push(canonical);
	}
	if (kept.length === 0) {
		url.searchParams.delete(key);
		return;
	}
	const joined = kept.join(",");
	if (joined !== raw) {
		url.searchParams.set(key, joined);
	}
}

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
