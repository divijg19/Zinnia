import { describe, expect, it } from "vitest";

import { getContributionStats } from "../../streak/src/stats.ts";

// Regression evidence for the production undercount report: a streak that
// truly started 2025-08-16 and runs through 2026-08-26 is 376 days. The
// legacy upstream engine clipped this to ~367 via its rolling one-year
// calendar window; the local engine must compute the full run.
function buildRun(
	start: string,
	end: string,
): Array<{
	date: string;
	count: number;
}> {
	const out: Array<{ date: string; count: number }> = [];
	let cursor = new Date(`${start}T00:00:00Z`);
	const stop = new Date(`${end}T00:00:00Z`);
	while (cursor.getTime() <= stop.getTime()) {
		out.push({ date: cursor.toISOString().slice(0, 10), count: 1 });
		cursor = new Date(cursor.getTime() + 86_400_000);
	}
	return out;
}

describe("getContributionStats long current streak (no window clipping)", () => {
	it("computes a 376-day streak starting 2025-08-16 through 2026-08-26", () => {
		const days = buildRun("2025-08-16", "2026-08-26");
		expect(days).toHaveLength(376);

		const stats = getContributionStats(days);
		expect(stats.currentStreak.length).toBe(376);
		expect(stats.currentStreak.start).toBe("2025-08-16");
		expect(stats.currentStreak.end).toBe("2026-08-26");
		expect(stats.longestStreak.length).toBe(376);
	});

	it("keeps the full run when today has zero contributions", () => {
		const withZeroToday = [
			...buildRun("2025-08-16", "2026-08-25"),
			{ date: "2026-08-26", count: 0 },
		];
		const stats = getContributionStats(withZeroToday);
		expect(stats.currentStreak.length).toBe(375);
		expect(stats.currentStreak.end).toBe("2026-08-25");
	});
});
