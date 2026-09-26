import type { Translations } from "./types_public.ts";

let _TRANSLATIONS: Record<string, Translations> = {};
let _translationsLoaded = false;

function loadTranslationsSync(): Record<string, Translations> {
	if (_translationsLoaded) return _TRANSLATIONS;
	try {
		// Prefer a named export `TRANSLATIONS`, fall back to module default.
		// Resolve the translations module deterministically for Node-like
		// runtimes. In ESM-only/edge runtimes `require` may be unavailable;
		// in that case we leave the map empty and rely on build-time wiring.
		let mod: unknown = {};
		try {
			if (typeof require === "function") {
				try {
					mod = require("./translations");
				} catch {
					try {
						mod = require("./translations.js");
					} catch {
						try {
							mod = require("./translations.ts");
						} catch {
							mod = {};
						}
					}
				}
			} else {
				mod = {};
			}
		} catch {
			mod = {};
		}
		const m = (mod as unknown as Record<string, Translations>) || {};
		const t1 = m.TRANSLATIONS as unknown as
			| Record<string, Translations>
			| undefined;
		const t2 = m.default as unknown as Record<string, Translations> | undefined;
		_TRANSLATIONS = (t1 ||
			t2 ||
			(m as unknown as Record<string, Translations>)) as Record<
			string,
			Translations
		>;
	} catch {
		_TRANSLATIONS = {};
	}
	_translationsLoaded = true;
	return _TRANSLATIONS;
}

export function normalizeLocaleCode(localeCode: string): string {
	const m = localeCode.match(
		/^([a-z]{2,3})(?:[_-]([a-z]{4}))?(?:[_-]([0-9]{3}|[a-z]{2}))?$/i,
	);
	if (!m) return "en";
	let [, language, script, region] = m as string[];
	language = (language || "en").toLowerCase();
	script = script
		? script.charAt(0).toUpperCase() + script.slice(1).toLowerCase()
		: "";
	region = region ? region.toUpperCase() : "";
	return [language, script, region].filter(Boolean).join("_");
}

export function getTranslations(localeCode: string): Translations {
	const normalized = normalizeLocaleCode(localeCode);
	const translations = loadTranslationsSync();
	const tmap = translations as Record<string, Translations>;
	let entry: unknown = tmap[normalized];
	if (!entry) {
		const langOnly = normalized.split("_")[0] ?? "en";
		entry = tmap[langOnly];
	}
	if (typeof entry === "string") {
		entry = tmap[String(entry)];
	}
	const en = tmap.en || {};
	const fallback = (entry as Record<string, string>) || {};
	// fill missing keys from English
	return Object.assign({}, en, fallback) as Translations;
}

export function translateDays(days: string[], locale: string): string[] {
	if (!days || days.length === 0) return [];
	if (!locale || locale === "en") return days;
	// map Sun..Sat to a fixed week starting at 1970-01-04 (Sunday)
	const weekdayIndex: Record<string, number> = {
		Sun: 0,
		Mon: 1,
		Tue: 2,
		Wed: 3,
		Thu: 4,
		Fri: 5,
		Sat: 6,
	};
	const dtf = new Intl.DateTimeFormat(locale, { weekday: "short" });
	return days.map((d) => {
		const key = d.trim().slice(0, 1).toUpperCase() + d.trim().slice(1, 3);
		const idx = weekdayIndex[key] ?? 0;
		const base = new Date(Date.UTC(1970, 0, 4 + idx));
		return dtf.format(base);
	});
}

export function getExcludingDaysText(
	excludedDays: string[],
	localeCode: string,
): string {
	const translations = getTranslations(localeCode);
	const sep = translations.comma_separator ?? ", ";
	const translated = translateDays(excludedDays, localeCode);
	const daysCommaSeparated = translated.join(sep);
	const template = String(
		translations["Excluding {days}"] ?? "Excluding {days}",
	);
	return template.replace("{days}", daysCommaSeparated);
}

export function normalizeThemeName(theme: string): string {
	return theme.toLowerCase().replace(/_/g, "-");
}

