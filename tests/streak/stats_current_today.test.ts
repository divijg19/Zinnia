import { describe, expect, it } from "vitest";
import { sanitizeToToday } from "../../streak/src/current_streak";
import {
	getContributionStats,
	getWeeklyContributionStats,
} from "../../streak/src/stats";
import { buildRun, buildZeros } from "./_helpers.ts";

describe("getContributionStats is clock-anchored and ignores future cells", () => {
	const now = new Date("2026-08-26T12:00:00Z");

	it("recovers a 376-day current streak when GitHub appends future zero cells", () => {
		// Real activity 2025-08-16..2026-08-26, plus zero cells for the rest of
		// the current year (simulating the full-year GraphQL/scrape response).
		const days = [
			...buildRun("2025-08-16", "2026-08-26"),
			...buildZeros("2026-08-27", "2026-12-31"),
		];

		const stats = getContributionStats(days, [], now);
		// Future zero cells must not reset or shorten the ongoing run.
		expect(stats.currentStreak.length).toBe(376);
		expect(stats.currentStreak.start).toBe("2025-08-16");
		expect(stats.currentStreak.end).toBe("2026-08-26");
		expect(stats.longestStreak.length).toBe(376);
	});

	it("treats a trailing zero that is not today as a data-boundary tolerance", () => {
		// Data lags the clock by one day (e.g. stale cache): the last real cell
		// is 2026-08-25 and today (2026-08-26) has no cell at all.
		const yesterday = "2026-08-25";
		const days = buildRun("2025-08-16", yesterday);
		const stats = getContributionStats(days, [], now);
		expect(stats.currentStreak.length).toBe(375);
		expect(stats.currentStreak.end).toBe(yesterday);
	});

	it("ignores future contribution rows so they cannot inflate the streak", () => {
		const days = [
			...buildRun("2026-08-23", "2026-08-26"),
			...buildRun("2026-08-27", "2026-08-29"),
		];
		const stats = getContributionStats(days, [], now);
		expect(stats.currentStreak.length).toBe(4); // 23..26 only
		expect(stats.longestStreak.length).toBe(4);
		expect(stats.totalContributions).toBe(4);
	});
});

describe("sanitizeToToday drops future/trailing cells", () => {
	const now = new Date("2026-08-26T12:00:00Z");

	it("keeps rows up to and including today", () => {
		const days = [
			...buildRun("2026-08-20", "2026-08-26"),
			...buildRun("2026-08-27", "2026-08-29"),
		];
		const clean = sanitizeToToday(days, now);
		expect(clean[clean.length - 1]?.date).toBe("2026-08-26");
		expect(clean).toHaveLength(7);
	});

	it("stops at the last real day when data lags the clock", () => {
		const days = buildRun("2026-08-20", "2026-08-24");
		const clean = sanitizeToToday(days, now);
		expect(clean[clean.length - 1]?.date).toBe("2026-08-24");
	});
});

describe("getWeeklyContributionStats is clock-anchored", () => {
	const now = new Date("2026-08-26T12:00:00Z");

	it("ignores future weeks so they cannot restart the run", () => {
		// One contributed day in the current week, plus contributed days in a
		// future week that would otherwise be counted as a new run.
		const days = [
			...buildRun("2026-08-23", "2026-08-24"),
			...buildRun("2026-08-30", "2026-08-31"), // future week
		];
		const stats = getWeeklyContributionStats(days, now);
		expect(stats.mode).toBe("weekly");
		expect(stats.totalContributions).toBe(2);
	});
});
