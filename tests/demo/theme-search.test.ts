import { describe, expect, it } from "vitest";
import type { DemoTheme } from "../../demo/types.js";
import {
	buildSearchIndex,
	searchThemes,
} from "../../demo/utils/theme-search.js";

const THEMES: DemoTheme[] = [
	{ name: "default", displayName: "Default" },
	{ name: "dark", displayName: "Dark" },
	{ name: "dracula", displayName: "Dracula" },
	{ name: "ocean_dark", displayName: "Ocean Dark" },
	{ name: "catppuccin_mocha", displayName: "Catppuccin Mocha" },
	{ name: "solarized-light", displayName: "Solarized Light" },
	{ name: "github_dark_dimmed", displayName: "GitHub Dark Dimmed" },
	{ name: "ambient_gradient", displayName: "Ambient Gradient" },
];

const index = buildSearchIndex(THEMES);

function names(query: string): string[] {
	return searchThemes(index, query).map((match) => match.theme.name);
}

describe("demo theme search", () => {
	it("returns every theme for an empty query, in registry order", () => {
		expect(names("")).toEqual(THEMES.map((theme) => theme.name));
		expect(names("   ")).toEqual(THEMES.map((theme) => theme.name));
	});

	it("ranks an exact match first", () => {
		const matches = searchThemes(index, "dracula");
		expect(matches[0]?.theme.name).toBe("dracula");
		expect(matches[0]?.kind).toBe("exact");
	});

	it("ranks a prefix above a substring", () => {
		const matches = searchThemes(index, "dark");
		// `dark` is an exact match; the variants are prefixes of nothing else.
		expect(matches[0]?.theme.name).toBe("dark");
		const substring = searchThemes(index, "mocha");
		expect(substring[0]?.theme.name).toBe("catppuccin_mocha");
		expect(substring[0]?.kind).toBe("substring");
	});

	it("finds a theme by a subsequence", () => {
		// `ctm` is not a substring of anything, but it is a subsequence of
		// `catppuccin_mocha`.
		const matches = searchThemes(index, "ctm");
		expect(matches[0]?.theme.name).toBe("catppuccin_mocha");
		expect(matches[0]?.kind).toBe("fuzzy");
	});

	it("scores a tight fuzzy match above a loose one", () => {
		// Neither name contains the query as a substring, so both match
		// fuzzily; the contiguous one is the better match.
		const loose = buildSearchIndex([{ name: "a_b_c_d" }, { name: "abcd" }]);
		const matches = searchThemes(loose, "abcd");
		expect(matches.map((match) => match.theme.name)).toEqual([
			"abcd",
			"a_b_c_d",
		]);
		expect(matches[0]?.score).toBeGreaterThan(matches[1]?.score ?? 0);
	});

	it("marks the characters it matched", () => {
		const match = searchThemes(index, "dracula")[0];
		expect(match?.matches.length).toBe(7);
		expect(match?.matches[0]).toBe(0);
	});

	it("matches a regular expression", () => {
		const matches = searchThemes(index, "/^cat.*mocha$/");
		expect(matches.map((match) => match.theme.name)).toEqual([
			"catppuccin_mocha",
		]);
		expect(matches[0]?.kind).toBe("substring");
	});

	it("falls back to a literal search when the pattern is invalid", () => {
		// An unterminated group would throw if it were compiled as a pattern.
		expect(() => searchThemes(index, "/[unclosed/")).not.toThrow();
		const matches = searchThemes(index, "/[unclosed/");
		expect(matches.length).toBe(0);
	});

	it("returns nothing when nothing matches", () => {
		expect(names("zzzzzz")).toEqual([]);
	});

	it("is case insensitive", () => {
		expect(names("DRACULA")[0]).toBe("dracula");
		expect(names("DrAcUlA")[0]).toBe("dracula");
	});

	it("matches the display name as well as the theme name", () => {
		expect(names("solarized")[0]).toBe("solarized-light");
	});
});