export function convertHexColor(hex: string): {
	color: string;
	opacity: number;
} {
	let s = String(hex || "").replace(/[^0-9a-fA-F]/g, "");
	if (s.length === 3) {
		s = s
			.split("")
			.map((c) => c + c)
			.join("");
	} else if (s.length === 4) {
		const chars = s.split("");
		s = `${chars[0]}${chars[0]}${chars[1]}${chars[1]}${chars[2]}${chars[2]}${chars[3]}${chars[3]}`;
	}
	if (s.length === 6) return { color: `#${s}`, opacity: 1 };
	if (s.length === 8) {
		const color = `#${s.slice(0, 6)}`;
		const opacity = parseInt(s.slice(6, 8), 16) / 255;
		return { color, opacity };
	}
	throw new Error(`Invalid color: ${hex}`);
}

export function convertHexColors(svg: string): string {
	if (!svg) return svg;
	// convert "transparent" to #0000
	svg = svg.replace(/(fill|stroke)=['"]transparent['"]/g, '$1="#0000"');
	// replace 4 or 8 hex colors like #abcd or #aabbccdd
	svg = svg.replace(
		/(fill|stroke|stop-color)=["']#([0-9a-fA-F]{4}|[0-9a-fA-F]{8})["']/g,
		(m, attr, hex) => {
			try {
				const res = convertHexColor(hex);
				const opacityAttr =
					attr === "stop-color" ? "stop-opacity" : `${attr}-opacity`;
				return `${attr}='${res.color}' ${opacityAttr}='${res.opacity}'`;
			} catch {
				return m;
			}
		},
	);
	return svg;
}

export function removeAnimations(svg: string): string {
	if (!svg) return svg;

	// --- Regex sanitizer ---
	// remove entire <style> blocks
	svg = svg.replace(/<style>[\s\S]*?<\/style>/gi, "");

	// strip script blocks (safety)
	svg = svg.replace(/<script\b[\s\S]*?<\/script>/gi, "");

	// Remove SMIL animation elements. They appear both paired
	// (`<animate>…</animate>`) and self-closing (`<animate …/>`), and the tag
	// names share prefixes (animate / animateTransform / animateMotion), so each
	// form is matched per tag behind a word boundary. Matching only the paired
	// form left self-closing SMIL in the output, which the DOM-based sanitizer
	// used to hide but which never ran in production.
	for (const tag of ["animate", "animateTransform", "animateMotion", "set"]) {
		svg = svg.replace(
			new RegExp(`<${tag}\\b[^>]*\\/>|<${tag}\\b[\\s\\S]*?<\\/${tag}>`, "gi"),
			"",
		);
	}

	// make any opacity: 0 => opacity: 1 to avoid invisible text in embeddings
	svg = svg.replace(/opacity:\s*0;/gi, "opacity: 1;");

	// replace animation references with static fallbacks
	svg = svg.replace(/animation:\s*fadein[^;"']*/gi, "opacity: 1;");
	svg = svg.replace(/animation:\s*currstreak[^;"']*/gi, "font-size: 28px;");

	// unwrap anchors
	svg = svg.replace(/<a [^>]*>([\s\S]*?)<\/a>/gi, "$1");

	// remove any remaining <script .../> self-closing forms
	svg = svg.replace(/<script[^>]*\/>/gi, "");

	// remove inline event handlers (onload, onclick, etc.) and javascript: hrefs
	svg = svg.replace(/\son[a-zA-Z]+=("|')[\s\S]*?\1/gi, "");
	svg = svg.replace(/href=("|')javascript:[\s\S]*?\1/gi, "");
	svg = svg.replace(/xlink:href=("|')javascript:[\s\S]*?\1/gi, "");

	// strip any xmlns:h or other namespaced event-style attributes as a last resort
	svg = svg.replace(/\sxmlns:[a-zA-Z0-9_-]+=("|')[\s\S]*?\1/gi, "");

	return svg;
}

export {
	normalizeThemeKeys,
	parseBackgroundToken,
} from "../../lib/theme-helpers.ts";
