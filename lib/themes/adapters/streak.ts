import type { ThemeColors, ThemeDefinition } from "../registry";
import { themes } from "../registry";

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

function formatStreakColor(color: string | undefined): string | undefined {
	if (!color) return undefined;
	const trimmed = color.trim();
	if (!trimmed) return undefined;
	if (
		trimmed.startsWith("#") ||
		trimmed.includes(",") ||
		trimmed === "transparent" ||
		trimmed.startsWith("url(")
	) {
		return trimmed;
	}
	if (/^[0-9a-fA-F]{3,8}$/.test(trimmed)) {
		return `#${trimmed}`;
	}
	return trimmed;
}

function tokenHex(
	colors: ThemeColors | undefined,
	token: keyof ThemeColors,
): string | undefined {
	const value = colors?.[token];
	if (!value) return undefined;
	if (typeof value === "string") return value;
	if ("hex" in value) return value.hex;
	if ("stops" in value) {
		const stops = value.stops.map((s) => s.hex).join(",");
		return value.angle !== undefined ? `${value.angle},${stops}` : stops;
	}
	return undefined;
}

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
	): string | undefined => {
		if (sOverride[overrideKey]) {
			return formatStreakColor(sOverride[overrideKey]);
		}
		for (const tok of colorTokens) {
			const hex = tokenHex(sColors, tok);
			if (hex) return formatStreakColor(hex);
		}
		if (dOverride[overrideKey]) {
			return formatStreakColor(dOverride[overrideKey]);
		}
		for (const tok of colorTokens) {
			const hex = tokenHex(dColors, tok);
			if (hex) return formatStreakColor(hex);
		}
		return undefined;
	};

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
