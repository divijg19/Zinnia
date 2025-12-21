// Minimal, self-contained SVG card generator helpers for the streak project.
// Restores robust theme loading, deterministic gradient defs, and the
// exports tests expect: `formatDate`, `getRequestedTheme`, `normalizeThemeName`.

import {
	getExcludingDaysText,
	getTranslations,
	normalizeThemeName,
	parseBackgroundToken,
} from "./card_helpers.js";
import { THEMES as IMPORTED_THEMES } from "./themes.ts";
import type { Params, Stats, Theme } from "./types_public.ts";

/* eslint-disable @typescript-eslint/no-var-requires */
let THEMES: Record<string, Theme> = {};
let _themesLoaded = false;

// Small bounded LRU implementation for hot-path caches (keeps memory bounded)
class SimpleLRU<V> {
	#map: Map<string, V>;
	#max: number;

	constructor(max = 256) {
		this.#map = new Map();
		this.#max = max;
	}

	get(key: string): V | undefined {
		const v = this.#map.get(key);
		if (v === undefined) return undefined;
		// touch
		this.#map.delete(key);
		this.#map.set(key, v);
		return v;
	}

	set(key: string, value: V) {
		if (this.#map.has(key)) this.#map.delete(key);
		else if (this.#map.size >= this.#max) {
			const it = this.#map.keys().next();
			if (!it.done) this.#map.delete(it.value);
		}
		this.#map.set(key, value);
	}

	delete(key: string) {
		this.#map.delete(key);
	}

	has(key: string) {
		return this.#map.has(key);
	}

	clear() {
		this.#map.clear();
	}
}

// caches to avoid repeated allocations and hashing under load (bounded LRU)
const GRADIENT_CACHE = new SimpleLRU<{ id: string; def: string }>(256);
const DATE_FORMATTER_CACHE = new SimpleLRU<Intl.DateTimeFormat>(128);
const NUMBER_FORMATTER_CACHE = new SimpleLRU<Intl.NumberFormat>(128);
function loadThemesSync(): Record<string, Theme> {
	if (_themesLoaded) return THEMES;
	// Prefer the static import (Vitest/ESM). Fall back to require and normalize
	try {
		if (
			IMPORTED_THEMES &&
			typeof IMPORTED_THEMES === "object" &&
			Object.keys(IMPORTED_THEMES).length > 0
		) {
			THEMES = IMPORTED_THEMES as Record<string, Theme>;
			_themesLoaded = true;
			return THEMES;
		}
	} catch {}

	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const mod = require("./themes.js");
		let candidate: unknown =
			mod && (mod.THEMES || mod.default)
				? mod.THEMES || mod.default
				: mod || {};

		// If candidate looks like a single theme, try to recover a mapping by scanning
		if (candidate && typeof candidate === "object") {
			const keys = Object.keys(candidate);
			const looksLikeSingleTheme =
				keys.includes("background") ||
				keys.includes("border") ||
				keys.includes("stroke");
			if (looksLikeSingleTheme) {
				// attempt alternate resolution
				try {
					// eslint-disable-next-line @typescript-eslint/no-var-requires
					const alt = require("./themes");
					const altCandidate = alt && (alt.THEMES || alt.default || alt);
					if (altCandidate && typeof altCandidate === "object") {
						const altKeys = Object.keys(altCandidate);
						if (!altKeys.includes("background") && altKeys.length > 0)
							candidate = altCandidate;
					}
				} catch {}

				const recovered: Record<string, Theme> = {};
				for (const k of Object.keys(mod || {})) {
					const v = (mod as unknown as Record<string, Theme>)[k];
					if (v && typeof v === "object") {
						const raw = v as Record<string, string | undefined>;
						// normalize legacy snake_case keys to canonical names
						// use shared helper to keep behavior consistent across modules
						// eslint-disable-next-line @typescript-eslint/no-var-requires
						const {
							normalizeThemeKeys,
						} = require("../../lib/theme-helpers.ts");
						const normalized = normalizeThemeKeys(raw);
						const vk = Object.keys(normalized);
						if (
							vk.includes("background") ||
							vk.includes("border") ||
							vk.includes("stroke")
						) {
							recovered[k] = normalized as Theme;
						}
					}
				}
				if (Object.keys(recovered).length > 0) candidate = recovered;
				else candidate = { default: candidate };
			}
		}

		THEMES = candidate as Record<string, Theme>;
	} catch (e) {
		THEMES = {};
		if (process.env.DEBUG_THEMES) {
			try {
				console.debug("loadThemesSync require failed", String(e));
			} catch {}
		}
	}

