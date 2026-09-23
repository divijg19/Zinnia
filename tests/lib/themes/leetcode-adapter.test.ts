import { describe, expect, it } from "vitest";
// Legacy LeetCode theme modules — the historical source of truth.
import catppuccinMocha from "../../../leetcode/packages/core/src/theme/catppuccin-mocha.ts";
import chartreuse from "../../../leetcode/packages/core/src/theme/chartreuse.ts";
import dark from "../../../leetcode/packages/core/src/theme/dark.ts";
import forest from "../../../leetcode/packages/core/src/theme/forest.ts";
import light from "../../../leetcode/packages/core/src/theme/light.ts";
import nord from "../../../leetcode/packages/core/src/theme/nord.ts";
import radical from "../../../leetcode/packages/core/src/theme/radical.ts";
import transparent from "../../../leetcode/packages/core/src/theme/transparent.ts";
import unicorn from "../../../leetcode/packages/core/src/theme/unicorn.ts";
import watchdog from "../../../leetcode/packages/core/src/theme/watchdog.ts";
import wtf from "../../../leetcode/packages/core/src/theme/wtf.ts";
import { themes } from "../../../lib/themes";
import { toLeetCodeTheme } from "../../../lib/themes/adapters/leetcode";

const legacyThemes: Record<string, unknown> = {
	"catppuccin-mocha": catppuccinMocha,
	chartreuse,
	dark,
	forest,
	light,
	nord,
	radical,
	transparent,
	unicorn,
	watchdog,
	wtf,
};

describe("lib/themes/adapters/leetcode", () => {
	it("exposes every legacy leetcode theme in the canonical registry", () => {
		for (const name of Object.keys(legacyThemes)) {
			expect(themes[name], `theme '${name}' present in registry`).toBeDefined();
		}
	});

	it("reproduces every legacy leetcode theme palette + css exactly", () => {
		for (const [name, legacyTheme] of Object.entries(legacyThemes)) {
			const registryTheme = themes[name];
			expect(
				registryTheme,
				`theme '${name}' present in registry`,
			).toBeDefined();
			const adapted = toLeetCodeTheme(registryTheme);
			expect(adapted.palette, `${name}.palette`).toEqual(
				(legacyTheme as { palette: unknown }).palette,
			);
			expect(adapted.css, `${name}.css`).toBe(
				(legacyTheme as { css: string }).css,
			);
		}
	});

	it("pads bg/text palettes to 4 entries like the legacy _theme.ts helper", () => {
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
