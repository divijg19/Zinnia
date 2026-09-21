const WIDGET_LABELS = {
	stats: "GitHub Stats",
	streak: "GitHub Streak",
	trophy: "Trophy Case",
	leetcode: "LeetCode",
};

export class Dashboard {
	constructor(container, widgetFactory, themeRegistry) {
		this.container = container;
		this.widgetFactory = widgetFactory;
		this.themeRegistry = themeRegistry;
		this.widgets = [];
		this.currentTheme = "default";
	}

	async updateTheme(themeName) {
		this.currentTheme = themeName;
		await this.render();
	}

	setThemeRegistry(themeRegistry) {
		this.themeRegistry = themeRegistry;
	}

	async render() {
		if (!this.container || !this.widgetFactory || !this.themeRegistry) return;

		const widgets = await this.widgetFactory.createAll(
			this.currentTheme,
			this.themeRegistry,
		);

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
