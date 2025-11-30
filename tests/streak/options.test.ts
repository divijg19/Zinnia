import { describe, expect, test } from "vitest";
import {
	formatDate,
	getRequestedTheme,
	normalizeThemeName,
} from "../../streak/src/card.js";
import { THEMES } from "../../streak/src/themes.js";
import type { Params, Theme } from "../../streak/src/types_public.js";

describe("options and themes", () => {
	test("themes return expected colors and gradients generate backgroundGradient", () => {
		const themes = THEMES as unknown as Record<string, Theme>;
		for (const themeName of Object.keys(themes)) {
			const colors = themes[themeName] as Theme;
			const actual = getRequestedTheme({ theme: themeName } as Params);
			const expected: Theme = { ...colors } as Theme;
			if (String(colors.background).includes(",")) {
				expected.background = "url(#gradient)"; // approximate expectation
				expect(actual.backgroundGradient).toMatch(
					/<linearGradient|<radialGradient/,
				);
			}
			delete expected.backgroundGradient;
			if (actual.backgroundGradient) delete actual.backgroundGradient;
			expect(actual).toMatchObject(expected);
		}
	});

	test("fallback to default theme for invalid theme name", () => {
		const params = { theme: "not-a-theme" };
		const actual = getRequestedTheme(params);
		const def = getRequestedTheme({});
		expect(actual.background).toBe(def.background);
	});

	test("valid and invalid color overrides", () => {
		const base = getRequestedTheme({});
		// valid inputs
		const p1 = { background: "f00" };
		const a1 = getRequestedTheme(p1);
		expect(a1.background).toBe("#f00");

		const p2 = { background: "ff0000ff" };
		const a2 = getRequestedTheme(p2);
		expect(a2.background).toBe("#ff0000ff");

		const p3 = { background: "red" };
		const a3 = getRequestedTheme(p3);
		expect(a3.background).toBe("red");

		// invalid inputs should fall back to default
		const p4 = { background: "g00" };
		const a4 = getRequestedTheme(p4);
		expect(a4.background).toBe(base.background);
	});

	test("hide_border toggles border to transparent", () => {
		const t1 = getRequestedTheme({ hide_border: "true" });
		expect(t1.border).toBe("#0000");
		const t2 = getRequestedTheme({ hide_border: "false" });
		const def = getRequestedTheme({});
		expect(t2.border).toBe(def.border);
	});

	test("formatDate formatting behavior for same/different years", () => {
		const year = new Date().getUTCFullYear();
		expect(formatDate(`${year}-04-12`, "M j[, Y]", "en")).toBe("Apr 12");
		expect(formatDate("2000-04-12", "M j[, Y]", "en")).toBe("Apr 12, 2000");
		expect(formatDate("2000-04-12", "Y/m/d", "en")).toBe("2000/04/12");
		expect(formatDate(`${year}-04-12`, "Y/m/d", "en")).toBe(`${year}/04/12`);
	});

	test("normalizeThemeName gives normalized names", () => {
		expect(normalizeThemeName("myTheme")).toBe("mytheme");
		expect(normalizeThemeName("My_Theme")).toBe("my-theme");
		expect(normalizeThemeName("my-theme")).toBe("my-theme");
	});
});