	_themesLoaded = true;
	return THEMES;
}

// Use shared public types from `types_public.ts`

function getCardWidth(params: Params, numColumns = 3): number {
	const defaultWidth = 495;
	const minimumWidth = 100 * numColumns;
	return Math.max(
		minimumWidth,
		parseInt(String(params?.card_width ?? String(defaultWidth)), 10),
	);
}

function getCardHeight(params: Params): number {
	const defaultHeight = 195;
	const minimumHeight = 170;
	return Math.max(
		minimumHeight,
		parseInt(String(params?.card_height ?? String(defaultHeight)), 10),
	);
}

function formatDate(
	dateString: string,
	dateFormat?: string,
	locale = "en",
): string {
	if (!dateString) return dateString;
	try {
		const d = new Date(`${dateString}T00:00:00Z`);
		const year = d.getUTCFullYear();
		const month = d.getUTCMonth() + 1;
		const day = d.getUTCDate();

		if (dateFormat && typeof dateFormat === "string") {
			const currentYear = new Date().getUTCFullYear();
			const fmt = dateFormat.replace(/\[(.*?)\]/g, (_m, inner) =>
				year === currentYear ? "" : inner,
			);
			const shortMonth = (() => {
				const key = `${locale}|{"month":"short"}`;
				let dtf = DATE_FORMATTER_CACHE.get(key);
				if (!dtf) {
					dtf = new Intl.DateTimeFormat(locale, { month: "short" });
					DATE_FORMATTER_CACHE.set(key, dtf);
				}
				return dtf.format(d);
			})();
			return fmt
				.replace(/Y/g, String(year))
				.replace(/n/g, String(month))
				.replace(/j/g, String(day))
				.replace(/m/g, String(month).padStart(2, "0"))
				.replace(/d/g, String(day).padStart(2, "0"))
				.replace(/M/g, shortMonth);
		}

		// cached formatter for default date presentation
		const key = `en-US|{"month":"short","day":"numeric","year":"numeric"}`;
		let fmt = DATE_FORMATTER_CACHE.get(key);
		if (!fmt) {
			fmt = new Intl.DateTimeFormat("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
			});
			DATE_FORMATTER_CACHE.set(key, fmt);
		}
		return fmt.format(d);
	} catch {
		return dateString;
	}
}

function formatNumber(num: number, locale = "en", useShort = false): string {
	if (useShort) {
		const units = ["", "K", "M", "B", "T"];
		let n = num;
		let i = 0;
		while (n >= 1000 && i < units.length - 1) {
			n = n / 1000;
			i++;
		}
		return `${Math.round(n * 10) / 10}${units[i]}`;
	}
	try {
		let nf = NUMBER_FORMATTER_CACHE.get(locale);
		if (!nf) {
			nf = new Intl.NumberFormat(locale);
			NUMBER_FORMATTER_CACHE.set(locale, nf);
		}
		return nf.format(num);
	} catch {
		return String(num);
	}
}

function splitLines(
	text: string,
	maxChars: number,
	line1Offset: number,
): string {
	if (!text) return "";
	if (maxChars > 0 && text.length > maxChars && !text.includes("\n")) {
		const parts = text.match(new RegExp(`.{1,${maxChars}}(?:s|$)`, "g")) || [
			text,
		];
		if (parts.length > 1) {
			return `<tspan x='0' dy='${line1Offset}'>${parts[0].trim()}</tspan><tspan x='0' dy='16'>${parts.slice(1).join(" ").trim()}</tspan>`;
		}
	}
	if (text.includes("\n")) {
		const [a, b] = text.split(/\n/, 2);
		return `<tspan x='0' dy='${line1Offset}'>${a}</tspan><tspan x='0' dy='16'>${b}</tspan>`;
	}
	return text;
}

