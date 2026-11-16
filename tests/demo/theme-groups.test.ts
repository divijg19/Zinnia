import { describe, expect, it } from "vitest";
import {
	buildModifierOptions,
	filterByModifier,
	getModifierTags,
	groupThemes,
	isEffectTheme,
	luminance,
	MODIFIER_ALL,
} from "../../demo/utils/theme-groups.js";

describe("demo theme modifier tags", () => {
	it("tags shadow-prefixed themes", () => {
		expect(getModifierTags({ name: "shadow_red" }).has("shadow")).toBe(true);
		expect(getModifierTags({ name: "dracula" }).has("shadow")).toBe(false);
	});

	it("tags dark/light variants but not the base themes", () => {
		expect(getModifierTags({ name: "ocean_dark" }).has("dark-variant")).toBe(
			true,
		);
		expect(getModifierTags({ name: "vue-dark" }).has("dark-variant")).toBe(
			true,
		);
		expect(getModifierTags({ name: "dark" }).has("dark-variant")).toBe(false);
		expect(
			getModifierTags({ name: "gruvbox_light" }).has("light-variant"),
		).toBe(true);
		expect(getModifierTags({ name: "light" }).has("light-variant")).toBe(false);
	});

	it("tags dimmed themes including concatenated legacy names", () => {
		expect(getModifierTags({ name: "github_dark_dimmed" }).has("dimmed")).toBe(
			true,
		);
		expect(getModifierTags({ name: "gitdimmed" }).has("dimmed")).toBe(true);
		expect(getModifierTags({ name: "dracula" }).has("dimmed")).toBe(false);
	});

	it("allows multiple tags on one theme", () => {
		const tags = getModifierTags({ name: "github_dark_dimmed" });
		expect(tags.has("dark-variant")).toBe(true);
		expect(tags.has("dimmed")).toBe(true);
	});

	it("tags special editions and catppuccin flavours", () => {
		expect(getModifierTags({ name: "dark_lover" }).has("special")).toBe(true);
		expect(getModifierTags({ name: "one_dark_pro" }).has("special")).toBe(true);
		expect(getModifierTags({ name: "cobalt2" }).has("special")).toBe(true);
		expect(
			getModifierTags({ name: "discord_old_blurple" }).has("special"),
		).toBe(true);
		expect(
			getModifierTags({ name: "catppuccin_mocha" }).has("catppuccin"),
		).toBe(true);
		expect(getModifierTags({ name: "dracula" }).has("special")).toBe(false);
	});

	it("tags gradients and effects from color data", () => {
		expect(
			getModifierTags({
				name: "ambient_gradient",
				colors: { background: { hex: "35,4158d0,c850c0" } },
			}).has("gradient-effect"),
		).toBe(true);
		expect(
			getModifierTags({
				name: "plain",
				colors: { background: { hex: "0f172a" } },
			}).has("gradient-effect"),
		).toBe(false);
	});

	it("returns no tags for plain base themes or empty input", () => {
		expect(getModifierTags({ name: "dracula" }).size).toBe(0);
		expect(getModifierTags(undefined).size).toBe(0);
		expect(getModifierTags({ name: "" }).size).toBe(0);
	});
});

describe("demo modifier dropdown options", () => {
	it("always starts with All variants and skips absent modifiers", () => {
		const options = buildModifierOptions([
			{ name: "dracula" },
			{ name: "shadow_red" },
		]);
		expect(options[0]).toEqual({ value: MODIFIER_ALL, label: "All variants" });
		const values = options.map((option) => option.value);
		expect(values).toContain("shadow");
		expect(values).not.toContain("dimmed");
		expect(values).not.toContain("catppuccin");
	});

	it("returns only All variants for an empty registry", () => {
		expect(buildModifierOptions([])).toEqual([
			{ value: MODIFIER_ALL, label: "All variants" },
		]);
	});
});

describe("demo theme groups", () => {
	it("computes relative luminance for hex colors", () => {
		expect(luminance("ffffff")).toBeCloseTo(1, 2);
		expect(luminance("000000")).toBe(0);
		expect(luminance("fff")).toBeCloseTo(1, 2);
		expect(luminance("not-a-color")).toBeNull();
		expect(luminance("")).toBeNull();
	});

	it("partitions every theme into exactly one group", () => {
		const input = [
			{ name: "default", colors: {} },
			{ name: "catppuccin_mocha", colors: {} },
			{ name: "solarized-light", colors: { background: { hex: "fdf6e3" } } },
			{ name: "dracula", colors: { background: { hex: "282a36" } } },
			{
				name: "watchdog",
				colors: { background: { hex: "45,520806,021D4A" } },
			},
			{ name: "wtf", colors: { css: "#root { animation: x 1s; }" } },
			{ name: "mystery", colors: { background: { hex: "zzz" } } },
		];
		const groups = groupThemes(input);
		const names = (group: string) =>
			(groups[group as keyof typeof groups] ?? []).map((theme) => theme.name);
		const assigned = Object.values(groups).flat();
		expect(assigned).toHaveLength(input.length);
		expect(new Set(assigned.map((theme) => theme.name)).size).toBe(
			input.length,
		);
		expect(names("Core")).toEqual(["default"]);
		expect(names("Catppuccin")).toEqual(["catppuccin_mocha"]);
		expect(names("Light")).toEqual(["solarized-light"]);
		expect(names("Dark").sort()).toEqual(["dracula", "mystery"]);
		expect(names("Gradients & Effects").sort()).toEqual(["watchdog", "wtf"]);
	});

	it("agrees with the modifier tags about what counts as an effect", () => {
		// The groups and the tags used to be written out twice, with a
		// comment saying the two copies had to be kept in sync.
		const effect = {
			name: "ambient_gradient",
			colors: { background: { hex: "35,4158d0,c850c0" } },
		};
		expect(isEffectTheme(effect)).toBe(true);
		expect(getModifierTags(effect).has("gradient-effect")).toBe(true);
	});
});

describe("demo modifier filter", () => {
	const themes = [
		{ name: "dracula" },
		{ name: "shadow_red" },
		{ name: "ocean_dark" },
		{ name: "catppuccin_mocha" },
	];

	it("keeps only the themes that carry the tag", () => {
		expect(
			filterByModifier(themes, "shadow").map((theme) => theme.name),
		).toEqual(["shadow_red"]);
		expect(
			filterByModifier(themes, "dark-variant").map((theme) => theme.name),
		).toEqual(["ocean_dark"]);
	});

	it("keeps every theme when no variant is chosen", () => {
		expect(filterByModifier(themes, MODIFIER_ALL)).toHaveLength(4);
		expect(filterByModifier(themes, "")).toHaveLength(4);
	});

	it("keeps nothing when no theme carries the tag", () => {
		expect(filterByModifier(themes, "dimmed")).toEqual([]);
	});
});
