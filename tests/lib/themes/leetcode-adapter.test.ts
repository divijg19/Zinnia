import { describe, expect, it } from "vitest";
import { themes } from "../../../lib/themes";
import { toLeetCodeTheme } from "../../../lib/themes/adapters/leetcode";

// Historical palettes captured verbatim from the removed legacy fixture
// modules (leetcode/packages/core/src/theme/*.ts completed by _theme.ts).
// The dump was cross-checked against the fixtures before deletion, so these
// literals are the parity proof, not a snapshot of current behavior.
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
			const adapted = toLeetCodeTheme(registryTheme);
			expect(adapted.palette, `${name}.palette`).toEqual(expected.palette);
			expect(adapted.css, `${name}.css`).toBe(expected.css);
		}
	});

	it("pads bg/text palettes to 4 entries", () => {
		const adapted = toLeetCodeTheme(themes.dark);
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
		const before = JSON.stringify(themes.dark.colors?.palette);
		toLeetCodeTheme(themes.dark);
		toLeetCodeTheme(themes.dark);
		expect(JSON.stringify(themes.dark.colors?.palette)).toBe(before);
		expect(themes.dark.colors?.palette?.bg).toHaveLength(2);
	});

	it("applies legacy defaults when a theme has no palette", () => {
		const adapted = toLeetCodeTheme(themes.wtf);
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
		const adapted = toLeetCodeTheme(themes.dracula);
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
		const adapted = toLeetCodeTheme(themes.ambient_gradient);
		// Gradient background cannot fill flat vars; historical defaults win.
		expect(adapted.palette.bg).toEqual([
			"#fff",
			"#e5e5e5",
			"#e5e5e5",
			"#e5e5e5",
		]);
		// Plain-hex tokens from the same theme still apply.
		expect(adapted.palette.text[0]).toBe("#ffffff");
	});

	it("covers every listed theme with padded, renderable palettes", () => {
		const entries = Object.entries(themes);
		expect(entries.length).toBeGreaterThan(0);
		for (const [name, theme] of entries) {
			const adapted = toLeetCodeTheme(theme);
			expect(adapted.palette.bg, `${name}.bg length`).toHaveLength(4);
			expect(adapted.palette.text, `${name}.text length`).toHaveLength(4);
			for (const value of [
				...adapted.palette.bg,
				...adapted.palette.text,
				...adapted.palette.color,
			]) {
				expect(value, `${name} palette entry ${JSON.stringify(value)}`).toMatch(
					/^(#[0-9a-fA-F]{3,8}|url\(#.+\)|rgba?\(.+\)|)$/,
				);
			}
		}
	});
});
