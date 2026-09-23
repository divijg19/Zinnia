import { describe, expect, it, vi } from "vitest";
import { ThemeSelector } from "../../demo/utils/theme-selector.js";

const themes = [
	{ name: "default", displayName: "Default" },
	{ name: "dark", displayName: "Dark" },
	{ name: "dracula", displayName: "Dracula" },
];

function makeSelector() {
	// ThemeSelector inserts its search wrapper before the select, so the
	// select needs a parent element.
	const container = document.createElement("div");
	document.body.appendChild(container);
	const select = document.createElement("select");
	container.appendChild(select);
	return new ThemeSelector(select, themes);
}

describe("demo ThemeSelector", () => {
	it("hides non-matching options when filtering", () => {
		const selector = makeSelector();
		selector.filterThemes("drac");
		const visible = Array.from(
			selector.select.querySelectorAll("option:not([hidden])"),
		).map((o) => o.value);
		expect(visible).toEqual(["dracula"]);
	});

	it("selects the first visible theme on selectFirstMatch", () => {
		const selector = makeSelector();
		const onChange = vi.fn();
		selector.onChange(onChange);
		selector.filterThemes("dar");
		expect(selector.selectFirstMatch()).toBe("dark");
		expect(selector.select.value).toBe("dark");
		expect(onChange).toHaveBeenCalledWith("dark");
	});

	it("returns null on selectFirstMatch with no matches", () => {
		const selector = makeSelector();
		const onChange = vi.fn();
		selector.onChange(onChange);
		selector.filterThemes("no-such-theme-xyz");
		expect(selector.selectFirstMatch()).toBeNull();
		expect(onChange).not.toHaveBeenCalled();
	});
});

describe("demo ThemeSelector groups", () => {
	it("computes relative luminance for hex colors", () => {
		expect(ThemeSelector.luminance("ffffff")).toBeCloseTo(1, 2);
		expect(ThemeSelector.luminance("000000")).toBe(0);
		expect(ThemeSelector.luminance("fff")).toBeCloseTo(1, 2);
		expect(ThemeSelector.luminance("not-a-color")).toBeNull();
		expect(ThemeSelector.luminance("")).toBeNull();
	});

	it("partitions every theme into exactly one group", () => {
		const selector = makeSelector();
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
		const groups = selector.groupThemes(input);
		const assigned = Object.values(groups).flat();
		expect(assigned).toHaveLength(input.length);
		expect(new Set(assigned.map((t) => t.name)).size).toBe(input.length);
		expect(groups.Core.map((t) => t.name)).toEqual(["default"]);
		expect(groups.Catppuccin.map((t) => t.name)).toEqual(["catppuccin_mocha"]);
		expect(groups.Light.map((t) => t.name)).toEqual(["solarized-light"]);
		expect(groups.Dark.map((t) => t.name).sort()).toEqual([
			"dracula",
			"mystery",
		]);
		expect(groups["Gradients & Effects"].map((t) => t.name).sort()).toEqual([
			"watchdog",
			"wtf",
		]);
	});
});

describe("demo ThemeSelector modifier filter", () => {
	function makeModifierSelector() {
		const container = document.createElement("div");
		document.body.appendChild(container);
		const select = document.createElement("select");
		container.appendChild(select);
		return new ThemeSelector(select, [
			{ name: "default", displayName: "Default" },
			{ name: "shadow_red", displayName: "shadow_red" },
			{ name: "ocean_dark", displayName: "ocean_dark" },
		]);
	}

	function visibleValues(selector) {
		return Array.from(
			selector.select.querySelectorAll("option:not([hidden])"),
		).map((o) => o.value);
	}

	it("injects a modifier dropdown with only present variants", () => {
		const selector = makeModifierSelector();
		const options = Array.from(
			selector.modifierSelect.querySelectorAll("option"),
		).map((o) => o.value);
		expect(options[0]).toBe("");
		expect(options).toContain("shadow");
		expect(options).toContain("dark-variant");
		expect(options).not.toContain("dimmed");
	});

	it("combines text query with modifier selection", () => {
		const selector = makeModifierSelector();
		selector.filterThemes("", "shadow");
		expect(visibleValues(selector)).toEqual(["shadow_red"]);
		selector.filterThemes("ocean", "dark-variant");
		expect(visibleValues(selector)).toEqual(["ocean_dark"]);
		selector.filterThemes("", "");
		expect(visibleValues(selector)).toHaveLength(3);
	});

	it("applies the dropdown change through stored filter state", () => {
		const selector = makeModifierSelector();
		selector.modifierSelect.value = "dark-variant";
		selector.modifierSelect.dispatchEvent(new window.Event("change"));
		expect(visibleValues(selector)).toEqual(["ocean_dark"]);
		expect(selector.getFilters()).toEqual({
			query: "",
			modifier: "dark-variant",
		});
	});
});
