import type { DemoTheme } from "../types.js";
import { GeneratedAssetWidget } from "./asset-widget.js";

/** The cards the demo shows, in the order they appear, with their titles. */
export const WIDGETS: { kind: string; label: string }[] = [
	{ kind: "stats", label: "GitHub Stats" },
	{ kind: "topLangs", label: "Top Languages" },
	{ kind: "streak", label: "GitHub Streak" },
	{ kind: "trophy", label: "Trophy Case" },
	{ kind: "leetcode", label: "LeetCode" },
];

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

		return WIDGETS.map(
			(widget) => new GeneratedAssetWidget(widget.kind, theme),
		);
	}
}

/** The title of a card kind, for the dashboard. */
export const WIDGET_LABELS: Record<string, string> = Object.fromEntries(
	WIDGETS.map((widget) => [widget.kind, widget.label]),
);
