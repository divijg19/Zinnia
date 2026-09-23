// Catalog Component
// Tab 2: Scrollable list showing all themes with all 4 widgets

import { getModifierTags } from "./utils/theme-modifiers.js";

export class Catalog {
	constructor(container, widgetFactory, themeRegistry) {
		this.container = container;
		this.widgetFactory = widgetFactory;
		this.themeRegistry = themeRegistry || [];
		this.currentTheme = "default";
		this.filteredThemes = [...this.themeRegistry];
		this.currentQuery = "";
		this.currentModifier = "";
		this.onThemeChangeCallback = null;

		this.initKeyboardNav();
		this.initRowSelection();
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

	initRowSelection() {
		// Mouse selection: clicking a row selects its theme everywhere.
		if (this.container) {
			this.container.addEventListener("click", (e) => {
				const copyBtn = e.target.closest("[data-copy-theme]");
				if (copyBtn) {
					e.stopPropagation();
					this.copyThemeJson(copyBtn.dataset.copyTheme, copyBtn);
					return;
				}
				const row = e.target.closest(".catalog-row");
				if (row?.dataset.theme) {
					this.selectTheme(row.dataset.theme);
				}
			});
		}
	}

	selectTheme(themeName) {
		if (!themeName || themeName === this.currentTheme) return;
		this.currentTheme = themeName;
		this.render();
		if (this.onThemeChangeCallback) {
			this.onThemeChangeCallback(themeName);
		}
	}

	themeJson(themeName) {
		const theme = this.themeRegistry.find((t) => t.name === themeName);
		if (!theme) return null;
		const { widgets: _widgets, ...definition } = theme;
		return JSON.stringify(definition, null, 2);
	}

	async copyThemeJson(themeName, button) {
		const json = this.themeJson(themeName);
		if (!json) return false;
		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(json);
			} else {
				const area = document.createElement("textarea");
				area.value = json;
				document.body.appendChild(area);
				area.select();
				document.execCommand("copy");
				area.remove();
			}
		} catch {
			return false;
		}
		if (button) {
			const original = button.textContent;
			button.textContent = "Copied!";
			setTimeout(() => {
				button.textContent = original;
			}, 1200);
		}
		return true;
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

	selectFirstMatch() {
		const first = this.filteredThemes[0];
		if (!first) return null;
		const row = this.container.querySelector(`[data-theme="${first.name}"]`);
		row?.scrollIntoView?.({ behavior: "smooth", block: "center" });
		this.selectTheme(first.name);
		return first.name;
	}

	highlightMatch(text, query) {
		const escaped = String(text)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
		const q = String(query || "").trim();
		if (!q) return escaped;
		const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		return escaped.replace(new RegExp(`(${safe})`, "gi"), "<mark>$1</mark>");
	}

	filter(query, modifier = this.currentModifier) {
		this.currentQuery = query || "";
		this.currentModifier = modifier || "";
		if (!this.currentQuery && !this.currentModifier) {
			this.filteredThemes = [...this.themeRegistry];
		} else {
			const lowerQuery = this.currentQuery.toLowerCase().trim();
			this.filteredThemes = this.themeRegistry.filter((theme) => {
				const matchesQuery =
					!lowerQuery ||
					theme.name.toLowerCase().includes(lowerQuery) ||
					theme.displayName?.toLowerCase().includes(lowerQuery);
				const matchesModifier =
					!this.currentModifier ||
					getModifierTags(theme).has(this.currentModifier);
				return matchesQuery && matchesModifier;
			});
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
		if (nextRow?.dataset.theme) {
			nextRow.scrollIntoView?.({ behavior: "smooth", block: "center" });
			this.selectTheme(nextRow.dataset.theme);
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
              <span>${this.highlightMatch(theme.displayName || theme.name, this.currentQuery)}</span>
              <button type="button" class="copy-json-btn" data-copy-theme="${theme.name}" title="Copy canonical theme JSON">JSON</button>
            </div>
            <div class="widget-cell">${this.renderWidget(widgets[0])}</div>
            <div class="widget-cell">${this.renderWidget(widgets[1])}</div>
            <div class="widget-cell">${this.renderWidget(widgets[2])}</div>
            <div class="widget-cell">${this.renderWidget(widgets[3])}</div>
            <div class="widget-cell">${this.renderWidget(widgets[4])}</div>
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
