import type {
	LeetCodeThemeProperties,
	ThemeColors,
	ThemeDefinition,
} from "../registry";
import { themes } from "../registry";

const DEFAULT_BG: [string, string] = ["#fff", "#e5e5e5"];
const DEFAULT_TEXT: [string, string] = ["#000", "#808080"];
const DEFAULT_COLOR: string[] = [];

/** Plain hex colors only — gradient/url tokens cannot fill a flat `fill:`. */
function plainHex(
	colors: ThemeColors | undefined,
	token: keyof ThemeColors,
): string | undefined {
	const value = colors?.[token];
	const raw =
		typeof value === "string"
			? value
			: value && "hex" in value
				? value.hex
				: undefined;
	if (!raw) return undefined;
	const v = raw.trim();
	if (v.startsWith("#")) return /^#[0-9a-fA-F]{3,8}$/.test(v) ? v : undefined;
	return /^[0-9a-fA-F]{3,8}$/.test(v) ? `#${v}` : undefined;
}

/** Pad a palette array to at least 4 entries by repeating the last value. */
function padPalette(values: string[]): string[] {
	while (values.length < 4) {
		const last = values[values.length - 1];
		values.push(last ?? "");
	}
	return values;
}

/**
 * Derive LeetCode theme properties from a canonical theme definition.
 *
 * LeetCode themes store their raw `--bg-0..3` / `--text-0..3` /
 * `--color-0..3` palette arrays (plus optional `css`) on the canonical
 * definition — either directly on `colors` or via the explicit `leetcode`
 * override. Themes without a palette (the majority) derive one entry-wise
 * from their own `background` / `border` / `text` / `icon` tokens so every
 * listed theme actually themes the card; each entry still falls back to the
 * historical defaults, matching the historical
 * `leetcode/packages/core/src/theme/_theme.ts` defaults for token-less
 * themes (e.g. `wtf`).
 *
 * @param theme The canonical theme definition to adapt.
 * @param fallback Optional canonical theme used to fill in missing values.
 *                 Defaults to the `default` theme in the registry.
 */
export function toLeetCodeTheme(
	theme: ThemeDefinition,
	fallback?: ThemeDefinition,
): LeetCodeThemeProperties {
	const defaultTheme = fallback ??
		themes.default ?? { name: "default", colors: {} };

	const override = theme.leetcode ?? {};
	const sColors = theme.colors;
	const dColors = defaultTheme.colors;

	const derivedBg = [
		plainHex(sColors, "background") ?? DEFAULT_BG[0],
		plainHex(sColors, "border") ?? DEFAULT_BG[1],
	];
	const derivedText = [
		plainHex(sColors, "text") ?? DEFAULT_TEXT[0],
		DEFAULT_TEXT[1],
	];
	const accent = plainHex(sColors, "icon") ?? plainHex(sColors, "title");
	const derivedColor = accent ? [accent] : [...DEFAULT_COLOR];

	const palette = override.palette ??
		sColors.palette ??
		defaultTheme.leetcode?.palette ??
		dColors.palette ?? {
			bg: derivedBg,
			text: derivedText,
			color: derivedColor,
		};
	const css =
		override.css ??
		sColors.css ??
		defaultTheme.leetcode?.css ??
		dColors.css ??
		"";

	return {
		palette: {
			bg: padPalette([...(palette.bg ?? DEFAULT_BG)]),
			text: padPalette([...(palette.text ?? DEFAULT_TEXT)]),
			color: [...(palette.color ?? DEFAULT_COLOR)],
		},
		css,
	};
}