// `formatNumber` and `splitLines` existed in earlier ports but are not
// required by the unit tests currently exercised. Omit to avoid lint noise.

type ThemeWithGradient = Theme;

function getRequestedTheme(params: Params): ThemeWithGradient {
	const fallback: Record<string, string> = {
		background: "#000000",
		border: "#111111",
		stroke: "#222222",
		ring: "#333333",
		fire: "#444444",
		currStreakNum: "#555555",
		sideNums: "#666666",
		currStreakLabel: "#777777",
		sideLabels: "#888888",
		dates: "#999999",
		excludeDaysLabel: "#aaaaaa",
	};

	let baseTheme: Record<string, string> = { ...fallback };
	try {
		const t = loadThemesSync();
		if (t?.default)
			baseTheme = { ...baseTheme, ...(t.default as Record<string, string>) };
		if (params?.theme) {
			const name = normalizeThemeName(String(params.theme));
			let chosen = t[name] || t[params.theme];
			if (!chosen && t && typeof t === "object") {
				for (const k of Object.keys(t)) {
					try {
						if (normalizeThemeName(String(k)) === name) {
							chosen = t[k];
							break;
						}
					} catch {}
				}
			}
			if (chosen && typeof chosen === "object")
				baseTheme = { ...baseTheme, ...(chosen as Record<string, string>) };
		}
	} catch {}

	const result: ThemeWithGradient = { ...baseTheme } as ThemeWithGradient;

	// simple color override handling
	const hexPartialRegex = /^[0-9a-fA-F]{3,8}$/;
	const allowedColorNames = new Set([
		"red",
		"black",
		"white",
		"transparent",
		"blue",
		"green",
		"yellow",
		"orange",
		"purple",
		"pink",
	]);
	for (const k of Object.keys(baseTheme)) {
		if (params?.[k]) {
			let v = String(params[k]).trim();
			if (hexPartialRegex.test(v)) {
				v = `#${v}`;
				result[k] = v;
			} else if (
				/^[a-zA-Z]+$/.test(v) &&
				allowedColorNames.has(v.toLowerCase())
			) {
				result[k] = v;
			}
		}
	}

	if ((params?.hide_border ?? "") === "true") result.border = "#0000";

	// gradient token detection (angle,color1,color2,...)
	const bg = result.background || "";
	if (typeof bg === "string" && bg.includes(",")) {
		// re-use previously computed gradient defs when available
		const cached = GRADIENT_CACHE.get(bg);
		if (cached) {
			result.backgroundGradient = cached.def;
			result.background = `url(#gradient)`;
			result._backgroundGradientId = cached.id;
		} else {
			const parsed = parseBackgroundToken(bg);
			if (parsed) {
				result.backgroundGradient = parsed.def;
				result.background = `url(#gradient)`;
				result._backgroundGradientId = parsed.id;
				GRADIENT_CACHE.set(bg, { id: parsed.id, def: parsed.def });
			}
		}
	}

	// If params provided a background token directly (e.g., tests pass params.background), prefer that and
	// ensure we generate a gradient def for it as well.
	try {
		const pbg = params?.background;
		if (typeof pbg === "string" && pbg.includes(",")) {
			const cached = GRADIENT_CACHE.get(pbg);
			if (cached) {
				result.backgroundGradient = cached.def;
				result.background = `url(#gradient)`;
				result._backgroundGradientId = cached.id;
			} else {
				const parsed = parseBackgroundToken(pbg);
				if (parsed) {
					result.backgroundGradient = parsed.def;
					result.background = `url(#gradient)`;
					result._backgroundGradientId = parsed.id;
					GRADIENT_CACHE.set(pbg, { id: parsed.id, def: parsed.def });
				}
			}
		}
	} catch {
		// ignore
	}

	return result;
}

