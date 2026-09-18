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

	groupThemes(themes) {
		const groups = {
			Core: [],
			Catppuccin: [],
			Popular: [],
			"Trophy Exclusive": [],
			LeetCode: [],
			Other: [],
		};

		for (const theme of themes) {
			const name = theme.name.toLowerCase();
			if (
				["default", "dark", "light", "transparent", "highcontrast"].includes(
					name,
				)
			) {
				groups.Core.push(theme);
			} else if (
				name.startsWith("catppuccin") ||
				name.startsWith("catppuccin_")
			) {
				groups.Catppuccin.push(theme);
			} else if (
				[
					"watchdog",
					"radical",
					"tokyonight",
					"onedark",
					"dracula",
					"nord",
					"monokai",
					"gruvbox",
				].includes(name)
			) {
				groups.Popular.push(theme);
			} else if (
				[
					"flat",
					"discord",
					"chalk",
					"alduin",
					"darkhub",
					"juicyfresh",
					"oldie",
					"buddhism",
					"onestar",
					"gitdimmed",
					"matrix",
					"dark_dimmed",
					"dark_lover",
					"kimbie_dark",
					"catppuccin_latte",
					"catppuccin_mocha",
					"github_dark",
					"github_dark_dimmed",
					"discord_old_blurple",
					"aura_dark",
					"panda",
					"noctis_minimus",
					"cobalt2",
					"swift",
					"aura",
					"apprentice",
					"moltack",
					"codestackr",
					"rose_pine",
					"date_night",
					"one_dark_pro",
					"rose",
					"holi",
					"neon",
					"blue_navy",
					"calm_pink",
					"ambient_gradient",
				].includes(name)
			) {
				groups["Trophy Exclusive"].push(theme);
			} else if (
				["catppuccin-mocha", "chartreuse", "forest", "unicorn", "wtf"].includes(
					name,
				)
			) {
				groups.LeetCode.push(theme);
			} else {
				groups.Other.push(theme);
			}
		}

		// Remove empty groups
		return Object.fromEntries(
			Object.entries(groups).filter(([, v]) => v.length > 0),
		);
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
