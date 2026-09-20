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
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/**
 * The canonical theme registry. Color values are duplicated from the former
 * `stats/themes/index.js` and `streak/src/themes.ts` so parity with historical
 * renderers is provable by test.
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
	},
	onedark: {
		name: "onedark",
		colors: {
			title: { hex: "e4bf7a" },
			icon: { hex: "8eb573" },
			text: { hex: "df6d74" },
			background: { hex: "282c34" },
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
	},
	apprentice: {
		name: "apprentice",
		colors: {
			title: { hex: "ffffff" },
			icon: { hex: "ffffaf" },
			text: { hex: "bcbcbc" },
			background: { hex: "262626" },
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
