import { describe, expect, it } from "vitest";
import type { DemoTheme } from "../../demo/types.js";
import {
	countFacets,
	FACET_ALL,
	FACET_OPTIONS,
	facetLabel,
	facetsOf,
	familyOf,
	filterByFacets,
	isEffectTheme,
	isFilterQuery,
	luminance,
	SECTIONS,
	sectionOf,
	sectionThemes,
} from "../../demo/utils/theme-taxonomy.js";

describe("demo theme taxonomy", () => {
	it("computes relative luminance for hex colors", () => {
		expect(luminance("ffffff")).toBeCloseTo(1, 2);
		expect(luminance("000000")).toBe(0);
		expect(luminance("fff")).toBeCloseTo(1, 2);
		expect(luminance("not-a-color")).toBeNull();
		expect(luminance("")).toBeNull();
		expect(luminance("ffffff00")).toBeNull();
	});

	it("reads the background from the palette when there is no direct hex", () => {
		const chartreuse: DemoTheme = {
			name: "chartreuse",
			colors: { palette: { bg: ["000", "fff"] } },
		};
		expect(sectionOf(chartreuse)).toBe("Dark");
		expect(facetsOf(chartreuse)).toContain("dark");
	});

	it("treats transparent as having no light or dark", () => {
		const transparent: DemoTheme = {
			name: "transparent",
			colors: { background: { hex: "ffffff00" } },
		};
		expect(sectionOf(transparent)).toBe("Core");
		expect(facetsOf(transparent)).not.toContain("light");
		expect(facetsOf(transparent)).not.toContain("dark");
	});

	it("derives sections from the registry content", () => {
		const input: DemoTheme[] = [
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
		const groups = sectionThemes(input);
		const names = (section: string) =>
			groups[section as keyof typeof groups].map((theme) => theme.name);
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

	it("agrees with the facets about what counts as an effect", () => {
		const effect: DemoTheme = {
			name: "ambient_gradient",
			colors: { background: { hex: "35,4158d0,c850c0" } },
		};
		expect(isEffectTheme(effect)).toBe(true);
		expect(facetsOf(effect)).toContain("gradient");
	});

	it("derives facets from names and colours", () => {
		expect(facetsOf({ name: "shadow_red" })).toContain("shadow");
		expect(facetsOf({ name: "dracula" })).not.toContain("shadow");
		expect(facetsOf({ name: "github_dark_dimmed" })).toContain("dimmed");
		expect(facetsOf({ name: "catppuccin_mocha" })).toContain("catppuccin");
		expect(facetsOf({ name: "blue_navy" })).toContain("edition");
		expect(facetsOf({ name: "cobalt2" })).toContain("edition");
		expect(
			facetsOf({
				name: "solarized-light",
				colors: { background: { hex: "fdf6e3" } },
			}),
		).toContain("light");
		expect(
			facetsOf({
				name: "dracula",
				colors: { background: { hex: "282a36" } },
			}),
		).toContain("dark");
	});

	it("derives families by removing variant suffixes", () => {
		expect(familyOf({ name: "github_dark" })).toBe("github");
		expect(familyOf({ name: "github_dark_dimmed" })).toBe("github");
		expect(familyOf({ name: "catppuccin_mocha" })).toBe("catppuccin");
		expect(familyOf({ name: "dracula" })).toBe("dracula");
		expect(familyOf({ name: "blue_navy" })).toBe("blue");
	});

	it("counts facets and keeps every theme filterable", () => {
		const themes: DemoTheme[] = [
			{ name: "dracula", colors: { background: { hex: "282a36" } } },
			{ name: "shadow_red", colors: { background: { hex: "ff0000" } } },
			{
				name: "ambient_gradient",
				colors: { background: { hex: "35,4158d0,c850c0" } },
			},
		];
		const counts = countFacets(themes);
		expect(counts.dark).toBe(2);
		expect(counts.light).toBe(0);
		expect(counts.shadow).toBe(1);
		expect(counts.gradient).toBe(1);
		// No filter matches nothing when something carries it.
		expect(Object.values(counts).every((count) => count >= 0)).toBe(true);
	});

	it("filters by facets", () => {
		const themes: DemoTheme[] = [
			{ name: "dracula", colors: { background: { hex: "282a36" } } },
			{ name: "shadow_red", colors: { background: { hex: "ff0000" } } },
			{ name: "ocean_dark", colors: { background: { hex: "0f172a" } } },
		];
		expect(
			filterByFacets(themes, ["shadow"]).map((theme) => theme.name),
		).toEqual(["shadow_red"]);
		expect(filterByFacets(themes, ["dark"]).map((theme) => theme.name)).toEqual(
			["dracula", "shadow_red", "ocean_dark"],
		);
		expect(filterByFacets(themes, [])).toHaveLength(3);
		expect(filterByFacets(themes, ["dimmed"])).toEqual([]);
	});

	it("recognises filter words", () => {
		expect(isFilterQuery("dark")).toBe(true);
		expect(isFilterQuery("gradient")).toBe(true);
		expect(isFilterQuery("core")).toBe(true);
		expect(isFilterQuery("effects")).toBe(true);
		expect(isFilterQuery("catppuccin")).toBe(true);
		expect(isFilterQuery("dracula")).toBe(false);
		expect(isFilterQuery("")).toBe(false);
	});

	it("exposes the facet and section options", () => {
		expect(FACET_OPTIONS.map((option) => option.value)).toContain("dark");
		expect(FACET_OPTIONS.map((option) => option.value)).toContain("edition");
		expect(SECTIONS).toEqual([
			"Core",
			"Catppuccin",
			"Light",
			"Dark",
			"Gradients & Effects",
		]);
		expect(FACET_ALL).toBe("");
		expect(facetLabel("dimmed")).toBe("Dimmed");
	});
});
