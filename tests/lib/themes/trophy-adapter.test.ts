import { describe, expect, it } from "vitest";
import { themes } from "../../../lib/themes";
import { toTrophyTheme } from "../../../lib/themes/adapters/trophy";
import { COLORS as legacyTrophyThemes } from "../../../trophy/src/theme";

describe("lib/themes/adapters/trophy", () => {
	it("reproduces every legacy trophy theme exactly (all 26 themes)", () => {
		for (const [name, legacyTheme] of Object.entries(legacyTrophyThemes)) {
			const registryTheme = themes[name];
			expect(
				registryTheme,
				`theme '${name}' present in canonical registry`,
			).toBeDefined();
			const adapted = toTrophyTheme(registryTheme);
			expect(adapted).toEqual(legacyTheme);
		}
	});

	it("derives valid trophy properties for non-trophy canonical themes (e.g. merko)", () => {
		const adapted = toTrophyTheme(themes.merko);
		expect(adapted.BACKGROUND).toBe("#0a0f0b");
		expect(adapted.TITLE).toBe("#abd200");
		expect(adapted.ICON_CIRCLE).toBe("#b7d364");
		expect(adapted.TEXT).toBe("#68b587");
	});
});
