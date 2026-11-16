import type { DemoTheme } from "../types.js";

/**
 * How the demo categorises the themes.
 *
 * Three things are derived from one registry entry, because they answer the
 * same question - what kind of theme is this? - and they used to be written
 * out twice, with a comment admitting the copies had to be kept in sync.
 *
 * - **section** - the category a theme belongs to, one of five. It is the
 *   grouping the gallery and the suggestion list show.
 * - **family** - the base name the variants are built on (`github_dark` and
 *   `github_dark_dimmed` are both `github`). It is searchable, so asking for
 *   a family finds the family.
 * - **facets** - the qualities a theme has: light or dark, dimmed, gradient,
 *   and so on. Every theme has at least one, which is what makes the filters
 *   honest: there is no filter that matches nothing.
 */

/** A theme with the fields the derivation reads. */
export type { DemoTheme };

/** The categories the gallery and the suggestions are grouped into. */
export type ThemeSection =
	| "Core"
	| "Catppuccin"
	| "Light"
	| "Dark"
	| "Gradients & Effects";

/** The sections in the order they are shown. */
export const SECTIONS: ThemeSection[] = [
	"Core",
	"Catppuccin",
	"Light",
	"Dark",
	"Gradients & Effects",
];

/** The qualities a theme can carry. */
export type ThemeFacet =
	| "light"
	| "dark"
	| "dimmed"
	| "gradient"
	| "catppuccin"
	| "shadow"
	| "edition";

/** The facets, in the order they are offered, with the words to search for. */
export const FACET_OPTIONS: { value: ThemeFacet; label: string }[] = [
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
	{ value: "dimmed", label: "Dimmed" },
	{ value: "gradient", label: "Gradient" },
	{ value: "catppuccin", label: "Catppuccin" },
	{ value: "shadow", label: "Shadow" },
	{ value: "edition", label: "Edition" },
];

/** The words a query can use to ask for a facet or a section. */
const FILTER_WORDS = new Set<string>([
	...FACET_OPTIONS.flatMap((option) => option.label.toLowerCase().split(/\s+/)),
	...SECTIONS.flatMap((section) => section.toLowerCase().split(/[\s&]+/)),
]);

/** The empty filter: every facet. */
export const FACET_ALL = "";

/** The name suffixes that turn a theme into a variant of a family. */
const VARIANT_TOKENS = new Set([
	"dark",
	"light",
	"dimmed",
	"gradient",
	"night",
	"nightowl",
	"pro",
	"lover",
	"minimus",
	"repocard",
	"navy",
	"pink",
	"old",
	"blurple",
	"latte",
	"mocha",
	"frappe",
	"macchiato",
	"2",
]);

/** The names that stand on their own, whatever their colour. */
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
 * Three, four, six and eight digit hex are read; the alpha is ignored, and a
 * colour that is fully transparent is not a colour.
 */
