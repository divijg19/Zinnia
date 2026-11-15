import type { DemoTheme } from "./types.js";
import type { GeneratedAssetWidget } from "./widgets/asset-widget.js";
import type { WidgetSource } from "./widgets/factory.js";

const WIDGET_LABELS: Record<string, string> = {
	stats: "GitHub Stats",
	topLangs: "Top Languages",
	streak: "GitHub Streak",
	trophy: "Trophy Case",
	leetcode: "LeetCode",
};

export class Dashboard {
	container: HTMLElement | null;
	widgetFactory: WidgetSource;
	themeRegistry: DemoTheme[];
	widgets: GeneratedAssetWidget[] = [];
	currentTheme = "default";

	constructor(
		container: HTMLElement | null,
		widgetFactory: WidgetSource,
		themeRegistry: DemoTheme[],
	) {
		this.container = container;
		this.widgetFactory = widgetFactory;
		this.themeRegistry = themeRegistry;
	}

	async updateTheme(themeName: string) {
		this.currentTheme = themeName;
		await this.render();
	}

	async render() {
		if (!this.container || !this.widgetFactory || !this.themeRegistry) return;

		const widgets = await this.widgetFactory.createAll(this.currentTheme);

		this.container.innerHTML = widgets
			.map(
				(widget) => `
      <div class="widget-card" data-widget="${widget.kind}">
        <div class="widget-card-title">${WIDGET_LABELS[widget.kind] || widget.kind}</div>
        ${widget.render()}
      </div>
    `,
			)
			.join("");
	}
}
