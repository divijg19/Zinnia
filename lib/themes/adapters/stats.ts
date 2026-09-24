import type { ThemeColors, ThemeDefinition } from "../registry.js";
import { themes } from "../registry.js";
import { resolveWithFallback } from "../tokens.js";

/**
 * Fully-resolved color properties consumed by the stats card renderer.
 * Values are returned as stored in the canonical registry (no hex prefixing /
 * gradient parsing) — that normalization is applied by the stats renderer
 * (`fallbackColor`), matching the original behavior exactly.
 */
export interface StatsThemeProperties {
	title_color: string;
	icon_color: string;
	text_color: string;
	bg_color: string;
	border_color?: string;
	ring_color?: string;
}

const DEFAULT_THEME_NAME = "default";

const fieldMap: Record<keyof StatsThemeProperties, keyof ThemeColors> = {
	title_color: "title",
	icon_color: "icon",
	text_color: "text",
	bg_color: "background",
	border_color: "border",
	ring_color: "ring",
};

/**
 * Derive stats color properties from a canonical theme definition.
 *
 * Missing per-theme colors fall back to the `default` theme, mirroring the
 * historical `getCardColors` behavior where an absent property on the selected
 * theme is replaced by the default theme's value (notably `border_color`).
 *
 * @param theme The canonical theme definition to adapt.
 * @param fallback Optional canonical theme used to fill in missing colors.
 *                 Defaults to the `default` theme in the registry.
 */
export function toStatsTheme(
	theme: ThemeDefinition,
	fallback?: ThemeDefinition,
): StatsThemeProperties {
	const resolved = fallback ??
		themes[DEFAULT_THEME_NAME] ?? { name: DEFAULT_THEME_NAME, colors: {} };
	const s = theme.colors;
	const d = resolved.colors;
	const pick = (key: keyof StatsThemeProperties) =>
		resolveWithFallback({}, s, {}, d, fieldMap[key], [fieldMap[key]], (v) => v);

	return {
		title_color: pick("title_color") ?? "",
		icon_color: pick("icon_color") ?? "",
		text_color: pick("text_color") ?? "",
		bg_color: pick("bg_color") ?? "",
		border_color: pick("border_color"),
		ring_color: pick("ring_color"),
	};
}
