import { GeneratedAssetWidget } from "./asset-widget.js";

const KINDS = ["stats", "topLangs", "streak", "trophy", "leetcode"];

export class WidgetFactory {
	createAll(themeName, themeRegistry) {
		const theme = themeRegistry.find((t) => t.name === themeName);
		if (!theme) return [];

		return KINDS.map((kind) => new GeneratedAssetWidget(kind, theme));
	}
}
