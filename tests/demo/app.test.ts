/**
 * @vitest-environment jsdom
 *
 * The demo page: one search drives both tabs.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const THEMES = [
	{
		name: "default",
		displayName: "Default",
		colors: { background: { hex: "ffffff" } },
		widgets: {
			stats: { src: "./assets/default-stats.svg", width: 495, height: 195 },
		},
	},
	{
		name: "dracula",
		displayName: "Dracula",
		colors: { background: { hex: "282a36" } },
		widgets: {
			stats: { src: "./assets/dracula-stats.svg", width: 495, height: 195 },
		},
	},
	{
		name: "ocean_dark",
		displayName: "Ocean Dark",
		colors: { background: { hex: "0f172a" } },
		widgets: {
			stats: { src: "./assets/ocean_dark-stats.svg", width: 495, height: 195 },
		},
	},
	{
		name: "shadow_red",
		displayName: "Shadow Red",
		colors: { background: { hex: "ff0000" } },
		widgets: {
			stats: { src: "./assets/shadow_red-stats.svg", width: 495, height: 195 },
		},
	},
];

const PAGE = `
	<button type="button" id="page-theme-toggle"></button>
	<div class="header-bar">
		<input id="theme-search" type="text" role="combobox" aria-expanded="false" aria-controls="theme-suggestions" />
		<div id="theme-suggestions" role="listbox" hidden></div>
		<button type="button" id="theme-prev"></button>
		<span id="theme-name"></span>
		<button type="button" id="theme-next"></button>
		<div id="facet-chips"></div>
		<span id="catalog-count"></span>
	</div>
	<button type="button" data-tab="dashboard"></button>
	<button type="button" data-tab="catalog"></button>
	<section id="panel-dashboard" class="tab-panel active"><div class="widget-grid" id="widget-grid"></div></section>
	<section id="panel-catalog" class="tab-panel" hidden><ul class="catalog-list" id="catalog-list"></ul></section>
`;

async function mountApp() {
	document.body.innerHTML = PAGE;
	globalThis.fetch = vi.fn(async (input: unknown) => {
		if (String(input).includes("theme-registry.json")) {
			return new Response(JSON.stringify({ themes: THEMES }), {
				status: 200,
				headers: { "content-type": "application/json" },
			});
		}
		throw new Error(`unexpected fetch: ${String(input)}`);
	}) as unknown as typeof fetch;

	const { ThemeDemoApp } = await import("../../demo/theme-demo-app.js");
	const app = new ThemeDemoApp();
	await app.init();
	return app;
}

function rows(): HTMLElement[] {
	return Array.from(
		document.querySelectorAll<HTMLElement>("#catalog-list .catalog-row"),
	);
}

function search(query: string): void {
	const input = document.getElementById("theme-search") as HTMLInputElement;
	input.value = query;
	input.dispatchEvent(new Event("input"));
}

function settle(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("the demo page", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
		// The page keeps its state in the URL, so it is cleared between the
		// tests the way a fresh page load would.
		window.history.replaceState(null, "", "/");
	});

	it("lists every theme in the catalog", async () => {
		await mountApp();
		expect(rows()).toHaveLength(THEMES.length);
		expect(document.getElementById("catalog-count")?.textContent).toBe(
			`${THEMES.length} / ${THEMES.length} themes`,
		);
	});

	it("filters the catalog and previews the match on the dashboard", async () => {
		await mountApp();
		search("drac");
		await settle();

		expect(rows().map((row) => row.dataset.theme)).toEqual(["dracula"]);
		// The same query shows the theme on the dashboard, not only in the
		// gallery.
		expect(document.getElementById("theme-name")?.textContent).toBe("dracula");
		expect(
			document.querySelector(".widget-card img")?.getAttribute("alt"),
		).toContain("Dracula");
	});

	it("offers the theme with its card and its variants", async () => {
		await mountApp();
		const input = document.getElementById("theme-search") as HTMLInputElement;
		input.dispatchEvent(new FocusEvent("focus"));

		const suggestions = Array.from(
			document.querySelectorAll<HTMLElement>("#theme-suggestions .suggestion"),
		);
		expect(suggestions).toHaveLength(THEMES.length);
		const ocean = suggestions.find(
			(suggestion) => suggestion.dataset.theme === "ocean_dark",
		);
		expect(ocean?.querySelector("img")?.getAttribute("src")).toBe(
			"./assets/ocean_dark-stats.svg",
		);
		expect(ocean?.querySelector(".suggestion-name")?.textContent).toBe(
			"ocean_dark",
		);
		expect(ocean?.querySelector(".suggestion-tags")?.textContent).toBe("Dark");
	});

	it("filters by facet", async () => {
		await mountApp();
		const chip = document.querySelector<HTMLElement>(
			'.facet-chip[data-facet="shadow"]',
		);
		chip?.click();
		await settle();

		expect(rows().map((row) => row.dataset.theme)).toEqual(["shadow_red"]);
	});

	it("steps through the themes", async () => {
		await mountApp();
		(document.getElementById("theme-next") as HTMLElement).click();
		await settle();
		expect(document.getElementById("theme-name")?.textContent).toBe("dracula");
		(document.getElementById("theme-prev") as HTMLElement).click();
		await settle();
		expect(document.getElementById("theme-name")?.textContent).toBe("default");
	});

	it("keeps the query in the URL", async () => {
		await mountApp();
		search("drac");
		await settle();
		expect(window.location.search).toContain("q=drac");
	});
});
