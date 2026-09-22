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