export function luminance(hex: string | undefined): number | null {
	const h = String(hex || "").replace(/^#/, "");
	const full = /^[0-9a-fA-F]+$/.test(h) ? h : "";
	if (![3, 4, 6, 8].includes(full.length)) return null;
	if ((full.length === 4 || full.length === 8) && full.endsWith("00"))
		return null;
	const rgb =
		full.length === 3 || full.length === 4
			? full
					.slice(0, 3)
					.split("")
					.map((c) => c + c)
					.join("")
			: full.slice(0, 6);
	const channel = (offset: number) => {
		const c = parseInt(rgb.slice(offset, offset + 2), 16) / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

/** The colours a theme paints its background with. */
function backgroundsOf(theme: DemoTheme): string[] {
	const direct = theme.colors?.background?.hex;
	const palette = (theme.colors as { palette?: { bg?: unknown } } | undefined)
		?.palette;
	const entries = Array.isArray(palette?.bg) ? palette.bg : [];
	return [direct, ...entries].filter(
		(entry): entry is string => typeof entry === "string",
	);
}

/** The first background colour that is a plain hex, or null. */
function backgroundHexOf(theme: DemoTheme): string | null {
	for (const entry of backgroundsOf(theme)) {
		if (/^#?[0-9a-fA-F]{3,8}$/.test(entry)) return entry;
	}
	return null;
}

/**
 * Does the theme draw itself with a gradient or an animation?
 *
 * Both the section and the facets ask this, so it is answered once.
 */
export function isEffectTheme(theme: DemoTheme): boolean {
	const painted = backgroundsOf(theme).join(" ");
	const css = theme.colors?.css ?? "";
	return (
		painted.includes("url(") ||
		painted.includes(",") ||
		css.includes("animation")
	);
}

/**
 * The section a theme belongs to.
 *
 * The sections are derived from the registry content, so a new theme lands in
 * a sensible section instead of an "Other" bucket.
 */
export function sectionOf(theme: DemoTheme): ThemeSection {
	const name = theme.name.toLowerCase();
	if (CORE_THEMES.has(name)) return "Core";
	if (name.startsWith("catppuccin")) return "Catppuccin";
	if (isEffectTheme(theme)) return "Gradients & Effects";
	const lum = luminance(backgroundHexOf(theme) ?? undefined);
	return lum !== null && lum >= 0.5 ? "Light" : "Dark";
}

/** The sections, each holding the themes that belong to it. */
export function sectionThemes(
	themes: DemoTheme[],
): Record<ThemeSection, DemoTheme[]> {
	const sections = {} as Record<ThemeSection, DemoTheme[]>;
	for (const section of SECTIONS) sections[section] = [];
	for (const theme of themes) {
		sections[sectionOf(theme)].push(theme);
	}
	return sections;
}

/**
 * The family a theme belongs to.
 *
 * The base name with the variant suffixes taken off, so `github_dark` and
 * `github_dark_dimmed` are both `github`. A theme with no variant suffix is
 * its own family.
 */
export function familyOf(theme: DemoTheme): string {
	const parts = theme.name.toLowerCase().split(/[_-]/);
	const base = parts.filter((part) => !VARIANT_TOKENS.has(part)).join("-");
	return base || theme.name.toLowerCase();
}

/**
 * The qualities a theme carries.
 *
 * Light and dark come from the colour, not the name, so they cover every
 * theme; the rest come from what the name and the colours say.
 */
export function facetsOf(theme: DemoTheme): ThemeFacet[] {
	const name = theme.name.toLowerCase();
	const facets = new Set<ThemeFacet>();

	const lum = luminance(backgroundHexOf(theme) ?? undefined);
	if (lum !== null) facets.add(lum >= 0.5 ? "light" : "dark");
	if (name.startsWith("catppuccin")) facets.add("catppuccin");
	if (name.split(/[_-]/).includes("shadow")) facets.add("shadow");
	if (name.includes("dimmed")) facets.add("dimmed");
	if (isEffectTheme(theme)) facets.add("gradient");
	if (isEdition(name)) facets.add("edition");

	return [...facets];
}

/**
 * Is the theme a variant with a twist - a recolour, a special edition?
 *
 * The old "special" tag. It is an edition, not a secret.
 */
function isEdition(name: string): boolean {
	const segments = name.split(/[_-]/);
	return (
		segments.some((segment) =>
			["lover", "pro", "minimus", "pink", "navy", "repocard"].includes(segment),
		) ||
		name.includes("old_blurple") ||
		/\d$/.test(name)
	);
}

/**
 * Whether a query is asking for a facet or a section.
 *
 * The filters and the search box must agree: a query that can pick a filter
 * by clicking must be able to pick it by typing, and the categories the list
 * is grouped into are queries too.
 */
export function isFilterQuery(query: string): boolean {
	return FILTER_WORDS.has(query.trim().toLowerCase());
}

/** The label of a facet, for the chips and the suggestions. */
export function facetLabel(facet: string): string {
	return FACET_OPTIONS.find((option) => option.value === facet)?.label ?? facet;
}

/**
 * Keep the themes that carry every one of the facets.
 *
 * An empty set means "no filter", so every theme passes.
 */
export function filterByFacets(
	themes: DemoTheme[],
	facets: string[],
): DemoTheme[] {
	if (!facets.length) return [...themes];
	return themes.filter((theme) => {
		const carried = facetsOf(theme);
		return facets.every((facet) => carried.includes(facet as ThemeFacet));
	});
}

/**
 * Count the themes that carry each facet.
 *
 * The chips show the counts, so a filter that matches nothing is never
 * offered, and the user can see what a filter will do before choosing it.
 */
export function countFacets(themes: DemoTheme[]): Record<ThemeFacet, number> {
	const counts = {} as Record<ThemeFacet, number>;
	for (const option of FACET_OPTIONS) counts[option.value] = 0;
	for (const theme of themes) {
		for (const facet of facetsOf(theme)) counts[facet]++;
	}
	return counts;
}
