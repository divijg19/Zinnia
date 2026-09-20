import { describe, expect, it } from "vitest";
import { themes } from "../../../lib/themes";

describe("lib/themes/registry curation invariants", () => {
	it("contains essential core themes", () => {
		const coreThemes = [
			"default",
			"dark",
			"light",
			"transparent",
			"highcontrast",
			"watchdog",
			"radical",
			"tokyonight",
			"onedark",
			"dracula",
			"nord",
			"monokai",
			"gruvbox",
			"merko",
		];
		for (const t of coreThemes) {
			expect(themes[t], `core theme '${t}' should be present`).toBeDefined();
		}
	});

	it("maintains canonical registry scale and structure", () => {
		expect(Object.keys(themes).length).toBeGreaterThanOrEqual(90);
	});
});
