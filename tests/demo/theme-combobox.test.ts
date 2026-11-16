/**
 * @vitest-environment jsdom
 *
 * The theme search box: a combobox that owns a listbox of suggestions.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DemoTheme } from "../../demo/types.js";
import { createThemeCombobox } from "../../demo/utils/theme-combobox.js";
import { buildSearchIndex } from "../../demo/utils/theme-search.js";

const THEMES: DemoTheme[] = [
	{
		name: "default",
		displayName: "Default",
		widgets: {
			stats: { src: "./assets/default-stats.svg", width: 495, height: 195 },
		},
	},
	{
		name: "dracula",
		displayName: "Dracula",
		widgets: {
			stats: { src: "./assets/dracula-stats.svg", width: 495, height: 195 },
		},
	},
	{
		name: "ocean_dark",
		displayName: "Ocean Dark",
		widgets: {
			stats: { src: "./assets/ocean_dark-stats.svg", width: 495, height: 195 },
		},
	},
];

const GROUPED: DemoTheme[] = [
	{ name: "default", displayName: "Default" },
	{ name: "catppuccin_mocha", displayName: "Catppuccin Mocha" },
	{
		name: "solarized-light",
		displayName: "Solarized Light",
		colors: { background: { hex: "fdf6e3" } },
	},
	{
		name: "dracula",
		displayName: "Dracula",
		colors: { background: { hex: "282a36" } },
	},
	{
		name: "ambient_gradient",
		displayName: "Ambient Gradient",
		colors: { background: { hex: "35,4158d0,c850c0" } },
	},
];

function setup(themes: DemoTheme[] = THEMES) {
	document.body.innerHTML = `
		<div class="theme-search">
			<input id="theme-search" type="search" role="combobox" aria-expanded="false" aria-controls="theme-suggestions" aria-autocomplete="list" />
			<div id="theme-suggestions" role="listbox" hidden></div>
		</div>
	`;
	const input = document.getElementById("theme-search") as HTMLInputElement;
	const list = document.getElementById("theme-suggestions") as HTMLElement;
	const onSelect = vi.fn();
	const onQuery = vi.fn();
	const combobox = createThemeCombobox({
		input,
		list,
		index: buildSearchIndex(themes),
		onSelect,
		onQuery,
	});
	return { input, list, onSelect, onQuery, combobox };
}

function key(input: HTMLInputElement, name: string): void {
	input.dispatchEvent(
		new KeyboardEvent("keydown", { key: name, bubbles: true }),
	);
}

function options(list: HTMLElement): HTMLElement[] {
	return Array.from(list.querySelectorAll<HTMLElement>(".suggestion"));
}

describe("demo theme combobox", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	it("opens on focus and lists the themes", () => {
		const { input, list } = setup();
		input.dispatchEvent(new FocusEvent("focus"));
		expect(list.hidden).toBe(false);
		expect(input.getAttribute("aria-expanded")).toBe("true");
		expect(options(list)).toHaveLength(THEMES.length);
	});

	it("filters as you type", () => {
		const { input, list, onQuery } = setup();
		input.value = "drac";
		input.dispatchEvent(new Event("input"));
		expect(options(list).map((option) => option.dataset.theme)).toEqual([
			"dracula",
		]);
		expect(onQuery).toHaveBeenCalledWith("drac", expect.any(Array));
	});

	it("highlights the matched characters and shows the card", () => {
		const { input, list } = setup();
		input.value = "drac";
		input.dispatchEvent(new Event("input"));
		const option = options(list)[0];
		expect(option?.querySelector("mark")?.textContent).toBe("drac");
		expect(option?.querySelector("img")?.getAttribute("src")).toBe(
			"./assets/dracula-stats.svg",
		);
	});

	it("moves the active option with the arrow keys", () => {
		const { input, list } = setup();
		input.dispatchEvent(new FocusEvent("focus"));
		// The first suggestion is active as soon as the list opens.
		expect(input.getAttribute("aria-activedescendant")).toBe(
			"theme-option-default",
		);
		key(input, "ArrowDown");
		expect(input.getAttribute("aria-activedescendant")).toBe(
			"theme-option-dracula",
		);
		expect(options(list)[1]?.getAttribute("aria-selected")).toBe("true");
		key(input, "ArrowUp");
		expect(input.getAttribute("aria-activedescendant")).toBe(
			"theme-option-default",
		);
	});

	it("selects the active option with Enter", () => {
		const { input, onSelect } = setup();
		input.dispatchEvent(new FocusEvent("focus"));
		key(input, "ArrowDown");
		key(input, "Enter");
		expect(onSelect).toHaveBeenCalledWith(
			expect.objectContaining({ name: "dracula" }),
		);
		expect(input.value).toBe("dracula");
	});

	it("closes on Escape", () => {
		const { input, list } = setup();
		input.dispatchEvent(new FocusEvent("focus"));
		key(input, "Escape");
		expect(list.hidden).toBe(true);
		expect(input.getAttribute("aria-expanded")).toBe("false");
	});

	it("says so when nothing matches", () => {
		const { input, list } = setup();
		input.value = "zzzz";
		input.dispatchEvent(new Event("input"));
		expect(options(list)).toHaveLength(0);
		expect(list.textContent).toContain("No theme matches");
	});
});

describe("demo theme combobox categories", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	it("groups the suggestions by category", () => {
		const { input, list } = setup(GROUPED);
		input.dispatchEvent(new FocusEvent("focus"));

		const groups = Array.from(
			list.querySelectorAll<HTMLElement>(".suggestion-group"),
		);
		expect(groups.map((group) => group.getAttribute("aria-label"))).toEqual([
			"Core",
			"Catppuccin",
			"Light",
			"Dark",
			"Gradients & Effects",
		]);
		for (const group of groups) {
			const title = group.querySelector(".suggestion-group-title");
			expect(title?.textContent).toBe(group.getAttribute("aria-label"));
			expect(group.querySelectorAll(".suggestion").length).toBeGreaterThan(0);
		}
		expect(options(list)).toHaveLength(GROUPED.length);
	});

	it("keeps the keyboard on the options, not on the headers", () => {
		const { input, onSelect } = setup(GROUPED);
		input.dispatchEvent(new FocusEvent("focus"));
		expect(input.getAttribute("aria-activedescendant")).toBe(
			"theme-option-default",
		);
		key(input, "ArrowDown");
		expect(input.getAttribute("aria-activedescendant")).toBe(
			"theme-option-catppuccin_mocha",
		);
		key(input, "Enter");
		expect(onSelect).toHaveBeenCalledWith(
			expect.objectContaining({ name: "catppuccin_mocha" }),
		);
	});

	it("keeps the best match first, whatever category it is in", () => {
		const { input, list } = setup(GROUPED);
		input.value = "drac";
		input.dispatchEvent(new Event("input"));
		expect(options(list)[0]?.dataset.theme).toBe("dracula");
		expect(
			list.querySelector(".suggestion-group")?.getAttribute("aria-label"),
		).toBe("Dark");
	});
});
