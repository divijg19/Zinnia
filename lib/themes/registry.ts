// Canonical theme registry + shared theme types.
// This is the single source of truth for all widget themes. Widget-specific
// adapters in `lib/themes/adapters/` derive the exact properties each widget
// needs from these definitions.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A single color value. `hex` holds the exact source token — for solid
 * colors this is a bare hex string (e.g. 2f80ed); for backgrounds it may
 * be a gradient token string (e.g. 45,520806,021D4A) that the renderer
 * parses. Values are stored without a leading '#' and without normalization;
 * adapters and renderers apply hex/gradient handling as they did historically.
 */
export interface ColorToken {
	hex: string;
}

/**
 * Structured gradient description (linear or radial). This is the first-class
 * gradient form for future widgets (streak/trophy); stats themes keep the raw
 * source string in `ColorToken.hex` for exact round-trip parity.
 */
export interface GradientToken {
	type: "linear" | "radial";
	angle?: number;
	stops: ColorToken[];
}

/**
 * Streak-specific override properties for themes with explicit streak designs.
 */
export interface StreakThemeProperties {
	background?: string;
	border?: string;
	stroke?: string;
	ring?: string;
	fire?: string;
	currStreakNum?: string;
	sideNums?: string;
	currStreakLabel?: string;
	sideLabels?: string;
	dates?: string;
	excludeDaysLabel?: string;
}

/**
 * Trophy-specific override properties for themes with explicit trophy designs.
 */
export interface TrophyThemeProperties {
	BACKGROUND?: string;
	TITLE?: string;
	ICON_CIRCLE?: string;
	TEXT?: string;
	LAUREL?: string;
	SECRET_RANK_1?: string;
	SECRET_RANK_2?: string;
	SECRET_RANK_3?: string;
	SECRET_RANK_TEXT?: string;
	NEXT_RANK_BAR?: string;
	S_RANK_BASE?: string;
	S_RANK_SHADOW?: string;
	S_RANK_TEXT?: string;
	A_RANK_BASE?: string;
	A_RANK_SHADOW?: string;
	A_RANK_TEXT?: string;
	B_RANK_BASE?: string;
	B_RANK_SHADOW?: string;
	B_RANK_TEXT?: string;
	DEFAULT_RANK_BASE?: string;
	DEFAULT_RANK_SHADOW?: string;
	DEFAULT_RANK_TEXT?: string;
}

/**
 * Semantic color tokens shared across widgets. Tokens are optional: adapters
 * resolve each widget property via a fallback chain (selected theme -> default
 * theme -> literal). Future widgets fill the remaining tokens (foreground,
 * primary, secondary, stroke, accent, fire, dates, palette, css, extends).
 */
export interface ThemeColors {
	title?: ColorToken;
	icon?: ColorToken;
	text?: ColorToken;
	background?: ColorToken | GradientToken;
	border?: ColorToken;
	ring?: ColorToken;
	// Forward-looking tokens reserved for streak/trophy/leetcode adapters.
	foreground?: ColorToken;
	primary?: ColorToken;
	secondary?: ColorToken;
	stroke?: ColorToken;
	accent?: ColorToken;
	fire?: ColorToken;
	dates?: ColorToken;
	palette?: { bg: string[]; text: string[]; color: string[] };
	css?: string;
	extends?: string;
}

/**
 * A single canonical theme definition backed by semantic color tokens.
 * The `name` is stable across widgets; the same theme key served to any
 * widget adapter yields that widget's rendering properties.
 */
