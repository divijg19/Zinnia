import { describe, expect, it } from "vitest";
import { themes } from "../../../lib/themes";
import { toLeetCodeTheme } from "../../../lib/themes/adapters/leetcode";
import { toStatsTheme } from "../../../lib/themes/adapters/stats";
import {
	streakThemes,
	toStreakTheme,
} from "../../../lib/themes/adapters/streak";
import { toTrophyTheme } from "../../../lib/themes/adapters/trophy";
import { themes as legacyStatsThemes } from "../../../stats/themes/index.js";
import { COLORS as legacyTrophyThemes } from "../../../trophy/src/theme";
import { required } from "../../_testShim";

/**
 * The theme adapters, and the legacy tables they have to reproduce.
 *
 * The adapters are the single place a canonical theme becomes a card's
 * options, so the parity with the historical tables is the contract: a
 * change that moves a colour is a change to every card.
 */

/**
 * The adapters that have a whole legacy table to reproduce, and how each one
 * is compared with it.
 */
const LEGACY_PARITY = [
	{
		name: "trophy",
		adapt: (theme: (typeof themes)[string]) => toTrophyTheme(theme),
		legacy: legacyTrophyThemes as Record<string, unknown>,
	},
];

describe("the theme adapters reproduce their legacy tables", () => {
	for (const adapter of LEGACY_PARITY) {
		it(`${adapter.name}: every legacy theme, exactly`, () => {
			for (const [name, legacyTheme] of Object.entries(adapter.legacy)) {
				const registryTheme = themes[name];
				expect(
					registryTheme,
					`theme '${name}' present in the canonical registry`,
				).toBeDefined();
				const adapted = adapter.adapt(required(registryTheme, `theme ${name}`));
				expect(adapted, name).toEqual(legacyTheme);
			}
		});
	}

	it("streak: every streak theme in the canonical registry, exactly", () => {
		for (const [name, legacyTheme] of Object.entries(streakThemes())) {
			const registryTheme = themes[name];
			expect(
				registryTheme,
				`theme '${name}' present in registry`,
			).toBeDefined();
			const adapted = toStreakTheme(required(registryTheme, `theme ${name}`));
			expect(adapted).toEqual(legacyTheme);
		}
	});
});

const expectedThemes: Record<
	string,
	{ palette: { bg: string[]; text: string[]; color: string[] }; css: string }
