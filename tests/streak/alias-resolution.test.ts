import { describe, expect, it } from "vitest";
import { themes } from "../../lib/themes";
import { getRequestedTheme } from "../../streak/src/card.js";
import { normalizeThemeName } from "../../streak/src/card_helpers.js";
import { THEMES } from "../../streak/src/themes.js";
import { required } from "../_testShim";

describe("streak normalized alias resolution", () => {
	it("exposes exactly one entry per normalized theme name", () => {
		const seen = new Map<string, string>();
		for (const name of Object.keys(THEMES)) {
			const normalized = normalizeThemeName(name);
			expect(
				seen.get(normalized),
				`duplicate normalized streak theme '${normalized}'`,
			).toBeUndefined();
			seen.set(normalized, name);
		}
	});

	it("resolves the catppuccin collision to the earlier-registered theme", () => {
		const winner = required(THEMES.catppuccin_mocha);
		expect(winner, "trophy catppuccin_mocha exposed").toBeDefined();
		expect(winner.currStreakNum).toBe("#94e2d5");
		expect(THEMES["catppuccin-mocha"]).toBeUndefined();

		const names = Object.keys(themes);
		expect(names.indexOf("catppuccin_mocha")).toBeLessThan(
			names.indexOf("catppuccin-mocha"),
		);
	});

	it("resolves either spelling to the same entry", () => {
		const expected = required(THEMES.catppuccin_mocha);
		for (const spelling of ["catppuccin_mocha", "catppuccin-mocha"]) {
			const actual = getRequestedTheme({ theme: spelling });
			expect(actual.background).toBe(expected.background);
			expect(actual.currStreakNum).toBe(expected.currStreakNum);
			expect(actual.fire).toBe(expected.fire);
		}
	});
});
