import { Catalog } from "./Catalog.js";
import { Dashboard } from "./Dashboard.js";
import { initPageTheme } from "./utils/page-theme.js";
import { ThemeSelector } from "./utils/theme-selector.js";
import { WidgetFactory } from "./widgets/factory.js";

class ThemeDemoApp {
	constructor() {
		this.themeRegistry = null;
		this.assets = null;
		this.themeSelector = null;
		this.widgetFactory = null;
		this.dashboard = null;
		this.catalog = null;
		this.currentTheme = "default";
		this.currentTab = "dashboard";
	}

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
			document.body.innerHTML = `
        <div style="padding: 40px; text-align: center; font-family: system-ui;">
          <h1>Failed to load demo</h1>
          <p>${error.message}</p>
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
		const registryData = await registryRes.json();
		this.assets = registryData;
		console.log(`Loaded ${this.assets.themes.length} themes`);
	}

	initComponents() {
		initPageTheme(document.getElementById("page-theme-toggle"));

		this.themeSelector = new ThemeSelector(
			document.getElementById("theme-select"),
			this.assets.themes,
		);
		this.themeSelector.onChange((themeName) => {
			this.currentTheme = themeName;
			this.updateURL();
			this.renderTheme(themeName);
		});

		this.widgetFactory = new WidgetFactory(this.assets);

		this.dashboard = new Dashboard(
			document.getElementById("widget-grid"),
			this.widgetFactory,
			this.assets.themes,
		);

		this.catalog = new Catalog(
			document.getElementById("catalog-list"),
			this.widgetFactory,
			this.assets.themes,
		);
		this.catalog.onThemeChange((themeName) => {
			this.themeSelector.setTheme(themeName);
		});

		const searchInput = document.querySelector(".theme-search-input");
		if (searchInput) {
			let debounceTimer = null;
			searchInput.addEventListener("input", () => {
				clearTimeout(debounceTimer);
				debounceTimer = setTimeout(() => {
					this.applyActiveFilter();
				}, 100);
			});
			searchInput.addEventListener("keydown", (e) => {
				if (e.key !== "Enter") return;
				this.applyActiveFilter();
				if (this.currentTab === "catalog") {
					this.catalog.selectFirstMatch();
				} else {
					this.themeSelector.selectFirstMatch();
				}
			});
		}

		const modifierSelect = document.querySelector(".modifier-filter");
		if (modifierSelect) {
			modifierSelect.addEventListener("change", () => {
				this.applyActiveFilter();
			});
		}
	}

	activeFilterValues() {
		const query = document.querySelector(".theme-search-input")?.value || "";
		const modifier = document.querySelector(".modifier-filter")?.value || "";
		return { query, modifier };
	}

	applyActiveFilter() {
		const { query, modifier } = this.activeFilterValues();
		if (this.currentTab === "catalog") {
			this.catalog.filter(query, modifier);
		} else {
			this.themeSelector.filterThemes(query, modifier);
		}
	}

	syncFromURL() {
		const params = new URLSearchParams(window.location.search);
		this.currentTheme = params.get("theme") || "default";
		this.currentTab = params.get("tab") || "dashboard";

		if (!this.assets.themes.some((t) => t.name === this.currentTheme)) {
			this.currentTheme = "default";
		}

		if (!["dashboard", "catalog"].includes(this.currentTab)) {
			this.currentTab = "dashboard";
		}
	}

	setupURLSync() {
		window.addEventListener("popstate", () => {
			this.syncFromURL();
			this.themeSelector.setTheme(this.currentTheme);
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
		const tabButtons = document.querySelectorAll("[data-tab]");

		tabButtons.forEach((btn) => {
			btn.addEventListener("click", () => {
				const tab = btn.dataset.tab;
				if (tab && tab !== this.currentTab) {
					this.currentTab = tab;
					this.updateURL();
					this.switchTab(tab);
				}
			});

			btn.addEventListener("keydown", (e) => {
				if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
					e.preventDefault();
					const tabs = Array.from(document.querySelectorAll("[data-tab]"));
					const idx = tabs.indexOf(btn);
					const nextIdx =
						e.key === "ArrowRight"
							? (idx + 1) % tabs.length
							: (idx - 1 + tabs.length) % tabs.length;
					tabs[nextIdx].focus();
					tabs[nextIdx].click();
				}
			});
		});
	}

	switchTab(tabName) {
		document.querySelectorAll("[data-tab]").forEach((btn) => {
			const isActive = btn.dataset.tab === tabName;
			btn.setAttribute("aria-selected", isActive);
			btn.classList.toggle("active", isActive);
		});

		document.querySelectorAll(".tab-panel").forEach((panel) => {
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
				this.catalog.filter(query, modifier);
			} else {
				this.themeSelector.filterThemes(query, modifier);
			}
		} else if (tabName === "catalog" && this.catalog) {
			this.catalog.filter("", "");
		}
	}

	renderTheme(themeName) {
		this.themeSelector.setTheme(themeName);
		this.dashboard.updateTheme(themeName);
		this.catalog.updateTheme(themeName);
	}
}

const app = new ThemeDemoApp();
document.addEventListener("DOMContentLoaded", () => app.init());
