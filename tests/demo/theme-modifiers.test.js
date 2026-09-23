import { describe, expect, it } from "vitest";
import {
	buildModifierOptions,
	getModifierTags,
	MODIFIER_ALL,
} from "../../demo/utils/theme-modifiers.js";

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
		expect(getModifierTags(null).size).toBe(0);
		expect(getModifierTags({}).size).toBe(0);
	});
});

describe("demo modifier dropdown options", () => {
	it("always starts with All variants and skips absent modifiers", () => {
		const options = buildModifierOptions([
			{ name: "dracula" },
			{ name: "shadow_red" },
		]);
		expect(options[0]).toEqual({ value: MODIFIER_ALL, label: "All variants" });
		const values = options.map((o) => o.value);
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
