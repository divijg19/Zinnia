// Theme Selector Component
// Handles theme selection with search and color swatches

export class ThemeSelector {
	constructor(selectElement, themes) {
		this.select = selectElement;
		this.themes = themes;
		this.onChangeCallback = null;
		this.filteredThemes = [...themes];

		this.init();
	}

	init() {
		this.populate();
		this.select.addEventListener("change", (e) => {
			if (this.onChangeCallback) {
				this.onChangeCallback(e.target.value);
			}
		});

		// Add search/filter capability
		this.addSearchFilter();
	}

	addSearchFilter() {
		const wrapper = this.select.parentElement;
		if (!wrapper || wrapper.classList.contains("theme-selector-wrapper")) {
			return;
		}

		const searchWrapper = document.createElement("div");
		searchWrapper.className = "theme-selector-wrapper";

		const searchInput = document.createElement("input");
		searchInput.type = "search";
		searchInput.placeholder = "Search themes...";
		searchInput.setAttribute("aria-label", "Search themes");
		searchInput.className = "theme-search-input";

		const searchIcon = document.createElement("span");
		searchIcon.className = "theme-search-icon";
		searchIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;

		wrapper.insertBefore(searchWrapper, this.select);
		searchWrapper.appendChild(searchIcon);
		searchWrapper.appendChild(searchInput);

		let debounceTimer = null;
		searchInput.addEventListener("input", (e) => {
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => {
				this.filterThemes(e.target.value);
			}, 100);
		});

		// Keyboard navigation for dropdown
		this.select.addEventListener("keydown", (e) => {
			if (e.key === "Escape") {
				this.select.blur();
			}
		});
	}

	populate() {
		const _currentValue = this.select.value;
		this.select.innerHTML = "";

		// Group themes by category for optgroups
		const groups = this.groupThemes(this.themes);

		for (const [groupName, themes] of Object.entries(groups)) {
			const optgroup = document.createElement("optgroup");
			optgroup.label = groupName;

			for (const theme of themes) {
				const option = document.createElement("option");
				option.value = theme.name;
				option.textContent = theme.displayName || theme.name;
				optgroup.appendChild(option);
			}

			this.select.appendChild(optgroup);
		}

		// Restore value if exists
		if (this.themes.some((t) => t.name === this.select.value)) {
			this.select.value = this.select.value;
		} else {
			this.select.value = "default";
		}
	}

	static luminance(hex) {
		const h = String(hex || "").replace(/^#/, "");
		const full =
			h.length === 3
				? h
						.split("")
						.map((c) => c + c)
						.join("")
				: h;
		if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
		const [r, g, b] = [0, 2, 4].map((i) => {
			const c = parseInt(full.slice(i, i + 2), 16) / 255;
			return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
		});
		return 0.2126 * r + 0.7152 * g + 0.0722 * b;
	}

	groupThemes(themes) {
		// Data-driven groups derived from registry content: new themes land
		// in a sensible group automatically instead of an "Other" bucket.
		const groups = {
			Core: [],
			Catppuccin: [],
			Light: [],
			Dark: [],
			"Gradients & Effects": [],
		};
		const core = new Set([
			"default",
			"dark",
			"light",
			"transparent",
			"highcontrast",
		]);

		for (const theme of themes) {
			const name = theme.name.toLowerCase();
			if (core.has(name)) {
				groups.Core.push(theme);
				continue;
			}
			if (name.startsWith("catppuccin") || name.startsWith("catppuccin_")) {
				groups.Catppuccin.push(theme);
				continue;
			}
			const colors = theme.colors || {};
			const bg = colors.background?.hex ?? "";
			const css = colors.css ?? "";
			if (
				bg.includes(",") ||
				bg.includes("url(") ||
				css.includes("animation")
			) {
				groups["Gradients & Effects"].push(theme);
				continue;
			}
			const lum = ThemeSelector.luminance(bg);
			if (lum !== null && lum >= 0.5) {
				groups.Light.push(theme);
			} else {
				groups.Dark.push(theme);
			}
		}

		// Remove empty groups
		return Object.fromEntries(
			Object.entries(groups).filter(([, v]) => v.length > 0),
		);
	}

	firstVisibleTheme() {
		const first = this.select.querySelector("option:not([hidden])");
		return first?.value ?? null;
	}

	selectFirstMatch() {
		const name = this.firstVisibleTheme();
		if (!name) return null;
		this.select.value = name;
		if (this.onChangeCallback) {
			this.onChangeCallback(name);
		}
		return name;
	}

	filterThemes(query) {
		const lowerQuery = query.toLowerCase().trim();

		// Get all options
		const options = this.select.querySelectorAll("option");

		for (const option of options) {
			const themeName = option.value.toLowerCase();
			const displayName = option.textContent.toLowerCase();
			const matches =
				!query ||
				themeName.includes(lowerQuery) ||
				displayName.includes(lowerQuery);
			option.hidden = !matches;
		}

		// Show/hide optgroups based on visible options
		const optgroups = this.select.querySelectorAll("optgroup");
		for (const optgroup of optgroups) {
			const visibleOptions = optgroup.querySelectorAll("option:not([hidden])");
			optgroup.hidden = visibleOptions.length === 0;
		}
	}

	onChange(callback) {
		this.onChangeCallback = callback;
	}

	setTheme(themeName) {
		if (this.themes.some((t) => t.name === themeName)) {
			this.select.value = themeName;
		}
	}
}
