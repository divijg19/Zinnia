import { expect, it } from "vitest";
import { generateOutput } from "../../streak/src/index";
import type { Stats } from "../../streak/src/types_public";

it("generateOutput produces SVG for basic stats", async () => {
	const stats: Stats = {
		mode: "daily",
		totalContributions: 10,
		firstContribution: "2026-01-01",
		longestStreak: { start: "2026-01-01", end: "2026-01-05", length: 5 },
		currentStreak: { start: "2026-01-05", end: "2026-01-05", length: 1 },
	};
	const out = await generateOutput(stats, { type: "svg" });
	expect(out).toBeDefined();
	expect(out.contentType).toBe("image/svg+xml");
	const body = String(out.body);
	expect(body.includes("<svg")).toBe(true);
});
