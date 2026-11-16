import type { DemoTheme } from "./types.js";
import type { GeneratedAssetWidget } from "./widgets/asset-widget.js";
import { WIDGET_LABELS, type WidgetSource } from "./widgets/factory.js";

export class Dashboard {
	container: HTMLElement | null;
	widgetFactory: WidgetSource;
	themeRegistry: DemoTheme[];
	widgets: GeneratedAssetWidget[] = [];
	currentTheme = "default";
	/** Whether the cards are on screen already. */
	rendered = false;

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
		// Selecting the theme that is on screen must not rebuild the cards:
		// every card is an <img>, and replacing them makes the grid flash.
		if (this.rendered && themeName === this.currentTheme) return;
		this.currentTheme = themeName;
		await this.render();
		this.rendered = true;
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
