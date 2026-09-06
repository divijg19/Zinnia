import { describe, expect, it } from "vitest";
import { themes } from "../../../lib/themes";
import { toStatsTheme } from "../../../lib/themes/adapters/stats";
import { themes as legacyStatsThemes } from "../../../stats/themes/index.js";

/**
 * Parity tests: prove the canonical registry + stats adapter reproduce the
 * exact color values consumed by the stats card renderer, and that fallback
 * to the `default` theme behaves identically to the historical getCardColors
 * border fallback.
 */
describe("lib/themes/adapters/stats", () => {
	it("exposes every stats theme in the canonical registry", () => {
		expect(Object.keys(themes).length).toBeGreaterThanOrEqual(76);
	});

	it("maps `default` fully (all present properties)", () => {
		expect(toStatsTheme(themes.default)).toEqual({
			title_color: "2f80ed",
			icon_color: "4c71f2",
			text_color: "434d58",
			bg_color: "fffefe",
			border_color: "e4e2e2",
			ring_color: undefined,
		});
	});

	it("maps `dark` with border falling back to `default`", () => {
		expect(toStatsTheme(themes.dark)).toEqual({
			title_color: "fff",
			icon_color: "79ff97",
			text_color: "9f9f9f",
			bg_color: "151515",
			border_color: "e4e2e2",
			ring_color: undefined,
		});
	});

	it("maps `transparent` preserving the alpha/transparent bg", () => {
		expect(toStatsTheme(themes.transparent)).toEqual({
			title_color: "006AFF",
			icon_color: "0579C3",
			text_color: "417E87",
			bg_color: "ffffff00",
			border_color: "e4e2e2",
			ring_color: undefined,
		});
	});

	it("maps `watchdog` preserving the gradient bg token", () => {
		expect(toStatsTheme(themes.watchdog)).toEqual({
			title_color: "fe428e",
			icon_color: "f8d847",
			text_color: "a9fef7",
			bg_color: "45,520806,021D4A",
			border_color: "e4e2e2",
			ring_color: undefined,
		});
	});

	it("maps `gruvbox` with border falling back to `default`", () => {
		expect(toStatsTheme(themes.gruvbox)).toEqual({
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
		expect(toStatsTheme(themes.gruvbox, darkThemed).border_color).toBe(
			undefined,
		);
	});

	it("returns normalized hex values without prefixes (renderer normalizes)", () => {
		const grad = toStatsTheme(themes.watchdog);
		expect(grad.bg_color).toMatch(/,/);
		expect(grad.bg_color).not.toMatch(/^#/);
	});

	it("reproduces every legacy stats theme exactly", () => {
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
			expect(registry, `theme '${name}' present in registry`).toBeDefined();
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
});
