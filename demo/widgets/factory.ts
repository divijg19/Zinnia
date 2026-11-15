import type { DemoTheme } from "../types.js";
import { GeneratedAssetWidget } from "./asset-widget.js";

/** The cards the demo shows, in the order they appear. */
const KINDS = ["stats", "topLangs", "streak", "trophy", "leetcode"];

/** What the catalog and the dashboard need from a widget source. */
export interface WidgetSource {
	createAll(themeName: string): GeneratedAssetWidget[];
}

/** Builds the widgets of one theme, from the prerendered assets. */
export class WidgetFactory implements WidgetSource {
	private readonly themeRegistry: DemoTheme[];

	constructor(themeRegistry: DemoTheme[]) {
		this.themeRegistry = themeRegistry;
	}

	createAll(themeName: string): GeneratedAssetWidget[] {
		const theme = this.themeRegistry.find((t) => t.name === themeName);
		if (!theme) return [];

		return KINDS.map((kind) => new GeneratedAssetWidget(kind, theme));
	}
}
