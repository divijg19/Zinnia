import { afterEach, describe, expect, it, vi } from "vitest";
import { Catalog } from "../../demo/Catalog.js";

const stubFactory = {
	createAll: () => [],
};

function makeThemes() {
	return [
		{
			name: "default",
			displayName: "Default",
			previewColors: ["#2f80ed"],
			colors: { title: { hex: "2f80ed" } },
			widgets: { stats: { src: "./assets/default-stats.svg" } },
		},
		{
			name: "dark",
			displayName: "Dark",
			previewColors: ["#fff"],
			colors: { title: { hex: "fff" } },
			widgets: { stats: { src: "./assets/dark-stats.svg" } },
		},
	];
}

function makeCatalog() {
	const container = document.createElement("ul");
	document.body.appendChild(container);
	const catalog = new Catalog(container, stubFactory, makeThemes());
	catalog.render();
	return { container, catalog };
}

afterEach(() => {
	document.body.innerHTML = "";
	// @ts-expect-error test cleanup
	delete window.navigator.clipboard;
});

describe("demo Catalog", () => {
	it("renders one row per theme with a copy button", () => {
		const { container } = makeCatalog();
		const rows = container.querySelectorAll(".catalog-row");
		expect(rows).toHaveLength(2);
		expect(container.querySelectorAll("[data-copy-theme]").length).toBe(2);
	});

	it("selects a theme when its row is clicked", () => {
		const { container, catalog } = makeCatalog();
		const onThemeChange = vi.fn();
		catalog.onThemeChange(onThemeChange);

		const darkRow = container.querySelector('[data-theme="dark"]');
		darkRow.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

		expect(onThemeChange).toHaveBeenCalledWith("dark");
		expect(
			container
				.querySelector('[data-theme="dark"]')
				?.getAttribute("aria-current"),
		).toBe("true");
		expect(
			container
				.querySelector('[data-theme="default"]')
				?.getAttribute("aria-current"),
		).toBe("false");
	});

	it("copies canonical theme JSON without widget metadata", async () => {
		const { container, catalog } = makeCatalog();
		const onThemeChange = vi.fn();
		catalog.onThemeChange(onThemeChange);
		const writeText = vi.fn().mockResolvedValue(undefined);
		window.navigator.clipboard = { writeText };

		const copyBtn = container.querySelector('[data-copy-theme="dark"]');
		copyBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
		await Promise.resolve();

		expect(writeText).toHaveBeenCalledTimes(1);
		const copied = JSON.parse(writeText.mock.calls[0][0]);
		expect(copied.name).toBe("dark");
		expect(copied.widgets).toBeUndefined();
		expect(onThemeChange).not.toHaveBeenCalled();
	});

	it("shows an empty state when the filter matches nothing", () => {
		const { container, catalog } = makeCatalog();
		catalog.filter("no-such-theme-xyz");
		expect(container.querySelector(".catalog-empty")).not.toBeNull();
	});

	it("highlights the matched query in theme names", () => {
		const { container, catalog } = makeCatalog();
		catalog.filter("ark");
		const nameCell = container.querySelector(
			'[data-theme="dark"] .theme-name-cell > span',
		);
		expect(nameCell.innerHTML).toContain("<mark>ark</mark>");
	});

	it("selects the first filtered theme on selectFirstMatch", () => {
		const { container, catalog } = makeCatalog();
		const onThemeChange = vi.fn();
		catalog.onThemeChange(onThemeChange);
		catalog.filter("ark");
		expect(catalog.selectFirstMatch()).toBe("dark");
		expect(onThemeChange).toHaveBeenCalledWith("dark");
		expect(
			container
				.querySelector('[data-theme="dark"]')
				?.getAttribute("aria-current"),
		).toBe("true");
	});

	it("returns null on selectFirstMatch with no matches", () => {
		const { catalog } = makeCatalog();
		const onThemeChange = vi.fn();
		catalog.onThemeChange(onThemeChange);
		catalog.filter("no-such-theme-xyz");
		expect(catalog.selectFirstMatch()).toBeNull();
		expect(onThemeChange).not.toHaveBeenCalled();
	});

	it("navigates themes with arrow keys", () => {
		const { container, catalog } = makeCatalog();
		const onThemeChange = vi.fn();
		catalog.onThemeChange(onThemeChange);

		container.dispatchEvent(
			new window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
		);
		expect(onThemeChange).toHaveBeenCalledWith("dark");
	});
});

describe("demo Catalog modifier filter", () => {
	function makeModifierCatalog() {
		const container = document.createElement("ul");
		document.body.appendChild(container);
		const themes = [
			...makeThemes(),
			{
				name: "shadow_red",
				displayName: "shadow_red",
				previewColors: ["#ff0000"],
				colors: { title: { hex: "ff0000" } },
				widgets: {},
			},
			{
				name: "ocean_dark",
				displayName: "ocean_dark",
				previewColors: ["#000080"],
				colors: { title: { hex: "000080" } },
				widgets: {},
			},
		];
		const catalog = new Catalog(container, stubFactory, themes);
		catalog.render();
		return { container, catalog };
	}

	it("filters by modifier alone", () => {
		const { catalog } = makeModifierCatalog();
		catalog.filter("", "shadow");
		expect(catalog.filteredThemes.map((t) => t.name)).toEqual(["shadow_red"]);
	});

	it("combines text query with modifier", () => {
		const { catalog } = makeModifierCatalog();
		catalog.filter("dark", "dark-variant");
		expect(catalog.filteredThemes.map((t) => t.name)).toEqual(["ocean_dark"]);
	});

	it("resets to all themes when both are cleared", () => {
		const { catalog } = makeModifierCatalog();
		catalog.filter("dark", "dark-variant");
		catalog.filter("", "");
		expect(catalog.filteredThemes).toHaveLength(4);
	});
});
