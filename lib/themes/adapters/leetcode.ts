import type { LeetCodeThemeProperties, ThemeDefinition } from "../registry";
import { themes } from "../registry";

const DEFAULT_BG = ["#fff", "#e5e5e5"];
const DEFAULT_TEXT = ["#000", "#808080"];
const DEFAULT_COLOR: string[] = [];

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
 * override. Absent values fall back to the `default` theme, matching the
 * historical `leetcode/packages/core/src/theme/_theme.ts` defaults.
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

	const palette = override.palette ??
		sColors.palette ??
		defaultTheme.leetcode?.palette ??
		dColors.palette ?? {
			bg: DEFAULT_BG,
			text: DEFAULT_TEXT,
			color: DEFAULT_COLOR,
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
