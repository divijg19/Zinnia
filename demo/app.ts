import { Catalog } from "./Catalog.js";
import { Dashboard } from "./Dashboard.js";
import type { DemoRegistry, DemoTheme } from "./types.js";
import { initPageTheme } from "./utils/page-theme.js";
import { ThemeSelector } from "./utils/theme-selector.js";
import { WidgetFactory } from "./widgets/factory.js";

/** The tabs the demo page has. */
type TabName = "dashboard" | "catalog";

/**
 * An element the page must have, or the demo cannot work.
 *
 * Failing here says which element is missing, instead of the app dying
 * further down with a null dereference.
 */
function required<T extends Element>(id: string): T {
	const element = document.getElementById(id);
	if (!element) {
		throw new Error(`demo: #${id} is missing from the page`);
	}
	return element as unknown as T;
}

export class ThemeDemoApp {
	themeRegistry: DemoRegistry | null = null;
	assets: DemoRegistry | null = null;
	themeSelector: ThemeSelector | null = null;
	widgetFactory: WidgetFactory | null = null;
	dashboard: Dashboard | null = null;
	catalog: Catalog | null = null;
	currentTheme = "default";
	currentTab: TabName = "dashboard";

	async init() {
		try {
			await this.loadAssets();

			this.initComponents();

			this.syncFromURL();
			this.setupURLSync();

			this.setupTabNavigation();

			this.renderTheme(this.currentTheme);
			this.switchTab(this.currentTab);

			console.log("Zinnia Theme Demo initialized");
		} catch (error) {
			console.error("Failed to initialize demo:", error);
			const message = error instanceof Error ? error.message : String(error);
			document.body.innerHTML = `
        <div style="padding: 40px; text-align: center; font-family: system-ui;">
          <h1>Failed to load demo</h1>
          <p>${message}</p>
        </div>
      `;
		}
	}

	async loadAssets() {
		const registryRes = await fetch("./theme-registry.json");
		if (!registryRes.ok) {
			throw new Error(
				`Failed to load theme-registry.json: ${registryRes.status}`,
			);
		}
		const registryData = (await registryRes.json()) as DemoRegistry;
		this.assets = registryData;
		console.log(`Loaded ${this.assets.themes.length} themes`);
	}

	initComponents() {
		const assets = this.assets;
		if (!assets) {
			throw new Error("demo: the theme registry was not loaded");
		}

		initPageTheme(required<HTMLElement>("page-theme-toggle"));

		this.themeSelector = new ThemeSelector(
			required<HTMLSelectElement>("theme-select"),
			assets.themes,
		);
		this.themeSelector.onChange((themeName) => {
			this.currentTheme = themeName;
			this.updateURL();
			this.renderTheme(themeName);
		});

		this.widgetFactory = new WidgetFactory(assets.themes);

		this.dashboard = new Dashboard(
			required<HTMLElement>("widget-grid"),
			this.widgetFactory,
			assets.themes,
		);

		this.catalog = new Catalog(
			required<HTMLElement>("catalog-list"),
			this.widgetFactory,
			assets.themes,
		);
		this.catalog.onThemeChange((themeName) => {
			this.themeSelector?.setTheme(themeName);
		});

		const searchInput = document.querySelector<HTMLInputElement>(
			".theme-search-input",
		);
		if (searchInput) {
			let debounceTimer: ReturnType<typeof setTimeout> | null = null;
			searchInput.addEventListener("input", () => {
				if (debounceTimer) clearTimeout(debounceTimer);
				debounceTimer = setTimeout(() => {
					this.applyActiveFilter();
				}, 100);
			});
			searchInput.addEventListener("keydown", (e) => {
				if (e.key !== "Enter") return;
				this.applyActiveFilter();
				if (this.currentTab === "catalog") {
					this.catalog?.selectFirstMatch();
				} else {
					this.themeSelector?.selectFirstMatch();
				}
			});
		}

		const modifierSelect =
			document.querySelector<HTMLSelectElement>(".modifier-filter");
		if (modifierSelect) {
			modifierSelect.addEventListener("change", () => {
				this.applyActiveFilter();
			});
		}
	}

