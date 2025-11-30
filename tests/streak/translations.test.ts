import { describe, expect, test } from "vitest";
import {
	getTranslations,
	normalizeLocaleCode,
} from "../../streak/src/card_helpers.js";
import { TRANSLATIONS } from "../../streak/src/translations.js";
import type { Translations } from "../../streak/src/types_public.js";

describe("translations", () => {
	test("all phrases valid and aliases exist", () => {
		const translations = TRANSLATIONS as unknown as Record<
			string,
			Translations | string
		>;
		const locales = Object.keys(translations);
		const valid_phrases = [
			"rtl",
			"date_format",
			"Total Contributions",
			"Current Streak",
			"Longest Streak",
			"Week Streak",
			"Longest Week Streak",
			"Present",
			"Excluding {days}",
			"comma_separator",
		];

		for (const locale of locales) {
			const entry = translations[locale];
			if (typeof entry === "string") {
				const alias = entry;
				expect(translations).toHaveProperty(alias);
			} else {
				const phrases = Object.keys(entry || {});
				const invalid = phrases.filter((p) => !valid_phrases.includes(p));
				expect(invalid).toHaveLength(0);
			}
		}
	});

	test("en is first and remaining locales sorted", () => {
		const translations = TRANSLATIONS as unknown as Record<
			string,
			Translations | string
		>;
		const locales = Object.keys(translations);
		expect(locales[0]).toBe("en");
		const remaining = locales.slice(1);
		const sorted = [...remaining].sort();
		expect(remaining).toEqual(sorted);
	});

	test("keys normalized", () => {
		const translations = TRANSLATIONS as unknown as Record<
			string,
			Translations | string
		>;
		for (const locale of Object.keys(translations)) {
			const normalized = normalizeLocaleCode(locale);
			expect(locale).toBe(normalized);
		}
	});

	test("getTranslations behavior", () => {
		const translations = TRANSLATIONS as unknown as Record<
			string,
			Translations | string
		>;
		const en = translations.en || {};
		// alias
		expect(getTranslations("zh")).toEqual(
			Object.assign({}, en, translations.zh_Hans),
		);
		// script via dash
		expect(getTranslations("zh-hans")).toEqual(
			Object.assign({}, en, translations.zh_Hans),
		);
		// region via dash
		expect(getTranslations("pt-br")).toEqual(
			Object.assign({}, en, translations.pt_BR),
		);
		// missing region falls back to language
		expect(getTranslations("fr_XX")).toEqual(
			Object.assign({}, en, translations.fr),
		);
		// unknown locale -> english
		expect(getTranslations("xx")).toEqual(en);
	});

	test("normalizeLocaleCode details", () => {
		expect(normalizeLocaleCode("zh_hans")).toBe("zh_Hans");
		expect(normalizeLocaleCode("pt_br")).toBe("pt_BR");
		expect(normalizeLocaleCode("zh_hans_cn")).toBe("zh_Hans_CN");
		expect(normalizeLocaleCode("es_419")).toBe("es_419");
		expect(normalizeLocaleCode("zh-hans")).toBe("zh_Hans");
		expect(normalizeLocaleCode("ZH-HANS")).toBe("zh_Hans");
		expect(normalizeLocaleCode("xxxx-XXX-XXXXX")).toBe("en");
	});
});
