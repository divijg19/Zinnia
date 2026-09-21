// Catalog Component
// Tab 2: Scrollable list showing all themes with all 4 widgets

export class Catalog {
	constructor(container, widgetFactory, themeRegistry) {
		this.container = container;
		this.widgetFactory = widgetFactory;
		this.themeRegistry = themeRegistry || [];
		this.currentTheme = "default";
		this.filteredThemes = [...this.themeRegistry];
		this.onThemeChangeCallback = null;

		this.initKeyboardNav();
	}

	initKeyboardNav() {
		// Keyboard navigation
		if (this.container) {
			this.container.addEventListener("keydown", (e) => {
				if (e.key === "ArrowUp" || e.key === "ArrowDown") {
					e.preventDefault();
					this.navigateThemes(e.key === "ArrowUp" ? -1 : 1);
				}
			});
		}
	}

	setThemeRegistry(themeRegistry) {
		this.themeRegistry = themeRegistry || [];
		this.filteredThemes = [...this.themeRegistry];
		this.render();
	}

	updateTheme(themeName) {
		this.currentTheme = themeName;
		this.render();
	}

	filter(query) {
		if (!query) {
			this.filteredThemes = [...this.themeRegistry];
		} else {
			const lowerQuery = query.toLowerCase().trim();
			this.filteredThemes = this.themeRegistry.filter(
				(theme) =>
					theme.name.toLowerCase().includes(lowerQuery) ||
					theme.displayName?.toLowerCase().includes(lowerQuery),
			);
		}
		this.render();

		// Update count
		const countEl = document.getElementById("catalog-count");
		if (countEl) {
			countEl.textContent = `${this.filteredThemes.length} / ${this.themeRegistry.length} themes`;
		}
	}

	navigateThemes(direction) {
		const rows = this.container.querySelectorAll(".catalog-row:not([hidden])");
		if (rows.length === 0) return;

		const currentIndex = Array.from(rows).findIndex(
			(row) => row.dataset.theme === this.currentTheme,
		);

		let nextIndex = currentIndex + (direction === -1 ? -1 : 1);
		if (nextIndex < 0) nextIndex = rows.length - 1;
		if (nextIndex >= rows.length) nextIndex = 0;

		const nextRow = rows[nextIndex];
		if (nextRow) {
			const themeName = nextRow.dataset.theme;
			if (themeName) {
				this.currentTheme = themeName;
				nextRow.scrollIntoView({ behavior: "smooth", block: "center" });

				if (this.onThemeChangeCallback) {
					this.onThemeChangeCallback(themeName);
				}
			}
		}
	}

	render() {
		if (!this.container || !this.themeRegistry) return;

		if (this.filteredThemes.length === 0) {
			this.container.innerHTML = `<li class="catalog-empty">No themes match the current filter.</li>`;
			const countEl = document.getElementById("catalog-count");
			if (countEl) {
				countEl.textContent = `0 / ${this.themeRegistry.length} themes`;
			}
			return;
		}

		const html = this.filteredThemes
			.map((theme) => {
				const widgets = this.widgetFactory.createAll(
					theme.name,
					this.themeRegistry,
				);
				return `
        <li class="catalog-row theme-row" data-theme="${theme.name}" role="listitem" aria-current="${theme.name === this.currentTheme ? "true" : "false"}">
          <div class="theme-name-cell">
            <div class="theme-swatch">
              ${theme.previewColors
								.map(
									(color) =>
										`<span class="swatch" style="background: ${color};"></span>`,
								)
								.join("")}
              </div>
              <span>${theme.displayName || theme.name}</span>
            </div>
            <div class="widget-cell">${this.renderWidget(widgets[0])}</div>
            <div class="widget-cell">${this.renderWidget(widgets[1])}</div>
            <div class="widget-cell">${this.renderWidget(widgets[2])}</div>
            <div class="widget-cell">${this.renderWidget(widgets[3])}</div>
        </li>
      `;
			})
			.join("");

		this.container.innerHTML = html;

		const countEl = document.getElementById("catalog-count");
		if (countEl) {
			countEl.textContent = `${this.filteredThemes.length} / ${this.themeRegistry.length} themes`;
		}
	}

	renderWidget(widget) {
		if (!widget) return "";
		return widget.render();
	}

	onThemeChange(callback) {
		this.onThemeChangeCallback = callback;
	}
}
