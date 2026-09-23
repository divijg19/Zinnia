// Theme modifier tags derived from registry naming conventions.
//
// Modifiers (shadow, dark/light variants, dimmed, special editions, …)
// exist only as naming patterns in the theme keys — there is no stored
// field — so both tabs derive tags at runtime from this single module
// instead of duplicating convention logic.

export const MODIFIER_ALL = "";

export const MODIFIER_OPTIONS = [
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
 * Derive the set of modifier tags for a registry theme entry.
 * Tags are non-exclusive (e.g. github_dark_dimmed is both
 * dark-variant and dimmed).
 */
export function getModifierTags(theme) {
	const tags = new Set();
	const name = String(theme?.name || "").toLowerCase();
	if (!name) return tags;

	const segments = name.split(/[_-]/);
	if (segments.includes("shadow")) tags.add("shadow");
	if (segments.includes("dark") && name !== "dark") tags.add("dark-variant");
	if (segments.includes("light") && name !== "light") tags.add("light-variant");
	if (name.includes("dimmed")) tags.add("dimmed");
	if (
		segments.some((s) => SPECIAL_SEGMENTS.has(s)) ||
		name.includes("old_blurple") ||
		/\d$/.test(name)
	)
		tags.add("special");
	if (name.startsWith("catppuccin")) tags.add("catppuccin");

	// Data-based, mirroring the "Gradients & Effects" group rule in
	// theme-selector.js so the two stay consistent.
	const colors = theme?.colors || {};
	const bg = colors.background?.hex ?? "";
	const css = colors.css ?? "";
	if (bg.includes(",") || bg.includes("url(") || css.includes("animation")) {
		tags.add("gradient-effect");
	}

	return tags;
}

/**
 * Build dropdown options limited to modifiers actually present in the
 * registry, so the filter never offers dead choices.
 */
export function buildModifierOptions(themes) {
	const present = new Set();
	for (const theme of themes || []) {
		for (const tag of getModifierTags(theme)) present.add(tag);
	}
	return MODIFIER_OPTIONS.filter(
		(opt) => opt.value === MODIFIER_ALL || present.has(opt.value),
	);
}
