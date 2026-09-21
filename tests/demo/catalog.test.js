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
