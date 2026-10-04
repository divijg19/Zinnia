import { describe, expect, it } from "vitest";
import { Generator } from "../../leetcode/packages/core/src/card";
import { AnimationExtension } from "../../leetcode/packages/core/src/exts/animation";
import { FontExtension } from "../../leetcode/packages/core/src/exts/font";
import { ThemeExtension } from "../../leetcode/packages/core/src/exts/theme";
import { toLeetCodeTheme } from "../../lib/themes/adapters/leetcode";
import { themes } from "../../lib/themes/registry";

/**
 * The LeetCode card rendered wrongly on the live embed while `demo/` - which
 * renders the same core from source with the same theme names - looked perfect.
 * The demo never goes through the route, so it never exercised any of this.
 *
 * Two defects made the difference visible:
 *
 *  - `card.ts` deleted `theme-ext-light` / `theme-ext-dark` before rendering,
 *    on the grounds that "media query themes are not yet supported in defs".
 *    The CSS pushed by those extensions still referenced `url(#...)`, so a
 *    gradient background resolved to nothing and rendered flat.
 *  - Nothing reset `Item`'s module-global auto-id counter or rebuilt the shared
 *    `THEME_EXTENDS` items, so no two renders were byte-identical.
 */

const FIXTURE = {
	profile: {
		username: "testuser",
		realname: "Test User",
		about: "",
		avatar: "",
		skills: [],
		country: "",
	},
	problem: {
		easy: { solved: 300, total: 700 },
		medium: { solved: 200, total: 500 },
		hard: { solved: 50, total: 200 },
		ranking: 123456,
	},
	submissions: [],
};

class FixtureGenerator extends Generator {
	public override async fetch() {
		return structuredClone(FIXTURE);
	}
}

async function render(theme: string | { light: string; dark: string }) {
	const generator = new FixtureGenerator();
	return generator.generate({
		username: "testuser",
		site: "us",
		width: 500,
		height: 200,
		css: [],
		extensions: [FontExtension, AnimationExtension, ThemeExtension],
		animation: true,
		font: "baloo_2",
		theme,
	});
}

/** Every `url(#id)` the card references. */
function referenced(svg: string): string[] {
	return [...svg.matchAll(/url\(#([\w-]+)\)/g)].map((m) => m[1] as string);
}

/** Every gradient `<defs>` id the card defines. */
function defined(svg: string): string[] {
	return [
		...svg.matchAll(/<(?:linearGradient|radialGradient)[^>]*id="([\w-]+)"/g),
	].map((m) => m[1] as string);
}

const NAMES = Object.keys(themes);

describe("leetcode renderer resolves every gradient it references", () => {
	it.each(NAMES)(
		"single theme %s has no dangling gradient reference",
		async (name) => {
			const svg = await render(name);
			const missing = referenced(svg).filter(
				(id) => !defined(svg).includes(id),
			);
			expect(
				missing,
				`'${name}' references undefined ${missing.join(", ")}`,
			).toEqual([]);
		},
	);

	it.each(NAMES)(
		"dual theme %s has no dangling gradient reference",
		async (name) => {
			const svg = await render({ light: name, dark: name });
			const missing = referenced(svg).filter(
				(id) => !defined(svg).includes(id),
			);
			expect(
				missing,
				`'${name}' references undefined ${missing.join(", ")}`,
			).toEqual([]);
		},
	);

	it("defines gradients exactly once when both halves are the same theme", async () => {
		const svg = await render({ light: "unicorn", dark: "unicorn" });
		const ids = defined(svg);
		expect(ids.length).toBeGreaterThan(0);
		expect(new Set(ids).size, `duplicate gradient ids: ${ids.join(", ")}`).toBe(
			ids.length,
		);
	});

	it("emits defs for both halves of a mixed dual theme", async () => {
		const svg = await render({ light: "unicorn", dark: "watchdog" });
		for (const id of ["g-bg", "g-watchdog-bg"]) {
			expect(defined(svg), `missing ${id}`).toContain(id);
		}
	});
});

describe("every registry theme actually reaches the card", () => {
	it.each(NAMES)("%s applies its own palette", async (name) => {
		const svg = await render(name);
		const expected = toLeetCodeTheme(themes[name] as never).palette.bg?.[0];
		expect(expected, `'${name}' has no bg palette`).toBeTruthy();
		// `--bg-0` is declared twice: once as the unstyled default and once by the
		// theme extension. If the theme never applied, only the default survives.
		const declarations = [...svg.matchAll(/--bg-0:([^;]*)/g)].map((m) =>
			(m[1] as string).trim(),
		);
		expect(declarations.length).toBeGreaterThan(1);
		expect(declarations).toContain(expected);
	});
});

describe("leetcode renderer output is deterministic", () => {
	it.each([
		"watchdog",
		"unicorn",
		"radical",
		{ light: "unicorn", dark: "watchdog" },
	])("renders %s byte-identically every time", async (theme) => {
		const first = await render(theme);
		const second = await render(theme);
		const third = await render(theme);
		expect(second).toBe(first);
		expect(third).toBe(first);
	});

	it("names the ring keyframe from the selector, not a random number", async () => {
		const svg = await render("watchdog");
		expect(svg).toContain("@keyframes circle_total-solved-ring");
		expect(svg).not.toMatch(/circle_\d/);
	});

	it("emits no duplicate element ids", async () => {
		const svg = await render({ light: "unicorn", dark: "watchdog" });
		const ids = [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1] as string);
		expect(ids.length - new Set(ids).size).toBe(0);
	});
});
