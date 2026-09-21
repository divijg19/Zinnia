import { JSDOM } from "jsdom";

const dom = new JSDOM(
	`<!DOCTYPE html><html><body><div id="widget-grid"></div><div id="catalog-list"></div><select id="theme-select"></select></body></html>`,
	{ url: "http://localhost/" },
);
const { window } = dom;
globalThis.window = window;
globalThis.document = window.document;
globalThis.history = window.history;
globalThis.HTMLElement = window.HTMLElement;

const { WidgetFactory } = await import("../demo/widgets/factory.js");
const { Dashboard } = await import("../demo/Dashboard.js");

const registryFile = JSON.parse(
	await Bun.file(
		new URL("../demo/theme-registry.json", import.meta.url),
	).text(),
);
console.log("themes in registry:", registryFile.themes.length);
if (registryFile.themes.length === 0) {
	throw new Error("smoke: theme registry is empty");
}

const wf = new WidgetFactory(registryFile);
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
