import { describe, expect, it } from "vitest";
import { WATCHDOG } from "../../lib/themes.js";
import { generateCard } from "../../streak/src/card.js";
import type { Stats } from "../../streak/src/types_public";

const baseStats: Stats = {
	mode: "daily",
	totalContributions: 0,
	firstContribution: "2020-01-01",
	longestStreak: { start: "2020-01-01", end: "2020-01-01", length: 0 },
	currentStreak: { start: "2020-01-01", end: "2020-01-01", length: 0 },
};

describe("watchdog theme rendering", () => {
	it("emits a linearGradient and url(#bggrad-) using WATCHDOG colors", () => {
		const svg = generateCard(baseStats, { background: WATCHDOG.background });
		expect(svg).toContain("<linearGradient");
		expect(svg).toMatch(/url\(#bggrad-[0-9a-f]+\)/);
		expect(svg).toContain("#520806");
		expect(svg).toContain("#021D4A");
	});
});