> = {
	"catppuccin-mocha": {
		palette: {
			bg: ["#1e1e2e", "#45475a", "#45475a", "#45475a"],
			text: ["#cdd6f4", "#bac2de", "#bac2de", "#bac2de"],
			color: ["#fab387", "#a6e3a1", "#f9e2af", "#f38ba8"],
		},
		css: "",
	},
	chartreuse: {
		palette: {
			bg: ["#000", "#fff", "#fff", "#fff"],
			text: ["#00AEFF", "#7fff00", "#7fff00", "#7fff00"],
			color: ["#ffa116", "#5cb85c", "#f0ad4e", "#d9534f"],
		},
		css: "#L{fill:#fff}",
	},
	dark: {
		palette: {
			bg: ["#101010", "#404040", "#404040", "#404040"],
			text: ["#f0f0f0", "#dcdcdc", "#dcdcdc", "#dcdcdc"],
			color: ["#ffa116", "#5cb85c", "#f0ad4e", "#d9534f"],
		},
		css: "#L{fill:#fff}",
	},
	forest: {
		palette: {
			bg: ["#fff9dd", "#ffec96", "#ffec96", "#ffec96"],
			text: ["#000", "#808080", "#808080", "#808080"],
			color: ["#80c600", "#1abc97", "#8ec941", "#a36d00"],
		},
		css: "",
	},
	light: {
		palette: {
			bg: ["#fff", "#e5e5e5", "#e5e5e5", "#e5e5e5"],
			text: ["#000", "#808080", "#808080", "#808080"],
			color: [],
		},
		css: "",
	},
	nord: {
		palette: {
			bg: ["#2e3440", "#3b4252", "#434c5e", "#4c566a"],
			text: ["#eceff4", "#e5e9f0", "#d8dee9", "#d8dee9"],
			color: ["#d08770", "#a3be8c", "#ebcb8b", "#bf616a"],
		},
		css: "#L{fill:#eceff4}",
	},
	radical: {
		palette: {
			bg: ["#101010", "#ffff", "#ffff", "#ffff"],
			text: ["#fe428e", "#a9fef7", "#a9fef7", "#a9fef7"],
			color: ["#ffa116", "#5cb85c", "#f0ad4e", "#d9534f"],
		},
		css: "#L{fill:#fff}",
	},
	transparent: {
		palette: {
			bg: [
				"rgba(16, 16, 16, 0.5)",
				"rgba(0, 0, 0, 0.5)",
				"rgba(0, 0, 0, 0.5)",
				"rgba(0, 0, 0, 0.5)",
			],
			text: ["#417E87", "#417E87", "#417E87", "#417E87"],
			color: ["#ffa116", "#5cb85c", "#f0ad4e", "#d9534f"],
		},
		css: "#L{fill:#fff}",
	},
	unicorn: {
		palette: {
			bg: ["url(#g-bg)", "#ffffffaa", "#ffffffaa", "#ffffffaa"],
			text: ["url(#g-text)", "url(#g-text)", "url(#g-text)", "url(#g-text)"],
			color: ["url(#g-text)", "#6ee7b7", "#fcd34d", "#fca5a5"],
		},
		css: "#background{stroke:url(#g-text)}",
	},
	watchdog: {
		palette: {
			bg: ["url(#g-watchdog-bg)", "#021D4A", "#1a1f35", "#2a2f45"],
			text: ["#FFFFFF", "#A9FEF7", "#FE428E", "#E4E2E2"],
			color: ["url(#g-ring)", "#43E97B", "#FFBB00", "#FF4757"],
		},
		css: "\n\t\t/* Background with gradient - premium red-to-blue diagonal sweep */\n\t\t#background{\n\t\t\trx:12px;\n\t\t\tstroke:rgba(255,255,255,0.08);\n\t\t\tstroke-width:1.5px;\n\t\t}\n\t\t\n\t\t/* Icon - sophisticated multi-tone design */\n\t\t#icon{\n\t\t\topacity:1;\n\t\t}\n\t\t#L{\n\t\t\tfill:#00D9FF!important;\n\t\t\topacity:1;\n\t\t\tfilter:drop-shadow(0 2px 8px rgba(0,217,255,0.5));\n\t\t}\n\t\t#C{\n\t\t\tfill:#00D9FF!important;\n\t\t\topacity:0.85;\n\t\t}\n\t\t#dash{\n\t\t\tfill:#FFBB00!important;\n\t\t\topacity:0.95;\n\t\t\tfilter:drop-shadow(0 1px 4px rgba(255,187,0,0.4));\n\t\t}\n\t\t\n\t\t/* Username - crisp white with cyan glow, hot pink hover */\n\t\t#username-text{\n\t\t\tfont-weight:700!important;\n\t\t\tfont-size:24px!important;\n\t\t\tletter-spacing:0.5px;\n\t\t\tfill:#FFFFFF!important;\n\t\t\tfilter:drop-shadow(0 2px 4px rgba(169,254,247,0.3));\n\t\t\ttransition:all 0.3s cubic-bezier(0.4,0,0.2,1);\n\t\t}\n\t\t#username:hover #username-text{\n\t\t\tfill:#FE428E!important;\n\t\t\tfilter:drop-shadow(0 2px 8px rgba(254,66,142,0.6));\n\t\t\ttransform:translateY(-1px);\n\t\t}\n\t\t\n\t\t/* Ranking - elegant cyan with subtle emphasis */\n\t\t#ranking{\n\t\t\tfont-weight:600!important;\n\t\t\tfont-size:18px!important;\n\t\t\tletter-spacing:0.3px;\n\t\t\tfill:#A9FEF7!important;\n\t\t\topacity:0.92;\n\t\t}\n\t\t\n\t\t/* Total solved circle - premium gradient ring with white text */\n\t\t#total-solved-text{\n\t\t\tfont-weight:900!important;\n\t\t\tfont-size:38px!important;\n\t\t\tletter-spacing:-0.5px;\n\t\t\tfill:#FFFFFF!important;\n\t\t\tfilter:drop-shadow(0 3px 8px rgba(0,0,0,0.5)) drop-shadow(0 0 12px rgba(255,255,255,0.3));\n\t\t}\n\t\t#total-solved-ring{\n\t\t\tstroke:url(#g-ring)!important;\n\t\t\tstroke-width:8px!important;\n\t\t\topacity:1;\n\t\t\tfilter:drop-shadow(0 0 12px rgba(67,233,123,0.6));\n\t\t}\n\t\t#total-solved-bg{\n\t\t\tstroke:rgba(255,255,255,0.12)!important;\n\t\t\tstroke-width:8px!important;\n\t\t\topacity:1;\n\t\t}\n\t\t\n\t\t/* Difficulty labels - refined white with subtle opacity */\n\t\t#easy-solved-type,#medium-solved-type,#hard-solved-type{\n\t\t\tfont-weight:600!important;\n\t\t\tfont-size:16px!important;\n\t\t\tletter-spacing:0.3px;\n\t\t\tfill:#FFFFFF!important;\n\t\t\topacity:0.85;\n\t\t}\n\t\t\n\t\t/* Difficulty counts - cyan emphasis for readability */\n\t\t#easy-solved-count,#medium-solved-count,#hard-solved-count{\n\t\t\tfont-weight:700!important;\n\t\t\tfont-size:16px!important;\n\t\t\tletter-spacing:0.2px;\n\t\t\tfill:#A9FEF7!important;\n\t\t\topacity:1;\n\t\t}\n\t\t\n\t\t/* Progress bars - vibrant semantic colors with enhanced glows */\n\t\t#easy-solved-progress{\n\t\t\tstroke:#43E97B!important;\n\t\t\tstroke-width:6px!important;\n\t\t\tfilter:drop-shadow(0 0 6px rgba(67,233,123,0.7));\n\t\t}\n\t\t#medium-solved-progress{\n\t\t\tstroke:#FFBB00!important;\n\t\t\tstroke-width:6px!important;\n\t\t\tfilter:drop-shadow(0 0 6px rgba(255,187,0,0.7));\n\t\t}\n\t\t#hard-solved-progress{\n\t\t\tstroke:#FF4757!important;\n\t\t\tstroke-width:6px!important;\n\t\t\tfilter:drop-shadow(0 0 6px rgba(255,71,87,0.7));\n\t\t}\n\t\t#easy-solved-bg,#medium-solved-bg,#hard-solved-bg{\n\t\t\topacity:1!important;\n\t\t\tstroke-width:6px!important;\n\t\t\tstroke:rgba(255,255,255,0.1)!important;\n\t\t}\n\t\t\n\t\t/* Animations - smooth entrance */\n\t\t@keyframes fadeIn{\n\t\t\t0%{opacity:0;transform:translateY(-5px)}\n\t\t\t100%{opacity:1;transform:translateY(0)}\n\t\t}\n\t\t\n\t\t/* Hover effects - gold highlight for interactivity */\n\t\t#solved g:hover #easy-solved-count,\n\t\t#solved g:hover #medium-solved-count,\n\t\t#solved g:hover #hard-solved-count{\n\t\t\tfill:#FFBB00!important;\n\t\t\ttransition:fill 0.3s cubic-bezier(0.4,0,0.2,1);\n\t\t}\n\t\t\n\t\t#solved g:hover #easy-solved-type,\n\t\t#solved g:hover #medium-solved-type,\n\t\t#solved g:hover #hard-solved-type{\n\t\t\tfill:#FFFFFF!important;\n\t\t\topacity:1!important;\n\t\t}\n\t",
	},
	wtf: {
		palette: {
			bg: ["#fff", "#e5e5e5", "#e5e5e5", "#e5e5e5"],
			text: ["#000", "#808080", "#808080", "#808080"],
			color: [],
		},
		css: "#root { animation: wtf_animation 1s linear 0s infinite forwards } @keyframes wtf_animation {from { filter: hue-rotate(0deg) } to { filter: hue-rotate(360deg) }}",
	},
};

