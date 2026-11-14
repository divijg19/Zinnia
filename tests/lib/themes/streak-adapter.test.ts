import { describe, expect, it } from "vitest";
import { themes } from "../../../lib/themes";
import {
	streakThemes,
	toStreakTheme,
} from "../../../lib/themes/adapters/streak";
import { required } from "../../_testShim";

describe("lib/themes/adapters/streak", () => {
	it("exposes every streak theme in the canonical registry with exact parity", () => {
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

	it("derives valid streak properties for non-streak canonical themes (e.g. gruvbox)", () => {
		const adapted = toStreakTheme(required(themes.gruvbox));
		expect(adapted.background).toBe("#282828");
		expect(adapted.ring).toBe("#fabd2f");
		expect(adapted.currStreakNum).toBe("#fabd2f");
	});
});
