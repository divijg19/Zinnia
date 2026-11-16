import { Catalog } from "./Catalog.js";
import { Dashboard } from "./Dashboard.js";
import type { DemoRegistry, DemoTheme } from "./types.js";
import { initPageTheme } from "./utils/page-theme.js";
import {
	createThemeCombobox,
	type ThemeCombobox,
} from "./utils/theme-combobox.js";
import {
	buildModifierOptions,
	filterByModifier,
	getModifierTags,
	MODIFIER_ALL,
} from "./utils/theme-groups.js";
import {
	buildSearchIndex,
	type SearchIndex,
	searchThemes,
	type ThemeMatch,
} from "./utils/theme-search.js";
import { WidgetFactory } from "./widgets/factory.js";

/**
 * The demo application.
 *
 * One theme, one query, one variant filter, shared by both tabs: the
 * dashboard shows the selected theme, the gallery lists the matching ones,
 * and the search drives both.
 */
export class ThemeDemoApp {
	registry: DemoRegistry | null = null;
	searchIndex: SearchIndex = [];
	combobox: ThemeCombobox | null = null;
	widgetFactory: WidgetFactory | null = null;
	dashboard: Dashboard | null = null;
	catalog: Catalog | null = null;
	currentTheme = "default";
	currentTab: "dashboard" | "catalog" = "dashboard";
	/** How far each tab was scrolled, so switching back returns you there. */
	scrollPositions: Partial<Record<"dashboard" | "catalog", number>> = {};
	query = "";
	modifier = MODIFIER_ALL;

	async init() {
		try {
			await this.loadAssets();

			this.initComponents();

			this.syncFromURL();
			this.setupURLSync();

			this.setupTabNavigation();

			this.renderTheme(this.currentTheme);
			this.switchTab(this.currentTab);

			// The first paint has had its fade now; from here the tabs swap
			// instantly, so the page does not blank and slide on every switch.
			document.body.classList.add("demo-ready");

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
		this.registry = (await registryRes.json()) as DemoRegistry;
		this.searchIndex = buildSearchIndex(this.registry.themes);
		console.log(`Loaded ${this.registry.themes.length} themes`);
	}

	initComponents() {
		const registry = this.registry;
		if (!registry) {
			throw new Error("demo: the theme registry was not loaded");
		}

		initPageTheme(document.getElementById("page-theme-toggle"));

		this.widgetFactory = new WidgetFactory(registry.themes);

		this.dashboard = new Dashboard(
			document.getElementById("widget-grid"),
			this.widgetFactory,
			registry.themes,
		);

		this.catalog = new Catalog(
			document.getElementById("catalog-list"),
			this.widgetFactory,
			registry.themes,
		);
		this.catalog.onThemeChange((themeName) => {
			this.selectTheme(themeName);
		});

		this.initSearch();
		this.initModifierChips();
		this.initThemeStepper();
	}

	/** The search box and its suggestions. */
	initSearch() {
		const input = document.getElementById("theme-search");
		const list = document.getElementById("theme-suggestions");
		if (!(input instanceof HTMLInputElement)) return;
		if (!list) return;

		this.combobox = createThemeCombobox({
			input,
			list,
			index: this.searchIndex,
			accept: (theme) => this.acceptsModifier(theme),
			onSelect: (theme) => {
				// The box now holds the chosen theme, so the query follows
				// it: the gallery shows the theme the search picked.
				this.query = theme.name;
				this.combobox?.refresh();
				this.selectTheme(theme.name);
			},
			onQuery: (query, matches) => {
				const changed = query !== this.query;
				this.query = query;
				this.applyFilters();
				// While a query is being typed the best match is previewed,
				// so the search behaves the same on both tabs.
				if (changed && query.trim()) this.previewBestMatch(matches);
				this.updateURL();
			},
		});

		// The keyboard shortcut: type `/` anywhere to search.
		document.addEventListener("keydown", (event) => {
			if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
				return;
			}
			const target = event.target as HTMLElement | null;
			if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
			event.preventDefault();
			input.focus();
			input.select();
		});
	}

	/** The variant chips, derived from the registry. */
	initModifierChips() {
		const container = document.getElementById("modifier-chips");
		if (!container) return;
		container.addEventListener("click", (event) => {
			const target = (event.target as Element | null)?.closest(
				".modifier-chip",
			);
			const value = target?.getAttribute("data-modifier");
			if (value === null || value === undefined) return;
			this.modifier = value;
			this.renderModifierChips();
			this.combobox?.refresh();
			this.applyFilters();
			// The variant filter changes which themes match, so the preview
			// follows the new best match.
			if (this.query.trim()) {
				this.previewBestMatch(this.combobox?.matches() ?? []);
			}
			this.updateURL();
		});
	}

	/** Draw the variant chips, with the active one marked. */
	renderModifierChips() {
		const container = document.getElementById("modifier-chips");
		if (!container) return;
		const themes = this.registry?.themes ?? [];
		container.innerHTML = buildModifierOptions(themes)
			.map(
				(option) =>
					`<button type="button" class="modifier-chip" role="radio" aria-checked="${option.value === this.modifier}" data-modifier="${option.value}">${option.label}</button>`,
			)
			.join("");
	}

