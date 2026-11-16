// Catalog Component
// Tab 2: Scrollable list showing all themes with all 5 widgets

import type { DemoTheme } from "./types.js";
import { findMatches, highlightMatches } from "./utils/html.js";
import {
	facetLabel,
	facetsOf,
	SECTIONS,
	sectionThemes,
} from "./utils/theme-taxonomy.js";
import type { GeneratedAssetWidget } from "./widgets/asset-widget.js";
import type { WidgetSource } from "./widgets/factory.js";

/** Whether two theme lists are the same themes in the same order. */
function sameNames(a: DemoTheme[], b: DemoTheme[]): boolean {
	if (a.length !== b.length) return false;
	return a.every((theme, index) => theme.name === b[index]?.name);
}

export class Catalog {
	container: HTMLElement | null;
	widgetFactory: WidgetSource;
	themeRegistry: DemoTheme[];
	currentTheme = "default";
	filteredThemes: DemoTheme[];
	currentQuery = "";
	/** Whether the rows are on screen already. */
	rendered = false;
	onThemeChangeCallback: ((themeName: string) => void) | null = null;

	constructor(
		container: HTMLElement | null,
		widgetFactory: WidgetSource,
		themeRegistry: DemoTheme[],
	) {
		this.container = container;
		this.widgetFactory = widgetFactory;
		this.themeRegistry = themeRegistry || [];
		this.filteredThemes = [...this.themeRegistry];

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
				const target = e.target as Element | null;
				const copyBtn = target?.closest("[data-copy-theme]");
				if (copyBtn) {
					e.stopPropagation();
					this.copyThemeJson(
						(copyBtn as HTMLElement).dataset.copyTheme ?? "",
						copyBtn as HTMLElement,
					);
					return;
				}
				const row = target?.closest(".catalog-row") as HTMLElement | null;
				if (row?.dataset.theme) {
					this.selectTheme(row.dataset.theme);
				}
			});
		}
	}

	selectTheme(themeName: string) {
		if (!themeName || themeName === this.currentTheme) return;
		this.currentTheme = themeName;
		this.markCurrent();
		if (this.onThemeChangeCallback) {
			this.onThemeChangeCallback(themeName);
		}
	}

	themeJson(themeName: string): string | null {
		const theme = this.themeRegistry.find((t) => t.name === themeName);
		if (!theme) return null;
		const { widgets: _widgets, ...definition } = theme;
		return JSON.stringify(definition, null, 2);
	}

	async copyThemeJson(
		themeName: string,
		button: HTMLElement | null,
	): Promise<boolean> {
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

	/**
	 * Mark the selected row.
	 *
	 * The rows themselves do not depend on the selection, so the marker is
	 * updated in place: a full re-render would rebuild every card of every
	 * theme on each keystroke.
	 */
	markCurrent() {
		const rows = this.container?.querySelectorAll<HTMLElement>(".catalog-row");
		for (const row of rows ?? []) {
			row.setAttribute(
				"aria-current",
				String(row.dataset.theme === this.currentTheme),
			);
		}
	}

	updateTheme(themeName: string) {
		this.currentTheme = themeName;
		this.markCurrent();
	}

	/** The name with the current query highlighted. */
	highlightMatch(text: string, query: string): string {
		return highlightMatches(text, findMatches(text, query.trim()));
	}

	/**
	 * Show the themes the search picked.
	 *
	 * The filtering happens in the application, so the gallery and the
	 * suggestions always agree about what a query means. Nothing is rebuilt
	 * when the filter has not changed: switching tabs calls this every time.
	 */
	setVisible(themes: DemoTheme[], query = "") {
		const nextQuery = query || "";
		const unchanged =
			this.rendered &&
			nextQuery === this.currentQuery &&
			sameNames(this.filteredThemes, themes);
		if (unchanged) return;

		this.currentQuery = nextQuery;
		this.filteredThemes = [...themes];
		this.rendered = true;
		this.render();
	}

	navigateThemes(direction: number) {
		const rows = this.container?.querySelectorAll<HTMLElement>(
			".catalog-row:not([hidden])",
		);
		if (!rows || rows.length === 0) return;

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
			return;
		}

		const sections = sectionThemes(this.filteredThemes);
		const html = SECTIONS.flatMap((section) => {
			const themes = sections[section];
			if (!themes.length) return [];
			return [
				`<li class="catalog-section" role="presentation">
          <span class="catalog-section-name">${section}</span>
          <span class="catalog-section-count">${themes.length}</span>
        </li>`,
				...themes.map((theme) => this.renderRow(theme)),
			];
		}).join("");

		this.container.innerHTML = html;
	}

	/** One row of the gallery: the name, its qualities, and the five cards. */
	renderRow(theme: DemoTheme): string {
		const widgets = this.widgetFactory.createAll(theme.name);
		const facets = facetsOf(theme)
			.map((facet) => `<span class="catalog-facet">${facetLabel(facet)}</span>`)
			.join("");
		return `
        <li class="catalog-row theme-row" data-theme="${theme.name}" role="listitem" aria-current="${theme.name === this.currentTheme ? "true" : "false"}">
          <div class="catalog-left">
            <div class="theme-name-cell">
              <div class="theme-name-head">
                <div class="theme-swatch">
                  ${(theme.previewColors ?? [])
										.map(
											(color) =>
												`<span class="swatch" style="background: ${color};"></span>`,
										)
										.join("")}
                </div>
                <span class="theme-name-text">${this.highlightMatch(theme.displayName || theme.name, this.currentQuery)}</span>
                <button type="button" class="copy-json-btn" data-copy-theme="${theme.name}" title="Copy canonical theme JSON">JSON</button>
              </div>
              <span class="catalog-facets">${facets}</span>
            </div>
            <div class="widget-cell">${this.renderWidget(widgets[0])}</div>
          </div>
            <div class="widget-cell">${this.renderWidget(widgets[1])}</div>
            <div class="widget-cell">${this.renderWidget(widgets[2])}</div>
            <div class="widget-cell">${this.renderWidget(widgets[3])}</div>
            <div class="widget-cell">${this.renderWidget(widgets[4])}</div>
        </li>
      `;
	}

	renderWidget(widget: GeneratedAssetWidget | undefined): string {
		if (!widget) return "";
		return widget.render();
	}

	onThemeChange(callback: (themeName: string) => void) {
		this.onThemeChangeCallback = callback;
	}
}