export function generateCard(
	_stats: Stats,
	params: Params | null = null,
): string {
	params = params ?? {};
	const stats = _stats as Stats;
	const theme = getRequestedTheme(params);
	const localeCode = params?.locale ?? "en";
	const localeTranslations = getTranslations(localeCode);
	const direction: "ltr" | "rtl" = localeTranslations.rtl ? "rtl" : "ltr";
	const dateFormat =
		params?.date_format ?? localeTranslations.date_format ?? null;
	const borderRadius = params?.border_radius ?? 4.5;

	const showTotalContributions =
		(params?.hide_total_contributions ?? "") !== "true";
	const showCurrentStreak = (params?.hide_current_streak ?? "") !== "true";
	const showLongestStreak = (params?.hide_longest_streak ?? "") !== "true";
	const numColumns =
		Number(showTotalContributions) +
		Number(showCurrentStreak) +
		Number(showLongestStreak);

	const cardWidth = getCardWidth(params ?? {}, numColumns || 3);
	const rectWidth = cardWidth - 1;
	const columnWidth = numColumns > 0 ? cardWidth / numColumns : 0;

	const cardHeight = getCardHeight(params ?? {});
	const rectHeight = cardHeight - 1;
	const heightOffset = (cardHeight - 195) / 2;

	const barOffsets: number[] = [-999, -999];
	for (let i = 0; i < numColumns - 1; i++) {
		barOffsets[i] = columnWidth * (i + 1);
	}
	const columnOffsets: number[] = [];
	for (let i = 0; i < numColumns; i++)
		columnOffsets.push(columnWidth / 2 + columnWidth * i);
	if (direction === "rtl") columnOffsets.reverse();

	let nextColumnIndex = 0;
	const totalContributionsOffset = showTotalContributions
		? columnOffsets[nextColumnIndex++]
		: -999;
	const currentStreakOffset = showCurrentStreak
		? columnOffsets[nextColumnIndex++]
		: -999;
	const longestStreakOffset = showLongestStreak
		? columnOffsets[nextColumnIndex++]
		: -999;

	const barHeightOffsets = [28 + heightOffset / 2, 170 + heightOffset];
	const totalContributionsHeightOffset = [
		48 + heightOffset,
		84 + heightOffset,
		114 + heightOffset,
	];
	const currentStreakHeightOffset = [
		48 + heightOffset,
		108 + heightOffset,
		145 + heightOffset,
		71 + heightOffset,
		19.5 + heightOffset,
	];
	const longestStreakHeightOffset = totalContributionsHeightOffset;

	const useShortNumbers = (params?.short_numbers ?? "") === "true";

	const totalContributions = formatNumber(
		stats.totalContributions,
		localeCode,
		useShortNumbers,
	);
	const firstContribution = formatDate(
		stats.firstContribution,
		dateFormat ?? undefined,
		localeCode,
	);
	const totalContributionsRange = `${firstContribution} - ${String(
		localeTranslations.Present ?? "Present",
	)}`;

	const currentStreak = formatNumber(
		stats.currentStreak.length,
		localeCode,
		useShortNumbers,
	);
	const currentStreakStart = formatDate(
		stats.currentStreak.start,
		dateFormat ?? undefined,
		localeCode,
	);
	const currentStreakEnd = formatDate(
		stats.currentStreak.end,
		dateFormat ?? undefined,
		localeCode,
	);
	let currentStreakRange = currentStreakStart;
	if (currentStreakStart !== currentStreakEnd)
		currentStreakRange += ` - ${currentStreakEnd}`;

	const longestStreak = formatNumber(
		stats.longestStreak.length,
		localeCode,
		useShortNumbers,
	);
	const longestStreakStart = formatDate(
		stats.longestStreak.start,
		dateFormat ?? undefined,
		localeCode,
	);
	const longestStreakEnd = formatDate(
		stats.longestStreak.end,
		dateFormat ?? undefined,
		localeCode,
	);
	let longestStreakRange = longestStreakStart;
	if (longestStreakStart !== longestStreakEnd)
		longestStreakRange += ` - ${longestStreakEnd}`;

	const maxCharsPerLineLabels =
		numColumns > 0 ? Math.floor(cardWidth / numColumns / 7.5) : 0;
	const totalContributionsText = splitLines(
		String(localeTranslations["Total Contributions"] ?? "Total Contributions"),
		maxCharsPerLineLabels,
		-9,
	);
	const currentStreakText = splitLines(
		String(
			stats.mode === "weekly"
				? (localeTranslations["Week Streak"] ?? "Week Streak")
				: (localeTranslations["Current Streak"] ?? "Current Streak"),
		),
		maxCharsPerLineLabels,
		-9,
	);
	const longestStreakText = splitLines(
		String(
			stats.mode === "weekly"
				? (localeTranslations["Longest Week Streak"] ?? "Longest Week Streak")
				: (localeTranslations["Longest Streak"] ?? "Longest Streak"),
		),
		maxCharsPerLineLabels,
		-9,
	);

	const maxCharsPerLineDates =
		numColumns > 0 ? Math.floor(cardWidth / numColumns / 6) : 0;
	const totalContributionsRangeText =
		typeof totalContributionsRange === "string"
			? splitLines(totalContributionsRange, maxCharsPerLineDates, 0)
			: totalContributionsRange;
	const currentStreakRangeText = splitLines(
		currentStreakRange,
		maxCharsPerLineDates,
		0,
	);
	const longestStreakRangeText = splitLines(
		longestStreakRange,
		maxCharsPerLineDates,
		0,
	);

	const excludedDays =
		stats.excludedDays && stats.excludedDays.length > 0
			? `\n                <g style='isolation: isolate'>\n                <!-- Excluded Days -->\n                <g transform='translate(${direction === "rtl" ? cardWidth - 5 : 5},187)'>\n                    <text stroke-width='0' text-anchor='right' fill='${theme.excludeDaysLabel}' stroke='none' font-family=""Segoe UI", Ubuntu, sans-serif" font-weight='400' font-size='10px' font-style='normal' style='opacity: 0; animation: fadein 0.5s linear forwards 0.9s'>\n                        * ${getExcludingDaysText(stats.excludedDays || [], localeCode)}\n                    </text>\n                </g>\n            </g>`
			: "";

	// background fill substitution for generated gradient id
	let backgroundFill = theme.background;
	if (backgroundFill === "url(#gradient)" && theme._backgroundGradientId) {
		backgroundFill = `url(#${theme._backgroundGradientId})`;
	}
	const defs = (theme.backgroundGradient ?? "") as string;

	return (
		`<?xml version='1.0' encoding='UTF-8'?>\n` +
		`<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' style='isolation: isolate' viewBox='0 0 ${cardWidth} ${cardHeight}' width='${cardWidth}px' height='${cardHeight}px' direction='${direction}'>` +
		`<style>@keyframes currstreak{0%{font-size:3px;opacity:0.2}80%{font-size:34px;opacity:1}100%{font-size:28px;opacity:1}}@keyframes fadein{0%{opacity:0}100%{opacity:1}}</style>` +
		`<defs><clipPath id='outer_rectangle'><rect width='${cardWidth}' height='${cardHeight}' rx='${borderRadius}'/></clipPath><mask id='mask_out_ring_behind_fire'><rect width='${cardWidth}' height='${cardHeight}' fill='white'/><ellipse id='mask-ellipse' cx='${currentStreakOffset}' cy='32' rx='13' ry='18' fill='black'/></mask>${defs}</defs>` +
		`<g clip-path='url(#outer_rectangle)'>` +
		`<g style='isolation: isolate'><rect stroke='${theme.border}' fill='${backgroundFill}' rx='${borderRadius}' x='0.5' y='0.5' width='${rectWidth}' height='${rectHeight}'/></g>` +
		`<g style='isolation: isolate'><line x1='${barOffsets[0]}' y1='${barHeightOffsets[0]}' x2='${barOffsets[0]}' y2='${barHeightOffsets[1]}' vector-effect='non-scaling-stroke' stroke-width='1' stroke='${theme.stroke}' stroke-linejoin='miter' stroke-linecap='square' stroke-miterlimit='3'/><line x1='${barOffsets[1]}' y1='${barHeightOffsets[0]}' x2='${barOffsets[1]}' y2='${barHeightOffsets[1]}' vector-effect='non-scaling-stroke' stroke-width='1' stroke='${theme.stroke}' stroke-linejoin='miter' stroke-linecap='square' stroke-miterlimit='3'/></g>` +
		`<g style='isolation: isolate'>` +
		`<!-- Total Contributions big number -->` +
		`<g transform='translate(${totalContributionsOffset}, ${totalContributionsHeightOffset[0]})'><text x='0' y='32' stroke-width='0' text-anchor='middle' fill='${theme.sideNums}' stroke='none' font-family=""Segoe UI", Ubuntu, sans-serif" font-weight='700' font-size='28px' font-style='normal' style='opacity: 0; animation: fadein 0.5s linear forwards 0.6s'>${totalContributions}</text></g>` +
		`<g transform='translate(${totalContributionsOffset}, ${totalContributionsHeightOffset[1]})'><text x='0' y='32' stroke-width='0' text-anchor='middle' fill='${theme.sideLabels}' stroke='none' font-family=""Segoe UI", Ubuntu, sans-serif" font-weight='400' font-size='14px' font-style='normal' style='opacity: 0; animation: fadein 0.5s linear forwards 0.7s'>${totalContributionsText}</text></g>` +
		`<g transform='translate(${totalContributionsOffset}, ${totalContributionsHeightOffset[2]})'><text x='0' y='32' stroke-width='0' text-anchor='middle' fill='${theme.dates}' stroke='none' font-family=""Segoe UI", Ubuntu, sans-serif" font-weight='400' font-size='12px' font-style='normal' style='opacity: 0; animation: fadein 0.5s linear forwards 0.8s'>${totalContributionsRangeText}</text></g>` +
		`</g>` +
		`<g style='isolation: isolate'>` +
		`<g transform='translate(${currentStreakOffset}, ${currentStreakHeightOffset[1]})'><text x='0' y='32' stroke-width='0' text-anchor='middle' fill='${theme.currStreakLabel}' stroke='none' font-family=""Segoe UI", Ubuntu, sans-serif" font-weight='700' font-size='14px' font-style='normal' style='opacity: 0; animation: fadein 0.5s linear forwards 0.9s'>${currentStreakText}</text></g>` +
		`<g transform='translate(${currentStreakOffset}, ${currentStreakHeightOffset[2]})'><text x='0' y='21' stroke-width='0' text-anchor='middle' fill='${theme.dates}' stroke='none' font-family=""Segoe UI", Ubuntu, sans-serif" font-weight='400' font-size='12px' font-style='normal' style='opacity: 0; animation: fadein 0.5s linear forwards 0.9s'>${currentStreakRangeText}</text></g>` +
		`<g mask='url(#mask_out_ring_behind_fire)'><circle cx='${currentStreakOffset}' cy='${currentStreakHeightOffset[3]}' r='40' fill='none' stroke='${theme.ring}' stroke-width='5' style='opacity: 0; animation: fadein 0.5s linear forwards 0.4s'></circle></g>` +
		`<g transform='translate(${currentStreakOffset}, ${currentStreakHeightOffset[4]})' stroke-opacity='0' style='opacity: 0; animation: fadein 0.5s linear forwards 0.6s'><path d='M -12 -0.5 L 15 -0.5 L 15 23.5 L -12 23.5 L -12 -0.5 Z' fill='none'/><path d='M 1.5 0.67 C 1.5 0.67 2.24 3.32 2.24 5.47 C 2.24 7.53 0.89 9.2 -1.17 9.2 C -3.23 9.2 -4.79 7.53 -4.79 5.47 L -4.76 5.11 C -6.78 7.51 -8 10.62 -8 13.99 C -8 18.41 -4.42 22 0 22 C 4.42 22 8 18.41 8 13.99 C 8 8.6 5.41 3.79 1.5 0.67 Z M -0.29 19 C -2.07 19 -3.51 17.6 -3.51 15.86 C -3.51 14.24 -2.46 13.1 -0.7 12.74 C 1.07 12.38 2.9 11.53 3.92 10.16 C 4.31 11.45 4.51 12.81 4.51 14.2 C 4.51 16.85 2.36 19 -0.29 19 Z' fill='${theme.fire}' stroke-opacity='0'/></g>` +
		`<g transform='translate(${currentStreakOffset}, ${currentStreakHeightOffset[0]})'><text x='0' y='32' stroke-width='0' text-anchor='middle' fill='${theme.currStreakNum}' stroke='none' font-family=""Segoe UI", Ubuntu, sans-serif" font-weight='700' font-size='28px' font-style='normal' style='animation: currstreak 0.6s linear forwards'>${currentStreak}</text></g>` +
		`</g>` +
		`<g style='isolation: isolate'>` +
		`<g transform='translate(${longestStreakOffset}, ${longestStreakHeightOffset[0]})'><text x='0' y='32' stroke-width='0' text-anchor='middle' fill='${theme.sideNums}' stroke='none' font-family=""Segoe UI", Ubuntu, sans-serif" font-weight='700' font-size='28px' font-style='normal' style='opacity: 0; animation: fadein 0.5s linear forwards 1.2s'>${longestStreak}</text></g>` +
		`<g transform='translate(${longestStreakOffset}, ${longestStreakHeightOffset[1]})'><text x='0' y='32' stroke-width='0' text-anchor='middle' fill='${theme.sideLabels}' stroke='none' font-family=""Segoe UI", Ubuntu, sans-serif" font-weight='400' font-size='14px' font-style='normal' style='opacity: 0; animation: fadein 0.5s linear forwards 1.3s'>${longestStreakText}</text></g>` +
		`<g transform='translate(${longestStreakOffset}, ${longestStreakHeightOffset[2]})'><text x='0' y='32' stroke-width='0' text-anchor='middle' fill='${theme.dates}' stroke='none' font-family=""Segoe UI", Ubuntu, sans-serif" font-weight='400' font-size='12px' font-style='normal' style='opacity: 0; animation: fadein 0.5s linear forwards 1.4s'>${longestStreakRangeText}</text></g>` +
		`</g>` +
		`${excludedDays}` +
		`</g></svg>`
	);
}