export interface ThemeDefinition {
	name: string;
	displayName?: string;
	colors: ThemeColors;
	streak?: Partial<StreakThemeProperties>;
	trophy?: Partial<TrophyThemeProperties>;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/**
 * The canonical theme registry. Color values are duplicated from former
 * per-widget files so parity with historical renderers is provable by test.
 */
export const themes: Record<string, ThemeDefinition> = {
	default: {
		name: "default",
		colors: {
			title: { hex: "2f80ed" },
			icon: { hex: "4c71f2" },
			text: { hex: "434d58" },
			background: { hex: "fffefe" },
			border: { hex: "e4e2e2" },
		},
		streak: {
			background: "#FFFEFE",
			border: "#E4E2E2",
			stroke: "#E4E2E2",
			ring: "#FB8C00",
			fire: "#FB8C00",
			currStreakNum: "#151515",
			sideNums: "#151515",
			currStreakLabel: "#FB8C00",
			sideLabels: "#151515",
			dates: "#464646",
			excludeDaysLabel: "#464646",
		},
		trophy: {
			BACKGROUND: "#FFF",
			TITLE: "#000",
			ICON_CIRCLE: "#FFF",
			TEXT: "#666",
			LAUREL: "#009366",
			SECRET_RANK_1: "red",
			SECRET_RANK_2: "fuchsia",
			SECRET_RANK_3: "blue",
			SECRET_RANK_TEXT: "fuchsia",
			NEXT_RANK_BAR: "#0366d6",
			S_RANK_BASE: "#FAD200",
			S_RANK_SHADOW: "#C8A090",
			S_RANK_TEXT: "#886000",
			A_RANK_BASE: "#B0B0B0",
			A_RANK_SHADOW: "#9090C0",
			A_RANK_TEXT: "#505050",
			B_RANK_BASE: "#A18D66",
			B_RANK_SHADOW: "#816D96",
			B_RANK_TEXT: "#412D06",
			DEFAULT_RANK_BASE: "#777",
			DEFAULT_RANK_SHADOW: "#333",
			DEFAULT_RANK_TEXT: "#333",
		},
	},
	default_repocard: {
		name: "default_repocard",
		colors: {
			title: { hex: "2f80ed" },
			icon: { hex: "586069" },
			text: { hex: "434d58" },
			background: { hex: "fffefe" },
		},
	},
	transparent: {
		name: "transparent",
		colors: {
			title: { hex: "006AFF" },
			icon: { hex: "0579C3" },
			text: { hex: "417E87" },
			background: { hex: "ffffff00" },
		},
		streak: {
			background: "#0000",
			border: "#E4E2E2",
			stroke: "#E4E2E2",
			ring: "#006AFF",
			fire: "#006AFF",
			currStreakNum: "#0579C3",
			sideNums: "#006AFF",
			currStreakLabel: "#0579C3",
			sideLabels: "#006AFF",
			dates: "#417E87",
			excludeDaysLabel: "#417E87",
		},
	},
	light: {
		name: "light",
		colors: {
			title: { hex: "2f80ed" },
			icon: { hex: "4c71f2" },
			text: { hex: "434d58" },
			background: { hex: "ffffff" },
			border: { hex: "e4e2e2" },
		},
	},
	shadow_red: {
		name: "shadow_red",
		colors: {
			title: { hex: "9A0000" },
			icon: { hex: "4F0000" },
			text: { hex: "444" },
			background: { hex: "ffffff00" },
			border: { hex: "4F0000" },
		},
	},
	shadow_green: {
		name: "shadow_green",
		colors: {
			title: { hex: "007A00" },
			icon: { hex: "003D00" },
			text: { hex: "444" },
			background: { hex: "ffffff00" },
			border: { hex: "003D00" },
		},
	},
	shadow_blue: {
		name: "shadow_blue",
		colors: {
			title: { hex: "00779A" },
			icon: { hex: "004450" },
			text: { hex: "444" },
			background: { hex: "ffffff00" },
			border: { hex: "004490" },
		},
	},
	dark: {
		name: "dark",
		colors: {
			title: { hex: "fff" },
			icon: { hex: "79ff97" },
			text: { hex: "9f9f9f" },
			background: { hex: "151515" },
		},
		streak: {
			background: "#151515",
			border: "#E4E2E2",
			stroke: "#E4E2E2",
			ring: "#FB8C00",
			fire: "#FB8C00",
			currStreakNum: "#FEFEFE",
			sideNums: "#FEFEFE",
			currStreakLabel: "#FB8C00",
			sideLabels: "#FEFEFE",
			dates: "#9E9E9E",
			excludeDaysLabel: "#9E9E9E",
		},
	},
	radical: {
		name: "radical",
		colors: {
			title: { hex: "fe428e" },
			icon: { hex: "f8d847" },
			text: { hex: "a9fef7" },
			background: { hex: "141321" },
		},
		streak: {
			background: "#141321",
			border: "#E4E2E2",
			stroke: "#E4E2E2",
			ring: "#FE428E",
			fire: "#FE428E",
			currStreakNum: "#F8D847",
			sideNums: "#FE428E",
			currStreakLabel: "#F8D847",
			sideLabels: "#FE428E",
			dates: "#A9FEF7",
			excludeDaysLabel: "#A9FEF7",
		},
		trophy: {
			BACKGROUND: "#141321",
			ICON_CIRCLE: "#EEEEEE",
			TITLE: "#fe428e",
			TEXT: "#a9fef7",
			LAUREL: "#50fa7b",
			SECRET_RANK_1: "#ff5555",
			SECRET_RANK_2: "#ff15d9",
			SECRET_RANK_3: "#1E65F5",
			SECRET_RANK_TEXT: "#ff61c6",
			NEXT_RANK_BAR: "#fe428e",
			S_RANK_BASE: "#ffce32",
			S_RANK_SHADOW: "#ffce32",
			S_RANK_TEXT: "#CB8A30",
			A_RANK_BASE: "#8DF7B5",
			A_RANK_SHADOW: "#8DF7B5",
			A_RANK_TEXT: "#3A3A3A",
			B_RANK_BASE: "#EA3F25",
			B_RANK_SHADOW: "#EA3F25",
			B_RANK_TEXT: "#3A3A3A",
			DEFAULT_RANK_BASE: "#1E65F5",
			DEFAULT_RANK_SHADOW: "#1E65F5",
			DEFAULT_RANK_TEXT: "#3A3A3A",
		},
	},
	merko: {
		name: "merko",
		colors: {
			title: { hex: "abd200" },
			icon: { hex: "b7d364" },
			text: { hex: "68b587" },
			background: { hex: "0a0f0b" },
		},
		streak: {
			background: "#0A0F0B",
			border: "#E4E2E2",
			stroke: "#E4E2E2",
			ring: "#ABD200",
			fire: "#ABD200",
			currStreakNum: "#B7D364",
			sideNums: "#ABD200",
			currStreakLabel: "#B7D364",
			sideLabels: "#ABD200",
			dates: "#68B587",
			excludeDaysLabel: "#68B587",
		},
	},
	gruvbox: {
		name: "gruvbox",
		colors: {
			title: { hex: "fabd2f" },
			icon: { hex: "fe8019" },
			text: { hex: "8ec07c" },
			background: { hex: "282828" },
		},
		trophy: {
			BACKGROUND: "#282828",
			TITLE: "#ebdbb2",
			ICON_CIRCLE: "#ebdbb2",
			TEXT: "#98971a",
			LAUREL: "#689d6a",
			SECRET_RANK_1: "#fb4934",
			SECRET_RANK_2: "#d3869b",
			SECRET_RANK_3: "#458588",
			SECRET_RANK_TEXT: "#b16286",
			NEXT_RANK_BAR: "#fabd26",
			S_RANK_BASE: "#fabd2f",
			S_RANK_SHADOW: "#fabd2f",
			S_RANK_TEXT: "#322301",
			A_RANK_BASE: "#83a598",
			A_RANK_SHADOW: "#83a598",
			A_RANK_TEXT: "#151e1a",
			B_RANK_BASE: "#d65d0e",
			B_RANK_SHADOW: "#d65d0e",
			B_RANK_TEXT: "#301503",
			DEFAULT_RANK_BASE: "#928374",
			DEFAULT_RANK_SHADOW: "#928374",
			DEFAULT_RANK_TEXT: "#282828",
		},
	},
	gruvbox_light: {
		name: "gruvbox_light",
		colors: {
			title: { hex: "b57614" },
			icon: { hex: "af3a03" },
			text: { hex: "427b58" },
			background: { hex: "fbf1c7" },
		},
	},
	tokyonight: {
		name: "tokyonight",
		colors: {
			title: { hex: "70a5fd" },
			icon: { hex: "bf91f3" },
			text: { hex: "38bdae" },
			background: { hex: "1a1b27" },
		},
		streak: {
			background: "#1A1B27",
			border: "#E4E2E2",
			stroke: "#E4E2E2",
			ring: "#70A5FD",
			fire: "#70A5FD",
			currStreakNum: "#BF91F3",
			sideNums: "#70A5FD",
			currStreakLabel: "#BF91F3",
			sideLabels: "#70A5FD",
			dates: "#38BDAE",
			excludeDaysLabel: "#38BDAE",
		},
		trophy: {
			BACKGROUND: "#1a1b27",
			TITLE: "#70a5fd",
			ICON_CIRCLE: "#bf91f3",
			TEXT: "#38bdae",
			LAUREL: "#178600",
			SECRET_RANK_1: "#ff5555",
			SECRET_RANK_2: "#ff79c6",
			SECRET_RANK_3: "#388bfd",
			SECRET_RANK_TEXT: "#ff79c6",
			NEXT_RANK_BAR: "#00aeff",
			S_RANK_BASE: "#ffb86c",
			S_RANK_SHADOW: "#ffb86c",
			S_RANK_TEXT: "#0d1117",
			A_RANK_BASE: "#2dde98",
			A_RANK_TEXT: "#0d1117",
			A_RANK_SHADOW: "#2dde98",
			B_RANK_BASE: "#8be9fd",
			B_RANK_SHADOW: "#8be9fd",
			B_RANK_TEXT: "#0d1117",
			DEFAULT_RANK_BASE: "#5c75c3",
			DEFAULT_RANK_SHADOW: "#6272a4",
			DEFAULT_RANK_TEXT: "#0d1117",
		},
	},
	onedark: {
		name: "onedark",
		colors: {
			title: { hex: "e4bf7a" },
			icon: { hex: "8eb573" },
			text: { hex: "df6d74" },
			background: { hex: "282c34" },
		},
		trophy: {
			BACKGROUND: "#282c34",
			TITLE: "#e5c07b",
			ICON_CIRCLE: "#FFF",
			TEXT: "#e06c75",
			LAUREL: "#98c379",
			SECRET_RANK_1: "#e06c75",
			SECRET_RANK_2: "#c678dd",
			SECRET_RANK_3: "#61afef",
			SECRET_RANK_TEXT: "#c678dd",
			NEXT_RANK_BAR: "#e5c07b",
			S_RANK_BASE: "#e5c07b",
			S_RANK_SHADOW: "#e5c07b",
			S_RANK_TEXT: "#282c34",
			A_RANK_BASE: "#56b6c2",
			A_RANK_SHADOW: "#56b6c2",
			A_RANK_TEXT: "#282c34",
			B_RANK_BASE: "#c678dd",
			B_RANK_SHADOW: "#c678dd",
			B_RANK_TEXT: "#282c34",
			DEFAULT_RANK_BASE: "#abb2bf",
			DEFAULT_RANK_SHADOW: "#abb2bf",
			DEFAULT_RANK_TEXT: "#282c34",
		},
	},
	cobalt: {
		name: "cobalt",
		colors: {
			title: { hex: "e683d9" },
			icon: { hex: "0480ef" },
			text: { hex: "75eeb2" },
			background: { hex: "193549" },
		},
	},
	synthwave: {
		name: "synthwave",
		colors: {
			title: { hex: "e2e9ec" },
			icon: { hex: "ef8539" },
			text: { hex: "e5289e" },
			background: { hex: "2b213a" },
		},
	},
	highcontrast: {
		name: "highcontrast",
		colors: {
			title: { hex: "e7f216" },
			icon: { hex: "00ffff" },
			text: { hex: "fff" },
			background: { hex: "000" },
		},
		streak: {
			background: "#000000",
			border: "#BEBEBE",
			stroke: "#BEBEBE",
			ring: "#FB8C00",
			fire: "#FB8C00",
			currStreakNum: "#FFFFFF",
			sideNums: "#FFFFFF",
			currStreakLabel: "#FB8C00",
			sideLabels: "#FFFFFF",
			dates: "#C5C5C5",
			excludeDaysLabel: "#C5C5C5",
		},
	},
	dracula: {
		name: "dracula",
		colors: {
			title: { hex: "ff6e96" },
			icon: { hex: "79dafa" },
			text: { hex: "f8f8f2" },
			background: { hex: "282a36" },
		},
		trophy: {
			BACKGROUND: "#282a36",
			TITLE: "#ff79c6",
			ICON_CIRCLE: "#f8f8f2",
			TEXT: "#f8f8f2",
			LAUREL: "#50fa7b",
			SECRET_RANK_1: "#ff5555",
			SECRET_RANK_2: "#ff79c6",
			SECRET_RANK_3: "#bd93f9",
			SECRET_RANK_TEXT: "#bd93f9",
			NEXT_RANK_BAR: "#ff79c6",
			S_RANK_BASE: "#ffb86c",
			S_RANK_SHADOW: "#ffb86c",
			S_RANK_TEXT: "#6272a4",
			A_RANK_BASE: "#8be9fd",
			A_RANK_SHADOW: "#8be9fd",
			A_RANK_TEXT: "#6272a4",
			B_RANK_BASE: "#ff5555",
			B_RANK_SHADOW: "#ff5555",
			B_RANK_TEXT: "#6272a4",
			DEFAULT_RANK_BASE: "#6272a4",
			DEFAULT_RANK_SHADOW: "#6272a4",
			DEFAULT_RANK_TEXT: "#6272a4",
		},
	},
	prussian: {
		name: "prussian",
		colors: {
			title: { hex: "bddfff" },
			icon: { hex: "38a0ff" },
			text: { hex: "6e93b5" },
			background: { hex: "172f45" },
		},
	},
	monokai: {
		name: "monokai",
		colors: {
			title: { hex: "eb1f6a" },
			icon: { hex: "e28905" },
			text: { hex: "f1f1eb" },
			background: { hex: "272822" },
		},
		trophy: {
			BACKGROUND: "#272822",
			TITLE: "#f92672",
			ICON_CIRCLE: "#fff",
			TEXT: "#fff",
			LAUREL: "#a6e22e",
			SECRET_RANK_1: "#f92672",
			SECRET_RANK_2: "#ae81ff",
			SECRET_RANK_3: "#66d9ef",
			SECRET_RANK_TEXT: "#b16286",
			NEXT_RANK_BAR: "#f92672",
			S_RANK_BASE: "#e6db74",
			S_RANK_SHADOW: "#e6db74",
			S_RANK_TEXT: "#272822",
			A_RANK_BASE: "#66d9ef",
			A_RANK_SHADOW: "#66d9ef",
			A_RANK_TEXT: "#272822",
			B_RANK_BASE: "#fd971f",
			B_RANK_SHADOW: "#fd971f",
			B_RANK_TEXT: "#272822",
			DEFAULT_RANK_BASE: "#75715e",
			DEFAULT_RANK_SHADOW: "#75715e",
			DEFAULT_RANK_TEXT: "#282828",
		},
	},
	vue: {
		name: "vue",
		colors: {
			title: { hex: "41b883" },
			icon: { hex: "41b883" },
			text: { hex: "273849" },
			background: { hex: "fffefe" },
		},
	},
	"vue-dark": {
		name: "vue-dark",
		colors: {
			title: { hex: "41b883" },
			icon: { hex: "41b883" },
			text: { hex: "fffefe" },
			background: { hex: "273849" },
		},
	},
	"shades-of-purple": {
		name: "shades-of-purple",
		colors: {
			title: { hex: "fad000" },
			icon: { hex: "b362ff" },
			text: { hex: "a599e9" },
			background: { hex: "2d2b55" },
		},
	},
	nightowl: {
		name: "nightowl",
		colors: {
			title: { hex: "c792ea" },
			icon: { hex: "ffeb95" },
			text: { hex: "7fdbca" },
			background: { hex: "011627" },
		},
	},
	buefy: {
		name: "buefy",
		colors: {
			title: { hex: "7957d5" },
			icon: { hex: "ff3860" },
			text: { hex: "363636" },
			background: { hex: "ffffff" },
		},
	},
	"blue-green": {
		name: "blue-green",
		colors: {
			title: { hex: "2f97c1" },
			icon: { hex: "f5b700" },
			text: { hex: "0cf574" },
			background: { hex: "040f0f" },
		},
	},
	algolia: {
		name: "algolia",
		colors: {
			title: { hex: "00AEFF" },
			icon: { hex: "2DDE98" },
			text: { hex: "FFFFFF" },
			background: { hex: "050F2C" },
		},
		trophy: {
			BACKGROUND: "#050f2c",
			TITLE: "#00aeff",
			ICON_CIRCLE: "#f0f6fb",
			TEXT: "#7eace9",
			LAUREL: "#178600",
			SECRET_RANK_1: "#ff5555",
			SECRET_RANK_2: "#ff79c6",
			SECRET_RANK_3: "#388bfd",
			SECRET_RANK_TEXT: "#ff79c6",
			NEXT_RANK_BAR: "#00aeff",
			S_RANK_BASE: "#ffb86c",
			S_RANK_SHADOW: "#ffb86c",
			S_RANK_TEXT: "#0d1117",
			A_RANK_BASE: "#2dde98",
			A_RANK_TEXT: "#0d1117",
			A_RANK_SHADOW: "#2dde98",
			B_RANK_BASE: "#8be9fd",
			B_RANK_SHADOW: "#8be9fd",
			B_RANK_TEXT: "#0d1117",
			DEFAULT_RANK_BASE: "#5c75c3",
			DEFAULT_RANK_SHADOW: "#6272a4",
			DEFAULT_RANK_TEXT: "#0d1117",
		},
	},
	"great-gatsby": {
		name: "great-gatsby",
		colors: {
			title: { hex: "ffa726" },
			icon: { hex: "ffb74d" },
			text: { hex: "ffd95b" },
			background: { hex: "000000" },
		},
	},
	darcula: {
		name: "darcula",
		colors: {
			title: { hex: "BA5F17" },
			icon: { hex: "84628F" },
			text: { hex: "BEBEBE" },
			background: { hex: "242424" },
		},
	},
	bear: {
		name: "bear",
		colors: {
			title: { hex: "e03c8a" },
			icon: { hex: "00AEFF" },
			text: { hex: "bcb28d" },
			background: { hex: "1f2023" },
		},
	},
	"solarized-dark": {
		name: "solarized-dark",
		colors: {
			title: { hex: "268bd2" },
			icon: { hex: "b58900" },
			text: { hex: "859900" },
			background: { hex: "002b36" },
		},
	},
	"solarized-light": {
		name: "solarized-light",
		colors: {
			title: { hex: "268bd2" },
			icon: { hex: "b58900" },
			text: { hex: "859900" },
			background: { hex: "fdf6e3" },
		},
	},
	"chartreuse-dark": {
		name: "chartreuse-dark",
		colors: {
			title: { hex: "7fff00" },
			icon: { hex: "00AEFF" },
			text: { hex: "fff" },
			background: { hex: "000" },
		},
	},
	nord: {
		name: "nord",
		colors: {
			title: { hex: "81a1c1" },
			icon: { hex: "88c0d0" },
			text: { hex: "d8dee9" },
			background: { hex: "2e3440" },
		},
		trophy: {
			BACKGROUND: "#2E3440",
			TITLE: "#81A1C1",
			ICON_CIRCLE: "#D8DEE9",
			TEXT: "#ECEFF4",
			LAUREL: "#A3BE8C",
			SECRET_RANK_1: "#BF616A",
			SECRET_RANK_2: "#B48EAD",
			SECRET_RANK_3: "#81A1C1",
			SECRET_RANK_TEXT: "#B48EAD",
			NEXT_RANK_BAR: "#81A1C1",
			S_RANK_BASE: "#EBCB8B",
			S_RANK_SHADOW: "#EBCB8B",
			S_RANK_TEXT: "#3B4252",
			A_RANK_BASE: "#8FBCBB",
			A_RANK_SHADOW: "#8FBCBB",
			A_RANK_TEXT: "#3B4252",
			B_RANK_BASE: "#D08770",
			B_RANK_SHADOW: "#D08770",
			B_RANK_TEXT: "#3B4252",
			DEFAULT_RANK_BASE: "#5E81AC",
			DEFAULT_RANK_SHADOW: "#5E81AC",
			DEFAULT_RANK_TEXT: "#3B4252",
		},
	},
	gotham: {
		name: "gotham",
		colors: {
			title: { hex: "2aa889" },
			icon: { hex: "599cab" },
			text: { hex: "99d1ce" },
			background: { hex: "0c1014" },
		},
	},
	"material-palenight": {
		name: "material-palenight",
		colors: {
			title: { hex: "c792ea" },
			icon: { hex: "89ddff" },
			text: { hex: "a6accd" },
			background: { hex: "292d3e" },
		},
	},
	graywhite: {
		name: "graywhite",
		colors: {
			title: { hex: "24292e" },
			icon: { hex: "24292e" },
			text: { hex: "24292e" },
			background: { hex: "ffffff" },
		},
	},
	"vision-friendly-dark": {
		name: "vision-friendly-dark",
		colors: {
			title: { hex: "ffb000" },
			icon: { hex: "785ef0" },
			text: { hex: "ffffff" },
			background: { hex: "000000" },
		},
	},
	"ayu-mirage": {
		name: "ayu-mirage",
		colors: {
			title: { hex: "f4cd7c" },
			icon: { hex: "73d0ff" },
			text: { hex: "c7c8c2" },
			background: { hex: "1f2430" },
		},
	},
	"midnight-purple": {
		name: "midnight-purple",
		colors: {
			title: { hex: "9745f5" },
			icon: { hex: "9f4bff" },
			text: { hex: "ffffff" },
			background: { hex: "000000" },
		},
	},
	calm: {
		name: "calm",
		colors: {
			title: { hex: "e07a5f" },
			icon: { hex: "edae49" },
			text: { hex: "ebcfb2" },
			background: { hex: "373f51" },
		},
	},
	"flag-india": {
		name: "flag-india",
		colors: {
			title: { hex: "ff8f1c" },
			icon: { hex: "250E62" },
			text: { hex: "509E2F" },
			background: { hex: "ffffff" },
		},
	},
	omni: {
		name: "omni",
		colors: {
			title: { hex: "FF79C6" },
			icon: { hex: "e7de79" },
			text: { hex: "E1E1E6" },
			background: { hex: "191622" },
		},
	},
	react: {
		name: "react",
		colors: {
			title: { hex: "61dafb" },
			icon: { hex: "61dafb" },
			text: { hex: "ffffff" },
			background: { hex: "20232a" },
		},
	},
	jolly: {
		name: "jolly",
		colors: {
			title: { hex: "ff64da" },
			icon: { hex: "a960ff" },
			text: { hex: "ffffff" },
			background: { hex: "291B3E" },
		},
	},
	maroongold: {
		name: "maroongold",
		colors: {
			title: { hex: "F7EF8A" },
			icon: { hex: "F7EF8A" },
			text: { hex: "E0AA3E" },
			background: { hex: "260000" },
		},
	},
	yeblu: {
		name: "yeblu",
		colors: {
			title: { hex: "ffff00" },
			icon: { hex: "ffff00" },
			text: { hex: "ffffff" },
			background: { hex: "002046" },
		},
	},
	blueberry: {
		name: "blueberry",
		colors: {
			title: { hex: "82aaff" },
			icon: { hex: "89ddff" },
			text: { hex: "27e8a7" },
			background: { hex: "242938" },
		},
	},
	slateorange: {
		name: "slateorange",
		colors: {
			title: { hex: "faa627" },
			icon: { hex: "faa627" },
			text: { hex: "ffffff" },
			background: { hex: "36393f" },
		},
	},
	kacho_ga: {
		name: "kacho_ga",
		colors: {
			title: { hex: "bf4a3f" },
			icon: { hex: "a64833" },
			text: { hex: "d9c8a9" },
			background: { hex: "402b23" },
		},
	},
	outrun: {
		name: "outrun",
		colors: {
			title: { hex: "ffcc00" },
			icon: { hex: "ff1aff" },
			text: { hex: "8080ff" },
			background: { hex: "141439" },
		},
	},
	ocean_dark: {
		name: "ocean_dark",
		colors: {
			title: { hex: "8957B2" },
			icon: { hex: "FFFFFF" },
			text: { hex: "92D534" },
			background: { hex: "151A28" },
		},
	},
	city_lights: {
		name: "city_lights",
		colors: {
			title: { hex: "5D8CB3" },
			icon: { hex: "4798FF" },
			text: { hex: "718CA1" },
			background: { hex: "1D252C" },
		},
	},
	github_dark: {
		name: "github_dark",
		colors: {
			title: { hex: "58A6FF" },
			icon: { hex: "1F6FEB" },
			text: { hex: "C3D1D9" },
			background: { hex: "0D1117" },
		},
	},
	github_dark_dimmed: {
		name: "github_dark_dimmed",
		colors: {
			title: { hex: "539bf5" },
			icon: { hex: "539bf5" },
			text: { hex: "ADBAC7" },
			background: { hex: "24292F" },
			border: { hex: "373E47" },
		},
	},
	discord_old_blurple: {
		name: "discord_old_blurple",
		colors: {
			title: { hex: "7289DA" },
			icon: { hex: "7289DA" },
			text: { hex: "FFFFFF" },
			background: { hex: "2C2F33" },
		},
	},
	aura_dark: {
		name: "aura_dark",
		colors: {
			title: { hex: "ff7372" },
			icon: { hex: "6cffd0" },
			text: { hex: "dbdbdb" },
			background: { hex: "252334" },
		},
	},
	panda: {
		name: "panda",
		colors: {
			title: { hex: "19f9d899" },
			icon: { hex: "19f9d899" },
			text: { hex: "FF75B5" },
			background: { hex: "31353a" },
		},
	},
	noctis_minimus: {
		name: "noctis_minimus",
		colors: {
			title: { hex: "d3b692" },
			icon: { hex: "72b7c0" },
			text: { hex: "c5cdd3" },
			background: { hex: "1b2932" },
		},
	},
	cobalt2: {
		name: "cobalt2",
		colors: {
			title: { hex: "ffc600" },
			icon: { hex: "ffffff" },
			text: { hex: "0088ff" },
			background: { hex: "193549" },
		},
	},
	swift: {
		name: "swift",
		colors: {
			title: { hex: "000000" },
			icon: { hex: "f05237" },
			text: { hex: "000000" },
			background: { hex: "f7f7f7" },
		},
	},
	aura: {
		name: "aura",
		colors: {
			title: { hex: "a277ff" },
			icon: { hex: "ffca85" },
			text: { hex: "61ffca" },
			background: { hex: "15141b" },
		},
		trophy: {
			BACKGROUND: "#1E1D26",
			TITLE: "#FFFFFF",
			ICON_CIRCLE: "#FFFFFF",
			TEXT: "#dbffe6",
			LAUREL: "#a9fcca",
			SECRET_RANK_1: "#c273ff",
			SECRET_RANK_2: "#c273ff",
			SECRET_RANK_3: "#c273ff",
			SECRET_RANK_TEXT: "#bd93f9",
			NEXT_RANK_BAR: "#715df5",
			S_RANK_BASE: "#8e57ff",
			S_RANK_SHADOW: "#2361ad",
			S_RANK_TEXT: "#6272a4",
			A_RANK_BASE: "#7c71f5",
			A_RANK_SHADOW: "#3ae056",
			A_RANK_TEXT: "#6272a4",
			B_RANK_BASE: "#226a80",
			B_RANK_SHADOW: "#226a80",
			B_RANK_TEXT: "#6272a4",
			DEFAULT_RANK_BASE: "#5e8c2a",
			DEFAULT_RANK_SHADOW: "#5e8c2a",
			DEFAULT_RANK_TEXT: "#5e8c2a",
		},
	},
	apprentice: {
		name: "apprentice",
		colors: {
			title: { hex: "ffffff" },
			icon: { hex: "ffffaf" },
			text: { hex: "bcbcbc" },
			background: { hex: "262626" },
		},
		trophy: {
			BACKGROUND: "#262626",
			TITLE: "#BCBCBC",
			ICON_CIRCLE: "#BCBCBC",
			TEXT: "#5F875F",
			LAUREL: "#5F8787",
			SECRET_RANK_1: "#FF8700",
			SECRET_RANK_2: "#8787AF",
			SECRET_RANK_3: "#5F87AF",
			SECRET_RANK_TEXT: "#5F5F87",
			NEXT_RANK_BAR: "#FFFFA9",
			S_RANK_BASE: "#FFFFAF",
			S_RANK_SHADOW: "#FFFFAF",
			S_RANK_TEXT: "#87875F",
			A_RANK_BASE: "#8FAFD7",
			A_RANK_SHADOW: "#8FAFD7",
			A_RANK_TEXT: "#5F875F",
			B_RANK_BASE: "#AF5F5F",
			B_RANK_SHADOW: "#AF5F5F",
			B_RANK_TEXT: "#AF5F5F",
			DEFAULT_RANK_BASE: "#6C6C6C",
			DEFAULT_RANK_SHADOW: "#6C6C6C",
			DEFAULT_RANK_TEXT: "#1C1C1C",
		},
	},
	moltack: {
		name: "moltack",
		colors: {
			title: { hex: "86092C" },
			icon: { hex: "86092C" },
			text: { hex: "574038" },
			background: { hex: "F5E1C0" },
		},
	},
	codeSTACKr: {
		name: "codeSTACKr",
		colors: {
			title: { hex: "ff652f" },
			icon: { hex: "FFE400" },
			text: { hex: "ffffff" },
			background: { hex: "09131B" },
			border: { hex: "0c1a25" },
		},
	},
	rose_pine: {
		name: "rose_pine",
		colors: {
			title: { hex: "9ccfd8" },
			icon: { hex: "ebbcba" },
			text: { hex: "e0def4" },
			background: { hex: "191724" },
		},
	},
	catppuccin_latte: {
		name: "catppuccin_latte",
		colors: {
			title: { hex: "137980" },
			icon: { hex: "8839ef" },
			text: { hex: "4c4f69" },
			background: { hex: "eff1f5" },
		},
	},
	catppuccin_mocha: {
		name: "catppuccin_mocha",
		colors: {
			title: { hex: "94e2d5" },
			icon: { hex: "cba6f7" },
			text: { hex: "cdd6f4" },
			background: { hex: "1e1e2e" },
		},
	},
	date_night: {
		name: "date_night",
		colors: {
			title: { hex: "DA7885" },
			icon: { hex: "BB8470" },
			text: { hex: "E1B2A2" },
			background: { hex: "170F0C" },
			border: { hex: "170F0C" },
		},
	},
	one_dark_pro: {
		name: "one_dark_pro",
		colors: {
			title: { hex: "61AFEF" },
			icon: { hex: "C678DD" },
			text: { hex: "E5C06E" },
			background: { hex: "23272E" },
			border: { hex: "3B4048" },
		},
	},
	rose: {
		name: "rose",
		colors: {
			title: { hex: "8d192b" },
			icon: { hex: "B71F36" },
			text: { hex: "862931" },
			background: { hex: "e9d8d4" },
			border: { hex: "e9d8d4" },
		},
	},
	holi: {
		name: "holi",
		colors: {
			title: { hex: "5FABEE" },
			icon: { hex: "5FABEE" },
			text: { hex: "D6E7FF" },
			background: { hex: "030314" },
			border: { hex: "85A4C0" },
		},
	},
	neon: {
		name: "neon",
		colors: {
			title: { hex: "00EAD3" },
			icon: { hex: "00EAD3" },
			text: { hex: "FF449F" },
			background: { hex: "000000" },
			border: { hex: "ffffff" },
		},
	},
	blue_navy: {
		name: "blue_navy",
		colors: {
			title: { hex: "82AAFF" },
			icon: { hex: "82AAFF" },
			text: { hex: "82AAFF" },
			background: { hex: "000000" },
			border: { hex: "ffffff" },
		},
	},
	calm_pink: {
		name: "calm_pink",
		colors: {
			title: { hex: "e07a5f" },
			icon: { hex: "ebcfb2" },
			text: { hex: "edae49" },
			background: { hex: "2b2d40" },
			border: { hex: "e1bc29" },
		},
	},
	ambient_gradient: {
		name: "ambient_gradient",
		colors: {
			title: { hex: "ffffff" },
			icon: { hex: "ffffff" },
			text: { hex: "ffffff" },
			background: { hex: "35,4158d0,c850c0,ffcc70" },
		},
	},
	watchdog: {
		name: "watchdog",
		colors: {
			title: { hex: "fe428e" },
			icon: { hex: "f8d847" },
			text: { hex: "a9fef7" },
			background: { hex: "45,520806,021D4A" },
			border: { hex: "e4e2e2" },
		},
		streak: {
			background: "45,#520806,#021D4A",
			border: "#E4E2E2",
			stroke: "#E4E2E2",
			ring: "#FE428E",
			fire: "#EB8C30",
			currStreakNum: "#F8D847",
			sideNums: "#FE428E",
			currStreakLabel: "#F8D847",
			sideLabels: "#FE428E",
			dates: "#A9FEF7",
			excludeDaysLabel: "#A9FEF7",
		},
		trophy: {
			BACKGROUND: "45,#520806,#021D4A",
			TITLE: "#FE428E",
			ICON_CIRCLE: "#F8D847",
			TEXT: "#A9FEF7",
			LAUREL: "#FE428E",
			SECRET_RANK_1: "#EB8C30",
			SECRET_RANK_2: "#EB8C30",
			SECRET_RANK_3: "#EB8C30",
			SECRET_RANK_TEXT: "#EB8C30",
			NEXT_RANK_BAR: "#EB8C30",
			S_RANK_BASE: "#F8D847",
			S_RANK_SHADOW: "#F8D847",
			S_RANK_TEXT: "#3A3A3A",
			A_RANK_BASE: "#A9FEF7",
			A_RANK_SHADOW: "#A9FEF7",
			A_RANK_TEXT: "#505050",
			B_RANK_BASE: "#EB8C30",
			B_RANK_SHADOW: "#EB8C30",
			B_RANK_TEXT: "#3A3A3A",
			DEFAULT_RANK_BASE: "#777",
			DEFAULT_RANK_SHADOW: "#333",
			DEFAULT_RANK_TEXT: "#333",
		},
	},
	flat: {
		name: "flat",
		colors: {
			title: { hex: "000" },
			text: { hex: "666" },
			icon: { hex: "FFF" },
			background: { hex: "FFF" },
		},
		trophy: {
			BACKGROUND: "#FFF",
			TITLE: "#000",
			ICON_CIRCLE: "#FFF",
			TEXT: "#666",
			LAUREL: "#009366",
			SECRET_RANK_1: "red",
			SECRET_RANK_2: "fuchsia",
			SECRET_RANK_3: "blue",
			SECRET_RANK_TEXT: "fuchsia",
			NEXT_RANK_BAR: "#0366d6",
			S_RANK_BASE: "#eac200",
			S_RANK_SHADOW: "#eac200",
			S_RANK_TEXT: "#886000",
			A_RANK_BASE: "#B0B0B0",
			A_RANK_SHADOW: "#B0B0B0",
			A_RANK_TEXT: "#505050",
			B_RANK_BASE: "#A18D66",
			B_RANK_SHADOW: "#A18D66",
			B_RANK_TEXT: "#412D06",
			DEFAULT_RANK_BASE: "#777",
			DEFAULT_RANK_SHADOW: "#777",
			DEFAULT_RANK_TEXT: "#333",
		},
	},
	discord: {
		name: "discord",
		colors: {
			title: { hex: "7289DA" },
			text: { hex: "FFFFFF" },
			icon: { hex: "FFFFFF" },
			background: { hex: "23272A" },
		},
		trophy: {
			BACKGROUND: "#23272A",
			TITLE: "#7289DA",
			ICON_CIRCLE: "#FFFFFF",
			TEXT: "#FFFFFF",
			LAUREL: "#57F287",
			SECRET_RANK_1: "#ED4245",
			SECRET_RANK_2: "#57F287",
			SECRET_RANK_3: "#5865F2",
			SECRET_RANK_TEXT: "#000000",
			NEXT_RANK_BAR: "#5865F2",
			S_RANK_BASE: "#FEE75C",
			S_RANK_SHADOW: "#FEE75C",
			S_RANK_TEXT: "#000000",
			A_RANK_BASE: "#EB459E",
			A_RANK_SHADOW: "#ED4245",
			A_RANK_TEXT: "#000000",
			B_RANK_BASE: "#ED4245",
			B_RANK_SHADOW: "#ED4245",
			B_RANK_TEXT: "#000000",
			DEFAULT_RANK_BASE: "#5865F2",
			DEFAULT_RANK_SHADOW: "#5865F2",
			DEFAULT_RANK_TEXT: "#000000",
		},
	},
	chalk: {
		name: "chalk",
		colors: {
			title: { hex: "fed37e" },
			text: { hex: "d4d4d4" },
			icon: { hex: "e4e4e4" },
			background: { hex: "2d2d2d" },
		},
		trophy: {
			BACKGROUND: "#2d2d2d",
			TITLE: "#fed37e",
			ICON_CIRCLE: "#e4e4e4",
			TEXT: "#d4d4d4",
			LAUREL: "#a9d3ab",
			SECRET_RANK_1: "#f58e8e",
			SECRET_RANK_2: "#d6add5",
			SECRET_RANK_3: "#66d9ef",
			SECRET_RANK_TEXT: "#f58e8e",
			NEXT_RANK_BAR: "#7aabd4",
			S_RANK_BASE: "#fed37e",
			S_RANK_SHADOW: "#fed37e",
			S_RANK_TEXT: "#2d2d2d",
			A_RANK_BASE: "#79D4D5",
			A_RANK_SHADOW: "#79D4D5",
			A_RANK_TEXT: "#2d2d2d",
			B_RANK_BASE: "#f58e8e",
			B_RANK_SHADOW: "#f58e8e",
			B_RANK_TEXT: "#2d2d2d",
			DEFAULT_RANK_BASE: "#75715e",
			DEFAULT_RANK_SHADOW: "#75715e",
			DEFAULT_RANK_TEXT: "#2d2d2d",
		},
	},
	alduin: {
		name: "alduin",
		colors: {
			title: { hex: "dfd7af" },
			text: { hex: "dfd7af" },
			icon: { hex: "e3e3e3" },
			background: { hex: "1c1c1c" },
		},
		trophy: {
			BACKGROUND: "#1c1c1c",
			TITLE: "#dfd7af",
			ICON_CIRCLE: "#e3e3e3",
			TEXT: "#dfd7af",
			LAUREL: "#a9d3ab",
			SECRET_RANK_1: "#f58e8e",
			SECRET_RANK_2: "#d6add5",
			SECRET_RANK_3: "#66d9ef",
			SECRET_RANK_TEXT: "#f58e8e",
			NEXT_RANK_BAR: "#dfd7af",
			S_RANK_BASE: "#fed37e",
			S_RANK_SHADOW: "#fed37e",
			S_RANK_TEXT: "#2d2d2d",
			A_RANK_BASE: "#79D4D5",
			A_RANK_SHADOW: "#79D4D5",
			A_RANK_TEXT: "#2d2d2d",
			B_RANK_BASE: "#f58e8e",
			B_RANK_SHADOW: "#f58e8e",
			B_RANK_TEXT: "#2d2d2d",
			DEFAULT_RANK_BASE: "#75715e",
			DEFAULT_RANK_SHADOW: "#75715e",
			DEFAULT_RANK_TEXT: "#2d2d2d",
		},
	},
	darkhub: {
		name: "darkhub",
		colors: {
			title: { hex: "c9d1d9" },
			text: { hex: "8b949e" },
			icon: { hex: "f0f6fb" },
			background: { hex: "0d1117" },
		},
		trophy: {
			BACKGROUND: "#0d1117",
			TITLE: "#c9d1d9",
			ICON_CIRCLE: "#f0f6fb",
			TEXT: "#8b949e",
			LAUREL: "#178600",
			SECRET_RANK_1: "#ff5555",
			SECRET_RANK_2: "#ff79c6",
			SECRET_RANK_3: "#388bfd",
			SECRET_RANK_TEXT: "#ff79c6",
			NEXT_RANK_BAR: "#ff79c6",
			S_RANK_BASE: "#ffb86c",
			S_RANK_SHADOW: "#ffb86c",
			S_RANK_TEXT: "#0d1117",
			A_RANK_BASE: "#8be9fd",
			A_RANK_SHADOW: "#8be9fd",
			A_RANK_TEXT: "#0d1117",
			B_RANK_BASE: "#ff5555",
			B_RANK_SHADOW: "#ff5555",
			B_RANK_TEXT: "#0d1117",
			DEFAULT_RANK_BASE: "#6272a4",
			DEFAULT_RANK_SHADOW: "#6272a4",
			DEFAULT_RANK_TEXT: "#0d1117",
		},
	},
	juicyfresh: {
		name: "juicyfresh",
		colors: {
			title: { hex: "f7d745" },
			text: { hex: "b2d76c" },
			icon: { hex: "FFF" },
			background: { hex: "0d0c15" },
		},
		trophy: {
			BACKGROUND: "#0d0c15",
			TITLE: "#f7d745",
			ICON_CIRCLE: "#FFF",
			TEXT: "#b2d76c",
			LAUREL: "#8bb071",
			SECRET_RANK_1: "#a8d937",
			SECRET_RANK_2: "#f7e662",
			SECRET_RANK_3: "#4d9b1c",
			SECRET_RANK_TEXT: "#ff5700",
			NEXT_RANK_BAR: "#6562af",
			S_RANK_BASE: "#f7d644",
			S_RANK_SHADOW: "#f69e44",
			S_RANK_TEXT: "#ff5700",
			A_RANK_BASE: "#f69e44",
			A_RANK_SHADOW: "#f46d5a",
			A_RANK_TEXT: "#ff5700",
			B_RANK_BASE: "#f46d5a",
			B_RANK_SHADOW: "#f73155",
			B_RANK_TEXT: "#ff5700",
			DEFAULT_RANK_BASE: "#f0d7d6",
			DEFAULT_RANK_SHADOW: "#f58867",
			DEFAULT_RANK_TEXT: "#ff5700",
		},
	},
	oldie: {
		name: "oldie",
		colors: {
			title: { hex: "111" },
			text: { hex: "666" },
			icon: { hex: "FFF" },
			background: { hex: "F0F0F0" },
		},
		trophy: {
			BACKGROUND: "#F0F0F0",
			TITLE: "#111",
			ICON_CIRCLE: "#FFF",
			TEXT: "#666",
			LAUREL: "#535353",
			SECRET_RANK_1: "#738986",
			SECRET_RANK_2: "#B36154",
			SECRET_RANK_3: "#91A16A",
			SECRET_RANK_TEXT: "#4D4D4D",
			NEXT_RANK_BAR: "#8E8680",
			S_RANK_BASE: "#8E8E8E",
			S_RANK_SHADOW: "#8E8E8E",
			S_RANK_TEXT: "#4D4D4D",
			A_RANK_BASE: "#AFAFAF",
			A_RANK_SHADOW: "#AFAFAF",
			A_RANK_TEXT: "#4D4D4D",
			B_RANK_BASE: "#858585",
			B_RANK_SHADOW: "#858585",
			B_RANK_TEXT: "#4D4D4D",
			DEFAULT_RANK_BASE: "#535353",
			DEFAULT_RANK_SHADOW: "#535353",
			DEFAULT_RANK_TEXT: "#4D4D4D",
		},
	},
	buddhism: {
		name: "buddhism",
		colors: {
			title: { hex: "FFF" },
			text: { hex: "FFF" },
			icon: { hex: "FFF" },
			background: { hex: "ffc20e" },
		},
		trophy: {
			BACKGROUND: "#ffc20e",
			TITLE: "#FFF",
			ICON_CIRCLE: "#FFF",
			TEXT: "#FFF",
			LAUREL: "#27c5ff",
			SECRET_RANK_1: "#FFF",
			SECRET_RANK_2: "#f73155",
			SECRET_RANK_3: "#fff",
			SECRET_RANK_TEXT: "#f73155",
			NEXT_RANK_BAR: "#f73155",
			S_RANK_BASE: "#ff8400",
			S_RANK_SHADOW: "#ff8400",
			S_RANK_TEXT: "#ffc20e",
			A_RANK_BASE: "#fff",
			A_RANK_SHADOW: "#fff",
			A_RANK_TEXT: "#ffc20e",
			B_RANK_BASE: "#f73155",
			B_RANK_SHADOW: "#f73155",
			B_RANK_TEXT: "#ffc20e",
			DEFAULT_RANK_BASE: "#27c5ff",
			DEFAULT_RANK_SHADOW: "#27c5ff",
			DEFAULT_RANK_TEXT: "#ffc20e",
		},
	},
	onestar: {
		name: "onestar",
		colors: {
			title: { hex: "EEEEEE" },
			text: { hex: "c7c7c7" },
			icon: { hex: "EEEEEE" },
			background: { hex: "0d1117" },
		},
		trophy: {
			BACKGROUND: "#0d1117",
			ICON_CIRCLE: "#EEEEEE",
			TITLE: "#EEEEEE",
			TEXT: "#c7c7c7",
			LAUREL: "#0dbc79",
			SECRET_RANK_1: "#ff5555",
			SECRET_RANK_2: "#d861d8",
			SECRET_RANK_3: "#3b8eea",
			SECRET_RANK_TEXT: "#ff61c6",
			NEXT_RANK_BAR: "#9e9e9e",
			S_RANK_BASE: "#FFD54F",
			S_RANK_SHADOW: "#FFE082",
			S_RANK_TEXT: "#CB8A30",
			A_RANK_BASE: "#23d18b",
			A_RANK_SHADOW: "#8DF7B5",
			A_RANK_TEXT: "#3A3A3A",
			B_RANK_BASE: "#d13b3b",
			B_RANK_SHADOW: "#fa4b4b",
			B_RANK_TEXT: "#3A3A3A",
			DEFAULT_RANK_BASE: "#2472c8",
			DEFAULT_RANK_SHADOW: "#3b8eea",
			DEFAULT_RANK_TEXT: "#3A3A3A",
		},
	},
	gitdimmed: {
		name: "gitdimmed",
		colors: {
			title: { hex: "f0f6fb" },
			text: { hex: "FFF" },
			icon: { hex: "f0f6fb" },
			background: { hex: "333" },
		},
		trophy: {
			BACKGROUND: "#333",
			TITLE: "#f0f6fb",
			ICON_CIRCLE: "#f0f6fb",
			TEXT: "#FFF",
			LAUREL: "#178600",
			SECRET_RANK_1: "#ff5555",
			SECRET_RANK_2: "#ff79c6",
			SECRET_RANK_3: "#388bfd",
			SECRET_RANK_TEXT: "#ff79c6",
			NEXT_RANK_BAR: "#00aeff",
			S_RANK_BASE: "#ffb86c",
			S_RANK_SHADOW: "#ffb86c",
			S_RANK_TEXT: "#0d1117",
			A_RANK_BASE: "#2dde98",
			A_RANK_TEXT: "#0d1117",
			A_RANK_SHADOW: "#2dde98",
			B_RANK_BASE: "#8be9fd",
			B_RANK_SHADOW: "#8be9fd",
			B_RANK_TEXT: "#0d1117",
			DEFAULT_RANK_BASE: "#5c75c3",
			DEFAULT_RANK_SHADOW: "#6272a4",
			DEFAULT_RANK_TEXT: "#0d1117",
		},
	},
	matrix: {
		name: "matrix",
		colors: {
			title: { hex: "00cc00" },
			text: { hex: "00cc00" },
			icon: { hex: "002200" },
			background: { hex: "000000" },
		},
		trophy: {
			BACKGROUND: "#000000",
			TITLE: "#00cc00",
			ICON_CIRCLE: "#002200",
			TEXT: "#00cc00",
			LAUREL: "#178600",
			SECRET_RANK_1: "#ffd700",
			SECRET_RANK_2: "#ffffff",
			SECRET_RANK_3: "#ffd700",
			SECRET_RANK_TEXT: "#00ff00",
			NEXT_RANK_BAR: "#00ff00",
			S_RANK_BASE: "#ffd700",
			S_RANK_SHADOW: "#ffd700",
			S_RANK_TEXT: "#00ff00",
			A_RANK_BASE: "#c0c0c0",
			A_RANK_TEXT: "#00ff00",
			A_RANK_SHADOW: "#c0c0c0",
			B_RANK_BASE: "#b08d57",
			B_RANK_SHADOW: "#b08d57",
			B_RANK_TEXT: "#00ff00",
			DEFAULT_RANK_BASE: "#b08d57",
			DEFAULT_RANK_SHADOW: "#b08d57",
			DEFAULT_RANK_TEXT: "#00ff00",
		},
	},
	dark_dimmed: {
		name: "dark_dimmed",
		colors: {
			title: { hex: "adbac7" },
			text: { hex: "adbac7" },
			icon: { hex: "002200" },
			background: { hex: "22272e" },
		},
		trophy: {
			BACKGROUND: "#22272e",
			TITLE: "#adbac7",
			ICON_CIRCLE: "#002200",
			TEXT: "#adbac7",
			LAUREL: "#178600",
			SECRET_RANK_1: "red",
			SECRET_RANK_2: "fuchsia",
			SECRET_RANK_3: "blue",
			SECRET_RANK_TEXT: "fuchsia",
			NEXT_RANK_BAR: "#0366d6",
			S_RANK_BASE: "#FAD200",
			S_RANK_SHADOW: "#C8A090",
			S_RANK_TEXT: "#886000",
			A_RANK_BASE: "#B0B0B0",
			A_RANK_SHADOW: "#9090C0",
			A_RANK_TEXT: "#505050",
			B_RANK_BASE: "#A18D66",
			B_RANK_SHADOW: "#816D96",
			B_RANK_TEXT: "#412D06",
			DEFAULT_RANK_BASE: "#777",
			DEFAULT_RANK_SHADOW: "#333",
			DEFAULT_RANK_TEXT: "#333",
		},
	},
	dark_lover: {
		name: "dark_lover",
		colors: {
			title: { hex: "e8aa64" },
			text: { hex: "e8aa64" },
			icon: { hex: "white" },
			background: { hex: "0d0d0d" },
		},
		trophy: {
			BACKGROUND: "#0d0d0d",
			TITLE: "#e8aa64",
			ICON_CIRCLE: "white",
			TEXT: "#e8aa64",
			LAUREL: "#e86464",
			SECRET_RANK_1: "#e05555",
			SECRET_RANK_2: "#e05555",
			SECRET_RANK_3: "#e05555",
			SECRET_RANK_TEXT: "#e05555",
			NEXT_RANK_BAR: "#e05555",
			S_RANK_BASE: "#f2c635",
			S_RANK_SHADOW: "#e0d7b8",
			S_RANK_TEXT: "#b35707",
			A_RANK_BASE: "#f25755",
			A_RANK_SHADOW: "#e69493",
			A_RANK_TEXT: "#f5352f",
			B_RANK_BASE: "#63db93",
			B_RANK_SHADOW: "#8cd1a8",
			B_RANK_TEXT: "#07b84e",
			DEFAULT_RANK_BASE: "#7f6ceb",
			DEFAULT_RANK_SHADOW: "#a598ed",
			DEFAULT_RANK_TEXT: "#7f6ceb",
		},
	},
	kimbie_dark: {
		name: "kimbie_dark",
		colors: {
			title: { hex: "d3af86" },
			text: { hex: "d3af86" },
			icon: { hex: "7e602c" },
			background: { hex: "221a0f" },
		},
		trophy: {
			BACKGROUND: "#221a0f",
			TITLE: "#d3af86",
			ICON_CIRCLE: "#7e602c",
			TEXT: "#d3af86",
			LAUREL: "#889b4a",
			SECRET_RANK_1: "#f14a68",
			SECRET_RANK_2: "#f14a68",
			SECRET_RANK_3: "#dc3958",
			SECRET_RANK_TEXT: "#dc3958",
			NEXT_RANK_BAR: "#dc3958",
			S_RANK_BASE: "#fcac51",
			S_RANK_SHADOW: "#f79a32",
			S_RANK_TEXT: "#d3af86",
			A_RANK_BASE: "#a3B95a",
			A_RANK_SHADOW: "#889b4a",
			A_RANK_TEXT: "#d3af86",
			B_RANK_BASE: "#4c96a8",
			B_RANK_SHADOW: "#418292",
			B_RANK_TEXT: "#d3af86",
			DEFAULT_RANK_BASE: "#8ab1b0",
			DEFAULT_RANK_SHADOW: "#719190",
			DEFAULT_RANK_TEXT: "#d3af86",
		},
	},
};

// ---------------------------------------------------------------------------
// Backward-compatible legacy export
// ---------------------------------------------------------------------------

/**
 * @deprecated Use the canonical `themes` registry instead. Kept so existing
 * streak tests and code that import WATCHDOG continue to work unchanged.
 */
export const WATCHDOG = {
	background: "45,#520806,#021D4A",
	border: "E4E2E2",
	stroke: "E4E2E2",
	ring: "FE428E",
	fire: "EB8C30",
	currStreakNum: "F8D847",
	sideNums: "FE428E",
	currStreakLabel: "F8D847",
	sideLabels: "FE428E",
	dates: "A9FEF7",
	excludeDaysLabel: "A9FEF7",
	bg: "#021D4A",
	fg: "#A9FEF7",
	accent: "#FE428E",
} as const;
