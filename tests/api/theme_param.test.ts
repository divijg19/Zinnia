import { describe, expect, it } from "vitest";
import { ALLOWED_THEMES, filterThemeParam } from "../../lib/params";
import { themes } from "../../lib/themes/registry";

/**
 * Every theme the registry knows about must survive the HTTP layer.
 *
 * `ALLOWED_THEMES` was a hand-kept literal of four names, so `?theme=radical`
 * was deleted from the URL by `filterThemeParam` and the card fell back to its
 * default palette. 92 of 96 themes were unreachable in production while every
 * one of them rendered correctly in `demo/`, which reads the registry directly
 * and never goes through this filter. That divergence is why the bug survived:
 * the demo is not exercising the route's theme resolution at all.
 */

function filtered(theme: string): string | null {
	const url = new URL("https://example.test/api/leetcode?username=x");
	url.searchParams.set("theme", theme);
	filterThemeParam(url);
	return url.searchParams.get("theme");
}

describe("theme parameter filtering", () => {
	it("accepts every theme in the registry", () => {
		const names = Object.keys(themes);
		expect(names.length).toBeGreaterThan(4);
		for (const name of names) {
			expect(filtered(name), `'${name}' was rejected`).toBe(name);
		}
	});

	it("keeps the allowlist in step with the registry", () => {
		expect(ALLOWED_THEMES.size).toBe(Object.keys(themes).length);
	});

	it("normalises case and surrounding whitespace", () => {
		expect(filtered("  Radical  ")).toBe("radical");
	});

	it("drops a value where no name is a real theme", () => {
		expect(filtered("bogus")).toBeNull();
		expect(filtered("bogus,also-bogus")).toBeNull();
	});

	it("validates each half of a light/dark pair", () => {
		// A comma previously skipped validation entirely, so a typo in either
		// half reached the renderer unfiltered.
		expect(filtered("radical,bogus")).toBe("radical");
		expect(filtered("bogus,dracula")).toBe("dracula");
		expect(filtered("radical,dracula")).toBe("radical,dracula");
	});

	it("leaves an absent parameter alone", () => {
		const url = new URL("https://example.test/api/leetcode?username=x");
		filterThemeParam(url);
		expect(url.searchParams.get("theme")).toBeNull();
	});
});
