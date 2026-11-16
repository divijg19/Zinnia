/**
 * @vitest-environment jsdom
 *
 * The demo catalog renders into the page DOM.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { Catalog } from "../../demo/Catalog.js";
import { requiredElement } from "../_testShim";

const stubFactory = {
	createAll: (_themeName: string) => [],
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
	const themes = makeThemes();
	const catalog = new Catalog(container, stubFactory, themes);
	catalog.render();
	return { container, catalog, themes };
}

afterEach(() => {
	document.body.innerHTML = "";
	// The clipboard is read-only on the navigator, so the test installs it
	// as a configurable property and takes it away again afterwards.
	Reflect.deleteProperty(window.navigator, "clipboard");
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

		const darkRow = requiredElement<HTMLElement>(
			container,
			'[data-theme="dark"]',
		);
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
		Object.defineProperty(window.navigator, "clipboard", {
			value: { writeText },
			configurable: true,
		});

		const copyBtn = requiredElement<HTMLElement>(
			container,
			'[data-copy-theme="dark"]',
		);
		copyBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
		await Promise.resolve();

		expect(writeText).toHaveBeenCalledTimes(1);
		const copied = JSON.parse(String(writeText.mock.calls[0]?.[0] ?? "{}"));
		expect(copied.name).toBe("dark");
		expect(copied.widgets).toBeUndefined();
		expect(onThemeChange).not.toHaveBeenCalled();
	});

	it("shows an empty state when the filter matches nothing", () => {
		const { container, catalog } = makeCatalog();
		catalog.setVisible([], "no-such-theme-xyz");
		expect(container.querySelector(".catalog-empty")).not.toBeNull();
	});

	it("highlights the matched query in theme names", () => {
		const { container, catalog, themes } = makeCatalog();
		catalog.setVisible(
			themes.filter((theme) => theme.name === "dark"),
			"ark",
		);
		const nameCell = requiredElement<HTMLElement>(
			container,
			'[data-theme="dark"] .theme-name-cell > span',
		);
		expect(nameCell.innerHTML).toContain("<mark>ark</mark>");
	});

	it("marks the selected theme in place", () => {
		const { container, catalog } = makeCatalog();
		catalog.updateTheme("dark");
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
