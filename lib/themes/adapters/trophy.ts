import type { ThemeColors, ThemeDefinition } from "../registry.js";
import { themes } from "../registry.js";
import { normalizeColor, resolveWithFallback } from "../tokens.js";

export interface TrophyThemeProperties {
	BACKGROUND: string;
	TITLE: string;
	ICON_CIRCLE: string;
	TEXT: string;
	LAUREL: string;
	SECRET_RANK_1: string;
	SECRET_RANK_2: string;
	SECRET_RANK_3: string;
	SECRET_RANK_TEXT: string;
	NEXT_RANK_BAR: string;
	S_RANK_BASE: string;
	S_RANK_SHADOW: string;
	S_RANK_TEXT: string;
	A_RANK_BASE: string;
	A_RANK_SHADOW: string;
	A_RANK_TEXT: string;
	B_RANK_BASE: string;
	B_RANK_SHADOW: string;
	B_RANK_TEXT: string;
	DEFAULT_RANK_BASE: string;
	DEFAULT_RANK_SHADOW: string;
	DEFAULT_RANK_TEXT: string;
}

const DEFAULT_THEME_NAME = "default";

const formatTrophyColor = (color: string | undefined): string | undefined =>
	normalizeColor(color, { allowNamed: true });

/**
 * Derive trophy color properties from a canonical theme definition.
 *
 * Missing trophy properties are derived from semantic tokens or fall back
 * to the `default` theme in the canonical registry.
 *
 * @param theme The canonical theme definition to adapt.
 * @param fallback Optional canonical theme used to fill in missing colors.
 *                 Defaults to the `default` theme in the registry.
 */
export function toTrophyTheme(
	theme: ThemeDefinition,
	fallback?: ThemeDefinition,
): TrophyThemeProperties {
	const defaultTheme = fallback ??
		themes[DEFAULT_THEME_NAME] ?? { name: DEFAULT_THEME_NAME, colors: {} };
	const tOverride = theme.trophy ?? {};
	const dOverride = defaultTheme.trophy ?? {};
	const sColors = theme.colors;
	const dColors = defaultTheme.colors;

	const getVal = (
		overrideKey: keyof TrophyThemeProperties,
		colorTokens: (keyof ThemeColors)[],
	): string | undefined =>
		resolveWithFallback(
			tOverride,
			sColors,
			dOverride,
			dColors,
			overrideKey,
			colorTokens,
			formatTrophyColor,
		);

	const title = getVal("TITLE", ["title"]) ?? "#000";
	const text = getVal("TEXT", ["text"]) ?? "#666";
	const iconCircle = getVal("ICON_CIRCLE", ["icon", "background"]) ?? "#FFF";

	return {
		BACKGROUND: getVal("BACKGROUND", ["background"]) ?? "#FFF",
		TITLE: title,
		ICON_CIRCLE: iconCircle,
		TEXT: text,
		LAUREL: getVal("LAUREL", ["primary", "ring"]) ?? "#009366",
		SECRET_RANK_1: getVal("SECRET_RANK_1", ["fire", "title"]) ?? "red",
		SECRET_RANK_2: getVal("SECRET_RANK_2", ["primary", "title"]) ?? "fuchsia",
		SECRET_RANK_3: getVal("SECRET_RANK_3", ["icon", "title"]) ?? "blue",
		SECRET_RANK_TEXT: getVal("SECRET_RANK_TEXT", ["title"]) ?? "fuchsia",
		NEXT_RANK_BAR: getVal("NEXT_RANK_BAR", ["title", "primary"]) ?? "#0366d6",
		S_RANK_BASE: getVal("S_RANK_BASE", ["title"]) ?? "#FAD200",
		S_RANK_SHADOW: getVal("S_RANK_SHADOW", ["border", "title"]) ?? "#C8A090",
		S_RANK_TEXT: getVal("S_RANK_TEXT", ["text"]) ?? "#886000",
		A_RANK_BASE: getVal("A_RANK_BASE", ["icon"]) ?? "#B0B0B0",
		A_RANK_SHADOW: getVal("A_RANK_SHADOW", ["border"]) ?? "#9090C0",
		A_RANK_TEXT: getVal("A_RANK_TEXT", ["text"]) ?? "#505050",
		B_RANK_BASE: getVal("B_RANK_BASE", ["text"]) ?? "#A18D66",
		B_RANK_SHADOW: getVal("B_RANK_SHADOW", ["border"]) ?? "#816D96",
		B_RANK_TEXT: getVal("B_RANK_TEXT", ["text"]) ?? "#412D06",
		DEFAULT_RANK_BASE: getVal("DEFAULT_RANK_BASE", ["text"]) ?? "#777",
		DEFAULT_RANK_SHADOW: getVal("DEFAULT_RANK_SHADOW", ["border"]) ?? "#333",
		DEFAULT_RANK_TEXT: getVal("DEFAULT_RANK_TEXT", ["text"]) ?? "#333",
	};
}
