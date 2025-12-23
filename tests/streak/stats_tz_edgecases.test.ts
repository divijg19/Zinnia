import { computeStreaks } from "../../streak/src/stats_tz";

describe("computeStreaks edge cases (timezone / today handling)", () => {
	it("includes today when contribution exists", () => {
		const tz = "UTC";
		const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
		const days = [{ date: today, count: 1 }];
		const s = computeStreaks(days, tz);
		expect(s.currentStreak).toBe(1);
		expect(s.currentStreakEnd).toBe(today);
	});

	it("does not include today when no contribution but counts yesterday run", () => {
		const tz = "UTC";
		const today = new Date();
		const yesterday = new Date(today.getTime() - 86400_000)
			.toISOString()
			.slice(0, 10);
		const days = [{ date: yesterday, count: 2 }];
		const s = computeStreaks(days, tz);
		expect(s.currentStreak).toBe(1);
		expect(s.currentStreakEnd).toBe(yesterday);
	});

	it("handles timezone where local date differs from UTC", () => {
		// Build a contribution day which in UTC is the prior day but in Asia/Tokyo
		// it's the next day. We expect local computation to reflect the timezone.
		const tz = "Asia/Tokyo";
		// Use a UTC date late in day so Tokyo is next calendar day
		const utcDate = new Date(Date.UTC(2025, 0, 1, 23, 30));
		const iso = utcDate.toISOString().slice(0, 10);
		const days = [{ date: iso, count: 1 }];
		const s = computeStreaks(days, tz);
		// In Tokyo the contribution should map to 2025-01-02 local day
		const tokyoKey = new Intl.DateTimeFormat("en-CA", {
			timeZone: tz,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(utcDate);
		expect(s.daysWithContrib.has(tokyoKey)).toBe(true);
	});
});
