import type { DemoTheme } from "../types.js";

/**
 * How the demo groups and tags the themes.
 *
 * Both views come from one derivation, because they answer the same question
 * about the same registry: what kind of theme is this? The modifier tags and
 * the group sections used to be written out twice, with a comment admitting
 * the two copies had to be kept in sync.
 */

export const MODIFIER_ALL = "";

export const MODIFIER_OPTIONS: { value: string; label: string }[] = [
	{ value: MODIFIER_ALL, label: "All variants" },
	{ value: "shadow", label: "Shadow" },
	{ value: "dark-variant", label: "Dark variants" },
	{ value: "light-variant", label: "Light variants" },
	{ value: "dimmed", label: "Dimmed" },
	{ value: "special", label: "Special editions" },
	{ value: "catppuccin", label: "Catppuccin" },
	{ value: "gradient-effect", label: "Gradients & effects" },
];

const SPECIAL_SEGMENTS = new Set([
	"lover",
	"pro",
	"minimus",
	"pink",
	"navy",
	"repocard",
]);

/**
 * Does the theme draw itself with a gradient or an animation?
 *
 * Both the modifier tags and the group sections ask this, so it is answered
 * once.
 */
export function isEffectTheme(theme: DemoTheme): boolean {
	const background = theme.colors?.background?.hex ?? "";
	const css = theme.colors?.css ?? "";
	return (
		background.includes(",") ||
		background.includes("url(") ||
		css.includes("animation")
	);
}

/**
 * Derive the set of modifier tags for a registry theme entry.
 * Tags are non-exclusive (e.g. github_dark_dimmed is both
 * dark-variant and dimmed).
 */
export function getModifierTags(theme: DemoTheme | undefined): Set<string> {
	const tags = new Set<string>();
	const name = String(theme?.name || "").toLowerCase();
	if (!name) return tags;

	const segments = name.split(/[_-]/);
	if (segments.includes("shadow")) tags.add("shadow");
	if (segments.includes("dark") && name !== "dark") tags.add("dark-variant");
	if (segments.includes("light") && name !== "light") tags.add("light-variant");
	if (name.includes("dimmed")) tags.add("dimmed");
	if (
		segments.some((segment) => SPECIAL_SEGMENTS.has(segment)) ||
		name.includes("old_blurple") ||
		/\d$/.test(name)
	) {
		tags.add("special");
	}
	if (name.startsWith("catppuccin")) tags.add("catppuccin");
	if (isEffectTheme(theme as DemoTheme)) tags.add("gradient-effect");

	return tags;
}

/**
 * Build dropdown options limited to modifiers actually present in the
 * registry, so the filter never offers dead choices.
 */
export function buildModifierOptions(
	themes: DemoTheme[],
): { value: string; label: string }[] {
	const present = new Set<string>();
	for (const theme of themes || []) {
		for (const tag of getModifierTags(theme)) present.add(tag);
	}
	return MODIFIER_OPTIONS.filter(
		(option) => option.value === MODIFIER_ALL || present.has(option.value),
	);
}

/**
 * Keep the themes that carry a variant tag.
 *
 * The empty tag means "no variant filter", so every theme passes.
 */
export function filterByModifier(
	themes: DemoTheme[],
	modifier: string,
): DemoTheme[] {
	if (!modifier || modifier === MODIFIER_ALL) return [...themes];
	return themes.filter((theme) => getModifierTags(theme).has(modifier));
}

/** The sections the gallery is grouped into. */
export type ThemeGroups = {
	Core: DemoTheme[];
	Catppuccin: DemoTheme[];
	Light: DemoTheme[];
	Dark: DemoTheme[];
	"Gradients & Effects": DemoTheme[];
};

/** The name of a group, in the order the groups are shown. */
export type ThemeGroup = keyof ThemeGroups;

const CORE_THEMES = new Set([
	"default",
	"dark",
	"light",
	"transparent",
	"highcontrast",
]);

/**
 * The relative luminance of a hex colour, or null when it is not one.
 *
 * Used to decide whether a theme reads as light or dark.
 */
export function luminance(hex: string | undefined): number | null {
	const h = String(hex || "").replace(/^#/, "");
	const full =
		h.length === 3
			? h
					.split("")
					.map((c) => c + c)
					.join("")
			: h;
	if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
	const channel = (offset: number) => {
		const c = parseInt(full.slice(offset, offset + 2), 16) / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

/**
 * The group a theme belongs to.
 *
 * The groups are derived from the registry content, so a new theme lands in a
 * sensible group instead of an "Other" bucket.
 */
export function groupOf(theme: DemoTheme): ThemeGroup {
	const name = theme.name.toLowerCase();
	if (CORE_THEMES.has(name)) return "Core";
	if (name.startsWith("catppuccin")) return "Catppuccin";
	if (isEffectTheme(theme)) return "Gradients & Effects";
	const lum = luminance(theme.colors?.background?.hex);
	return lum !== null && lum >= 0.5 ? "Light" : "Dark";
}

/**
 * Group the themes for the gallery.
 */
export function groupThemes(themes: DemoTheme[]): ThemeGroups {
	const groups: ThemeGroups = {
		Core: [],
		Catppuccin: [],
		Light: [],
		Dark: [],
		"Gradients & Effects": [],
	};

	for (const theme of themes) {
		groups[groupOf(theme)].push(theme);
	}

	return groups;
}