	/** Previous and next theme, through the visible list. */
	initThemeStepper() {
		const previous = document.getElementById("theme-prev");
		const next = document.getElementById("theme-next");
		previous?.addEventListener("click", () => this.stepTheme(-1));
		next?.addEventListener("click", () => this.stepTheme(1));
	}

	/**
	 * The themes the current query and variant filter allow.
	 *
	 * The same matcher drives the suggestions and the gallery, so the two
	 * never disagree about what a query means.
	 */
	visibleThemes(): DemoTheme[] {
		const matches = searchThemes(this.searchIndex, this.query);
		return filterByModifier(
			matches.map((match) => match.theme),
			this.modifier,
		);
	}

	acceptsModifier(theme: DemoTheme): boolean {
		if (this.modifier === MODIFIER_ALL) return true;
		return getModifierTags(theme).has(this.modifier);
	}

	/** Show the best match of the current query. */
	previewBestMatch(matches: ThemeMatch[]): void {
		const best = matches[0];
		if (!best) return;
		this.selectTheme(best.theme.name);
	}

	/** Move through the visible themes. */
	stepTheme(direction: number): void {
		const visible = this.visibleThemes();
		if (!visible.length) return;
		const current = visible.findIndex(
			(theme) => theme.name === this.currentTheme,
		);
		const next =
			current === -1
				? 0
				: (current + direction + visible.length) % visible.length;
		const theme = visible[next];
		if (!theme) return;
		this.selectTheme(theme.name);
	}

	/** Select a theme everywhere: the dashboard, the gallery and the URL. */
	selectTheme(themeName: string): void {
		if (!themeName) return;
		this.currentTheme = themeName;
		this.renderTheme(themeName);
		this.updateURL();
		const name = document.getElementById("theme-name");
		if (name) name.textContent = themeName;
	}

	/** Apply the current query and variant filter to the gallery. */
	applyFilters() {
		const visible = this.visibleThemes();
		this.catalog?.setVisible(visible, this.query);
		const count = document.getElementById("catalog-count");
		if (count) {
			const total = this.registry?.themes.length ?? 0;
			count.textContent = `${visible.length} / ${total} themes`;
		}
	}

	syncFromURL() {
		const params = new URLSearchParams(window.location.search);
		this.currentTheme = params.get("theme") || "default";
		const tab = params.get("tab");
		this.currentTab = tab === "catalog" ? "catalog" : "dashboard";
		this.query = params.get("q") || "";
		this.modifier = params.get("variant") || MODIFIER_ALL;

		const themes = this.registry?.themes ?? [];
		if (!themes.some((theme) => theme.name === this.currentTheme)) {
			this.currentTheme = "default";
		}
		this.renderModifierChips();
		this.combobox?.setQuery(this.query);
		const name = document.getElementById("theme-name");
		if (name) name.textContent = this.currentTheme;
	}

	setupURLSync() {
		window.addEventListener("popstate", () => {
			const from = this.currentTab;
			this.scrollPositions[from] = window.scrollY;
			this.syncFromURL();
			this.renderTheme(this.currentTheme);
			this.switchTab(this.currentTab, from);
			this.applyFilters();
		});
	}

	updateURL() {
		const params = new URLSearchParams();
		if (this.currentTheme !== "default") params.set("theme", this.currentTheme);
		if (this.currentTab !== "dashboard") params.set("tab", this.currentTab);
		if (this.query.trim()) params.set("q", this.query.trim());
		if (this.modifier !== MODIFIER_ALL) params.set("variant", this.modifier);
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
					this.switchTab(tab === "catalog" ? "catalog" : "dashboard");
					this.updateURL();
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

	/**
	 * Show a tab.
	 *
	 * `from` is the tab being left, when the caller already knows it.
	 */
	switchTab(tabName: "dashboard" | "catalog", from?: "dashboard" | "catalog") {
		// The tabs scroll independently: the gallery is 96 rows long and the
		// dashboard is one screen, so each tab keeps its place.
		this.scrollPositions[from ?? this.currentTab] = window.scrollY;
		this.currentTab = tabName;
		document.querySelectorAll<HTMLElement>("[data-tab]").forEach((btn) => {
			const isActive = btn.dataset.tab === tabName;
			btn.setAttribute("aria-selected", String(isActive));
			btn.classList.toggle("active", isActive);
		});

		document.querySelectorAll<HTMLElement>(".tab-panel").forEach((panel) => {
			const isActive = panel.id === `panel-${tabName}`;
			panel.hidden = !isActive;
			panel.classList.toggle("active", isActive);
			panel.setAttribute("aria-hidden", String(!isActive));
		});

		this.applyFilters();

		const restore = this.scrollPositions[tabName] ?? 0;
		if (window.scrollY !== restore) window.scrollTo(0, restore);
	}

	renderTheme(themeName: string) {
		this.dashboard?.updateTheme(themeName);
		this.catalog?.updateTheme(themeName);
	}
}