	activeFilterValues(): { query: string; modifier: string } {
		const query =
			document.querySelector<HTMLInputElement>(".theme-search-input")?.value ||
			"";
		const modifier =
			document.querySelector<HTMLSelectElement>(".modifier-filter")?.value ||
			"";
		return { query, modifier };
	}

	applyActiveFilter() {
		const { query, modifier } = this.activeFilterValues();
		if (this.currentTab === "catalog") {
			this.catalog?.filter(query, modifier);
		} else {
			this.themeSelector?.filterThemes(query, modifier);
		}
	}

	syncFromURL() {
		const params = new URLSearchParams(window.location.search);
		this.currentTheme = params.get("theme") || "default";
		const tab = params.get("tab") || "dashboard";
		this.currentTab = tab === "catalog" ? "catalog" : "dashboard";

		const themes: DemoTheme[] = this.assets?.themes ?? [];
		if (!themes.some((t) => t.name === this.currentTheme)) {
			this.currentTheme = "default";
		}
	}

	setupURLSync() {
		window.addEventListener("popstate", () => {
			this.syncFromURL();
			this.themeSelector?.setTheme(this.currentTheme);
			this.switchTab(this.currentTab);
			this.renderTheme(this.currentTheme);
		});
	}

	updateURL() {
		const params = new URLSearchParams();
		if (this.currentTheme !== "default") params.set("theme", this.currentTheme);
		if (this.currentTab !== "dashboard") params.set("tab", this.currentTab);
		const url = params.toString()
			? `?${params.toString()}`
			: window.location.pathname;
		history.replaceState(null, "", url);
	}

	setupTabNavigation() {
		const tabButtons = document.querySelectorAll<HTMLElement>("[data-tab]");

		tabButtons.forEach((btn) => {
			btn.addEventListener("click", () => {
				const tab = btn.dataset.tab;
				if (tab && tab !== this.currentTab) {
					this.currentTab = tab === "catalog" ? "catalog" : "dashboard";
					this.updateURL();
					this.switchTab(this.currentTab);
				}
			});

			btn.addEventListener("keydown", (e) => {
				if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
					e.preventDefault();
					const tabs = Array.from(
						document.querySelectorAll<HTMLElement>("[data-tab]"),
					);
					const idx = tabs.indexOf(btn);
					const nextIdx =
						e.key === "ArrowRight"
							? (idx + 1) % tabs.length
							: (idx - 1 + tabs.length) % tabs.length;
					tabs[nextIdx]?.focus();
					tabs[nextIdx]?.click();
				}
			});
		});
	}

	switchTab(tabName: TabName) {
		document.querySelectorAll<HTMLElement>("[data-tab]").forEach((btn) => {
			const isActive = btn.dataset.tab === tabName;
			btn.setAttribute("aria-selected", String(isActive));
			btn.classList.toggle("active", isActive);
		});

		document.querySelectorAll<HTMLElement>(".tab-panel").forEach((panel) => {
			const isActive = panel.id === `panel-${tabName}`;
			panel.hidden = !isActive;
			panel.classList.toggle("active", isActive);
			if (isActive) {
				panel.setAttribute("aria-hidden", "false");
			} else {
				panel.setAttribute("aria-hidden", "true");
			}
		});

		const { query, modifier } = this.activeFilterValues();
		if (query || modifier) {
			if (tabName === "catalog") {
				this.catalog?.filter(query, modifier);
			} else {
				this.themeSelector?.filterThemes(query, modifier);
			}
		} else if (tabName === "catalog" && this.catalog) {
			this.catalog.filter("", "");
		}
	}

	renderTheme(themeName: string) {
		this.themeSelector?.setTheme(themeName);
		this.dashboard?.updateTheme(themeName);
		this.catalog?.updateTheme(themeName);
	}
}

const app = new ThemeDemoApp();
document.addEventListener("DOMContentLoaded", () => app.init());
