import { describe, expect, it } from "vitest";
import type { ThemeColors } from "../../../lib/themes/registry";
import {
	normalizeColor,
	resolveWithFallback,
	tokenHex,
} from "../../../lib/themes/tokens";

describe("lib/themes/tokens", () => {
	it("tokenHex reads string, hex-struct, and gradient forms", () => {
		// `ColorToken` is typed as `{ hex: string }` and no theme uses the raw
		// string form, but `tokenHex` handles it defensively (as its docs
		// describe), so that branch is pinned here explicitly.
		expect(
			tokenHex({ title: "abc123" } as unknown as ThemeColors, "title"),
		).toBe("abc123");
		expect(tokenHex({ title: { hex: "abc123" } }, "title")).toBe("abc123");
		expect(
			tokenHex(
				{ background: { type: "linear", angle: 35, stops: [{ hex: "a" }] } },
				"background",
			),
		).toBe("35,a");
		expect(tokenHex({}, "title")).toBeUndefined();
		expect(tokenHex(undefined, "title")).toBeUndefined();
	});

	it("normalizeColor prefixes bare hex and gates url/named forms", () => {
		expect(normalizeColor("abc123")).toBe("#abc123");
		expect(normalizeColor("#abc123")).toBe("#abc123");
		expect(normalizeColor("35,a,b")).toBe("35,a,b");
		expect(normalizeColor("transparent")).toBe("transparent");
		expect(normalizeColor("url(#g)")).toBe("url(#g)");
		expect(normalizeColor("url(#g)", { allowUrl: true })).toBe("url(#g)");
		expect(normalizeColor("red")).toBe("red");
		expect(normalizeColor("red", { allowNamed: true })).toBe("red");
		expect(normalizeColor("")).toBeUndefined();
		expect(normalizeColor(undefined)).toBeUndefined();
	});

	it("resolveWithFallback walks override, tokens, fallback in order", () => {
		const fmt = (v: string | undefined) => v?.toUpperCase();
		const tokens = (names: string[]) =>
			Object.fromEntries(names.map((n) => [n, { hex: `${n}-hex` }]));
		// Selected override wins.
		expect(
			resolveWithFallback(
				{ background: "own" },
				{},
				{},
				{},
				"background",
				["background"],
				fmt,
			),
		).toBe("OWN");
		// Then selected tokens in order.
		expect(
			resolveWithFallback(
				{},
				tokens(["border", "background"]),
				{},
				{},
				"background",
				["background", "border"],
				fmt,
			),
		).toBe("BACKGROUND-HEX");
		// Then fallback override, then fallback tokens.
		expect(
			resolveWithFallback(
				{},
				{},
				{ background: "fb" },
				tokens(["background"]),
				"background",
				["background"],
				fmt,
			),
		).toBe("FB");
		expect(
			resolveWithFallback(
				{},
				{},
				{},
				tokens(["background"]),
				"background",
				["background"],
				fmt,
			),
		).toBe("BACKGROUND-HEX");
		// Nothing anywhere.
		expect(resolveWithFallback({}, {}, {}, {}, "x", ["background"], fmt)).toBe(
			undefined,
		);
	});
});