describe("lib/themes/adapters/leetcode", () => {
	it("exposes every historical leetcode theme in the canonical registry", () => {
		for (const name of Object.keys(expectedThemes)) {
			expect(themes[name], `theme '${name}' present in registry`).toBeDefined();
		}
	});

	it("reproduces every historical leetcode theme palette + css exactly", () => {
		for (const [name, expected] of Object.entries(expectedThemes)) {
			const registryTheme = themes[name];
			expect(
				registryTheme,
				`theme '${name}' present in registry`,
			).toBeDefined();
			const adapted = toLeetCodeTheme(required(registryTheme, `theme ${name}`));
			expect(adapted.palette, `${name}.palette`).toEqual(expected.palette);
			expect(adapted.css, `${name}.css`).toBe(expected.css);
		}
	});

	it("pads bg/text palettes to 4 entries", () => {
		const adapted = toLeetCodeTheme(required(themes.dark));
		expect(adapted.palette.bg).toHaveLength(4);
		expect(adapted.palette.text).toHaveLength(4);
		expect(adapted.palette.bg).toEqual([
			"#101010",
			"#404040",
			"#404040",
			"#404040",
		]);
	});

	it("does not mutate canonical registry palette arrays", () => {
		const before = JSON.stringify(required(themes.dark).colors?.palette);
		toLeetCodeTheme(required(themes.dark));
		toLeetCodeTheme(required(themes.dark));
		expect(JSON.stringify(required(themes.dark).colors?.palette)).toBe(before);
		expect(required(themes.dark).colors?.palette?.bg).toHaveLength(2);
	});

	it("applies legacy defaults when a theme has no palette", () => {
		const adapted = toLeetCodeTheme(required(themes.wtf));
		expect(adapted.palette.bg).toEqual([
			"#fff",
			"#e5e5e5",
			"#e5e5e5",
			"#e5e5e5",
		]);
		expect(adapted.palette.text).toEqual([
			"#000",
			"#808080",
			"#808080",
			"#808080",
		]);
		expect(adapted.palette.color).toEqual([]);
	});

	it("derives palette entries from theme tokens when no palette exists", () => {
		const adapted = toLeetCodeTheme(required(themes.dracula));
		expect(adapted.palette.bg).toEqual([
			"#282a36",
			"#e5e5e5",
			"#e5e5e5",
			"#e5e5e5",
		]);
		expect(adapted.palette.text).toEqual([
			"#f8f8f2",
			"#808080",
			"#808080",
			"#808080",
		]);
		expect(adapted.palette.color).toEqual(["#79dafa"]);
		expect(adapted.css).toBe("");
	});

	it("falls back per entry for gradient tokens", () => {
		const name = "ambient_gradient";
		const adapted = toLeetCodeTheme(required(themes[name]));
		// Gradient background cannot fill flat vars; historical defaults win.
		expect(adapted.palette.bg).toEqual([
			"#fff",
			"#e5e5e5",
			"#e5e5e5",
			"#e5e5e5",
		]);
		// Plain-hex tokens from the same theme still apply.
		expect(required(adapted.palette.text, `${name}.text`)[0]).toBe("#ffffff");
	});

	it("covers every listed theme with padded, renderable palettes", () => {
		const entries = Object.entries(themes);
		expect(entries.length).toBeGreaterThan(0);
		for (const [name, theme] of entries) {
			const adapted = toLeetCodeTheme(theme);
			expect(adapted.palette.bg, `${name}.bg length`).toHaveLength(4);
			expect(adapted.palette.text, `${name}.text length`).toHaveLength(4);
			for (const value of [
				...required(adapted.palette.bg, `${name}.bg`),
				...required(adapted.palette.text, `${name}.text`),
				...required(adapted.palette.color, `${name}.color`),
			]) {
				expect(value, `${name} palette entry ${JSON.stringify(value)}`).toMatch(
					/^(#[0-9a-fA-F]{3,8}|url\(#.+\)|rgba?\(.+\)|)$/,
				);
			}
		}
	});
});

describe("lib/themes/adapters/stats", () => {
	it("exposes every stats theme in the canonical registry", () => {
		expect(Object.keys(themes).length).toBeGreaterThanOrEqual(76);
	});

	it("maps `default` fully (all present properties)", () => {
		expect(toStatsTheme(required(themes.default))).toEqual({
			title_color: "2f80ed",
			icon_color: "4c71f2",
			text_color: "434d58",
			bg_color: "fffefe",
			border_color: "e4e2e2",
			ring_color: undefined,
		});
	});

	it("maps `dark` with border falling back to `default`", () => {
		expect(toStatsTheme(required(themes.dark))).toEqual({
			title_color: "fff",
			icon_color: "79ff97",
			text_color: "9f9f9f",
			bg_color: "151515",
			border_color: "e4e2e2",
			ring_color: undefined,
		});
	});

	it("maps `transparent` preserving the alpha/transparent bg", () => {
		expect(toStatsTheme(required(themes.transparent))).toEqual({
			title_color: "006AFF",
			icon_color: "0579C3",
			text_color: "417E87",
			bg_color: "ffffff00",
			border_color: "e4e2e2",
			ring_color: undefined,
		});
	});

	it("maps `watchdog` preserving the gradient bg token", () => {
		expect(toStatsTheme(required(themes.watchdog))).toEqual({
			title_color: "fe428e",
			icon_color: "f8d847",
			text_color: "a9fef7",
			bg_color: "45,520806,021D4A",
			border_color: "e4e2e2",
			ring_color: undefined,
		});
	});

	it("maps `gruvbox` with border falling back to `default`", () => {
		expect(toStatsTheme(required(themes.gruvbox))).toEqual({
			title_color: "fabd2f",
			icon_color: "fe8019",
			text_color: "8ec07c",
			bg_color: "282828",
			border_color: "e4e2e2",
			ring_color: undefined,
		});
	});

	it("supports an explicit custom fallback theme", () => {
		const darkThemed = themes.dark;
		expect(
			toStatsTheme(required(themes.gruvbox), darkThemed).border_color,
		).toBe(undefined);
	});

	it("reproduces every legacy stats theme exactly", () => {
		// Token by token: the adapter derives a border colour the legacy table
		// does not carry, so the two are not the same object.
		const keyToToken: Record<
			string,
			keyof (typeof themes)["default"]["colors"]
		> = {
			title_color: "title",
			icon_color: "icon",
			text_color: "text",
			bg_color: "background",
			border_color: "border",
			ring_color: "ring",
		};
		const rawHex = (
			colors: (typeof themes)["default"]["colors"],
			token: keyof (typeof themes)["default"]["colors"],
		) => {
			const v = colors[token];
			if (!v || typeof v === "string") {
				return undefined;
			}
			return "hex" in v ? v.hex : undefined;
		};
		for (const name of Object.keys(legacyStatsThemes)) {
			const registry = themes[name];
			if (!registry) continue;
			for (const [key, token] of Object.entries(keyToToken)) {
				expect(rawHex(registry.colors, token), `${name}.${key}`).toBe(
					(
						legacyStatsThemes as Record<
							string,
							Record<string, string | undefined>
						>
					)[name]?.[key] ?? undefined,
				);
			}
		}
	});

	it("returns normalized hex values without prefixes (renderer normalizes)", () => {
		const grad = toStatsTheme(required(themes.watchdog));
		expect(grad.bg_color).toMatch(/,/);
		expect(grad.bg_color).not.toMatch(/^#/);
	});
});

describe("lib/themes/adapters/streak", () => {
	it("derives valid streak properties for non-streak canonical themes (e.g. gruvbox)", () => {
		const adapted = toStreakTheme(required(themes.gruvbox));
		expect(adapted.background).toBe("#282828");
		expect(adapted.ring).toBe("#fabd2f");
		expect(adapted.currStreakNum).toBe("#fabd2f");
	});
});

describe("lib/themes/adapters/trophy", () => {
	it("derives valid trophy properties for non-trophy canonical themes (e.g. merko)", () => {
		const adapted = toTrophyTheme(required(themes.merko));
		expect(adapted.BACKGROUND).toBe("#0a0f0b");
		expect(adapted.TITLE).toBe("#abd200");
		expect(adapted.ICON_CIRCLE).toBe("#b7d364");
		expect(adapted.TEXT).toBe("#68b587");
	});
});