export function generateErrorCard(
	message: string,
	params: Params | null = null,
): string {
	params = params ?? {};
	const theme = getRequestedTheme(params);
	const borderRadius = params?.border_radius ?? 4.5;
	const cardWidth = getCardWidth(params);
	const cardHeight = getCardHeight(params);
	const rectWidth = cardWidth - 1;

	let backgroundFill = theme.background;
	if (backgroundFill === "url(#gradient)" && theme._backgroundGradientId) {
		backgroundFill = `url(#${theme._backgroundGradientId})`;
	}

	const defs = theme.backgroundGradient ?? "";

	return (
		`<?xml version='1.0' encoding='UTF-8'?>\n` +
		`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${cardWidth} ${cardHeight}' width='${cardWidth}px' height='${cardHeight}px'>` +
		`<defs>${defs}</defs>` +
		`<rect stroke='${theme.border}' fill='${backgroundFill}' rx='${borderRadius}' x='0.5' y='0.5' width='${rectWidth}' height='${cardHeight - 1}'/>` +
		`<text x='${cardWidth / 2}' y='${cardHeight / 2}' text-anchor='middle' fill='${theme.sideLabels}'>${message}</text>` +
		`</svg>`
	);
}

// Re-export helpers used by tests
export { formatDate, getRequestedTheme, normalizeThemeName };
