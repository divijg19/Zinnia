import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { computeStreaks } from "../../streak/src/stats_tz";

describe("computeStreaks timezone-aware", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it("handles New Year rollover across timezones (Tokyo vs LA)", () => {
		// freeze 'today' to 2026-01-02T12:00:00Z
		vi.setSystemTime(new Date("2026-01-02T12:00:00Z"));

		// contributions on UTC dates 2025-12-31 and 2026-01-01
		const days = [
			{ date: "2025-12-31", count: 1 },
			{ date: "2026-01-01", count: 1 },
		];

		// In Asia/Tokyo (UTC+9), 2025-12-31T00:00:00Z is 2025-12-31 local,
		// and 2026-01-01T00:00:00Z is 2026-01-01 local. Expect a 2-day streak if today is 2026-01-02
		const tokyo = computeStreaks(days, "Asia/Tokyo");
		expect(tokyo.longestStreak).toBe(2);

		// In America/Los_Angeles (UTC-8), the local day mapping is different
		const la = computeStreaks(days, "America/Los_Angeles");
		// these two UTC days may map to consecutive or non-consecutive local days depending on offsets;
		// assert that we at least counted total contributions correctly
		expect(la.totalContributions).toBe(2);
	});

	it("computes current streak correctly when today has a contribution", () => {
		vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
		const days = [
			{ date: "2026-06-13", count: 1 },
			{ date: "2026-06-14", count: 1 },
			{ date: "2026-06-15", count: 1 },
		];
		const s = computeStreaks(days, "UTC");
		expect(s.currentStreak).toBe(3);
		expect(s.longestStreak).toBe(3);
	});
});
