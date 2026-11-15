import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";

const dom = new JSDOM(
	`<!DOCTYPE html><html><body><button id="page-theme-toggle"></button><div id="widget-grid"></div><div id="catalog-list"></div><select id="theme-select"></select></body></html>`,
	{ url: "http://localhost/" },
);
const { window } = dom;
globalThis.window = window;
globalThis.document = window.document;
globalThis.history = window.history;
globalThis.HTMLElement = window.HTMLElement;

const { WidgetFactory } = await import("../demo/widgets/factory.js");
const { Dashboard } = await import("../demo/Dashboard.js");

const registryJson = await readFile(
	new URL("../demo/theme-registry.json", import.meta.url),
	"utf8",
);
const registryFile = JSON.parse(registryJson);
console.log("themes in registry:", registryFile.themes.length);
if (registryFile.themes.length === 0) {
	throw new Error("smoke: theme registry is empty");
}

const wf = new WidgetFactory(registryFile.themes);
const dash = new Dashboard(
	window.document.getElementById("widget-grid"),
	wf,
	registryFile.themes,
);
await dash.updateTheme("default");
const cards = window.document.querySelectorAll(".widget-card");
console.log("dashboard cards:", cards.length);
const expectedKinds = ["stats", "topLangs", "streak", "trophy", "leetcode"];
if (cards.length !== expectedKinds.length) {
	throw new Error(
		`smoke: expected ${expectedKinds.length} dashboard cards, got ${cards.length}`,
	);
}
for (const kind of expectedKinds) {
	if (
		!window.document.querySelector(`.widget-card[data-widget="${kind}"] img`)
	) {
		throw new Error(`smoke: dashboard is missing rendered ${kind} widget`);
	}
}
const img = window.document.querySelector(".widget-card img");
console.log("sample widget html:", img?.outerHTML?.slice(0, 140));
if (!img?.getAttribute("src")) {
	throw new Error("smoke: dashboard widget image has no src");
}

// The bundle is what the page actually loads, so it gets driven too: the
// sources above can be fine while the bundle the browser runs is broken.
window.document.getElementById("widget-grid")?.replaceChildren();
globalThis.fetch = (async (input: unknown) => {
	const url = String(input);
	if (url.includes("theme-registry.json")) {
		return new Response(registryJson, {
			status: 200,
			headers: { "content-type": "application/json" },
		});
	}
	throw new Error(`smoke: unexpected fetch: ${url}`);
}) as typeof fetch;

await import("../demo/app.js");
window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
// The app initialises asynchronously: give it a turn to settle.
await new Promise((resolve) => setTimeout(resolve, 50));

const bundled = window.document.querySelectorAll(".widget-card");
console.log("bundled dashboard cards:", bundled.length);
if (bundled.length !== expectedKinds.length) {
	throw new Error(
		`smoke: the bundled app rendered ${bundled.length} cards, expected ${expectedKinds.length}`,
	);
}
if (window.document.body.textContent?.includes("Failed to load demo")) {
	throw new Error("smoke: the bundled app failed to initialise");
}
