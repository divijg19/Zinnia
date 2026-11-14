import { normalizeThemeName } from "../../theme-helpers.js";
import type { ThemeColors, ThemeDefinition } from "../registry.js";
import { themes } from "../registry.js";
import { normalizeColor, resolveWithFallback } from "../tokens.js";

export interface StreakThemeProperties {
	background: string;
	border: string;
	stroke: string;
	ring: string;
	fire: string;
	currStreakNum: string;
	sideNums: string;
	currStreakLabel: string;
	sideLabels: string;
	dates: string;
	excludeDaysLabel: string;
}

const DEFAULT_THEME_NAME = "default";

const formatStreakColor = (color: string | undefined): string | undefined =>
	normalizeColor(color, { allowUrl: true });

/**
 * Derive streak color properties from a canonical theme definition.
 *
 * Missing streak properties are derived from semantic tokens or fall back
 * to the `default` theme in the canonical registry.
 *
 * @param theme The canonical theme definition to adapt.
 * @param fallback Optional canonical theme used to fill in missing colors.
 *                 Defaults to the `default` theme in the registry.
 */
export function toStreakTheme(
	theme: ThemeDefinition,
	fallback?: ThemeDefinition,
): StreakThemeProperties {
	const defaultTheme = fallback ??
		themes[DEFAULT_THEME_NAME] ?? { name: DEFAULT_THEME_NAME, colors: {} };
	const sOverride = theme.streak ?? {};
	const dOverride = defaultTheme.streak ?? {};
	const sColors = theme.colors;
	const dColors = defaultTheme.colors;

	const getVal = (
		overrideKey: keyof StreakThemeProperties,
		colorTokens: (keyof ThemeColors)[],
	): string | undefined =>
		resolveWithFallback(
			sOverride,
			sColors,
			dOverride,
			dColors,
			overrideKey,
			colorTokens,
			formatStreakColor,
		);

	return {
		background: getVal("background", ["background"]) ?? "#FFFEFE",
		border: getVal("border", ["border"]) ?? "#E4E2E2",
		stroke: getVal("stroke", ["stroke", "border"]) ?? "#E4E2E2",
		ring: getVal("ring", ["ring", "title", "primary"]) ?? "#FB8C00",
		fire: getVal("fire", ["fire", "ring", "title", "primary"]) ?? "#FB8C00",
		currStreakNum: getVal("currStreakNum", ["title", "text"]) ?? "#151515",
		sideNums: getVal("sideNums", ["text", "title"]) ?? "#151515",
		currStreakLabel: getVal("currStreakLabel", ["ring", "title"]) ?? "#FB8C00",
		sideLabels: getVal("sideLabels", ["text", "title"]) ?? "#151515",
		dates: getVal("dates", ["dates", "icon", "text"]) ?? "#464646",
		excludeDaysLabel:
			getVal("excludeDaysLabel", ["dates", "text"]) ?? "#464646",
	};
}

/**
 * Every registry theme, adapted for the streak card.
 *
 * Streak resolves theme names case-insensitively and treats `_` as `-`, so
 * two registry names can normalize to the same one (the trophy
 * `catppuccin_mocha` and the leetcode `catppuccin-mocha`). The first entry
 * in registry order claims the name, matching the legacy streak behaviour.
 */
export function streakThemes(): Record<string, StreakThemeProperties> {
	const adapted: Record<string, StreakThemeProperties> = {};
	const seen = new Set<string>();
	for (const name of Object.keys(themes)) {
		const normalized = normalizeThemeName(name);
		if (seen.has(normalized)) continue;
		seen.add(normalized);
		const def = themes[name];
		if (def) adapted[name] = toStreakTheme(def);
	}
	return adapted;
}
