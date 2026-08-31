import { describe, expect, test } from "vitest";
import type { Stats } from "../../streak/src/stats.js";
import {
	getContributionStats,
	getWeeklyContributionStats,
} from "../../streak/src/stats.js";

function mapToArray(obj: Record<string, number>) {
	return Object.keys(obj)
		.sort()
		.map((d) => ({ date: d, count: obj[d] }));
}

describe("stats computations", () => {
	test("contributed today", () => {
		const contributions = {
			"2021-04-15": 5,
			"2021-04-16": 3,
			"2021-04-17": 2,
			"2021-04-18": 7,
		};
		const stats = getContributionStats(mapToArray(contributions));
		const expected: Stats = {
			mode: "daily",
			totalContributions: 17,
			firstContribution: "2021-04-15",
			longestStreak: { start: "2021-04-15", end: "2021-04-18", length: 4 },
			currentStreak: { start: "2021-04-15", end: "2021-04-18", length: 4 },
			excludedDays: [],
		};
		expect(stats).toEqual(expected);
	});

	test("missing today", () => {
		const contributions = {
			"2021-04-15": 5,
			"2021-04-16": 3,
			"2021-04-17": 2,
			"2021-04-18": 0,
		};
		const stats = getContributionStats(mapToArray(contributions));
		const expected: Stats = {
			mode: "daily",
			totalContributions: 10,
			firstContribution: "2021-04-15",
			longestStreak: { start: "2021-04-15", end: "2021-04-17", length: 3 },
			currentStreak: { start: "2021-04-15", end: "2021-04-17", length: 3 },
			excludedDays: [],
		};
		expect(stats).toEqual(expected);
	});

	test("missing two days", () => {
		const contributions = {
			"2021-04-15": 5,
			"2021-04-16": 3,
			"2021-04-17": 0,
			"2021-04-18": 0,
		};
		const stats = getContributionStats(mapToArray(contributions));
		const expected: Stats = {
			mode: "daily",
			totalContributions: 8,
			firstContribution: "2021-04-15",
			longestStreak: { start: "2021-04-15", end: "2021-04-16", length: 2 },
			currentStreak: { start: "2021-04-18", end: "2021-04-18", length: 0 },
			excludedDays: [],
		};
		expect(stats).toEqual(expected);
	});

	test("multiple year streak", () => {
		const contributions: Record<string, number> = {};
		for (let i = 369; i >= 0; --i) {
			const d = new Date();
			d.setUTCDate(d.getUTCDate() - i);
			const key = d.toISOString().slice(0, 10);
			contributions[key] = 1;
		}
		const keys = Object.keys(contributions).sort();
		const first = keys[0];
		const last = keys[keys.length - 1];
		const stats = getContributionStats(mapToArray(contributions));
		expect(stats.mode).toBe("daily");
		expect(stats.totalContributions).toBe(370);
		expect(stats.firstContribution).toBe(first);
		expect(stats.longestStreak.length).toBe(370);
		expect(stats.currentStreak.length).toBe(370);
		expect(stats.longestStreak.start).toBe(first);
		expect(stats.longestStreak.end).toBe(last);
	});

	test("future commits handling", () => {
		// A deterministic "now" so the clock-anchored streak is stable.
		const now = new Date("2026-08-26T12:00:00Z");
		const yesterday = new Date("2026-08-25T00:00:00Z")
			.toISOString()
			.slice(0, 10);
		const today = "2026-08-26";
		const tomorrow = "2026-08-27";
		const inTwoDays = "2026-08-28";

		const contributions = {
			[yesterday]: 1,
			[today]: 1,
			[tomorrow]: 1,
			[inTwoDays]: 1,
		};

		const stats = getContributionStats(mapToArray(contributions), [], now);
		// Hardened semantics: rows dated after "now" are ignored for streak and
		// totals, so only yesterday + today count (they can never prematurely
		// extend the run or reset it).
		expect(stats.totalContributions).toBe(2);
		expect(stats.longestStreak.length).toBe(2);
		expect(stats.currentStreak.length).toBe(2);
	});

	test("weekly stats and missing week cases", () => {
		const contributions = {
			"2022-11-12": 5,
			"2022-11-13": 3,
			"2022-11-14": 2,
			"2022-11-15": 0,
			"2022-11-16": 0,
			"2022-11-17": 0,
			"2022-11-18": 0,
			"2022-11-19": 0,
			"2022-11-20": 0,
			"2022-11-21": 1,
		};
		const stats = getWeeklyContributionStats(mapToArray(contributions));
		expect(stats.mode).toBe("weekly");
		expect(stats.totalContributions).toBe(11);
		expect(stats.firstContribution).toBe("2022-11-12");
		expect(stats.longestStreak.length).toBe(3);
	});

	test("exclude days behavior", () => {
		const contributions = {
			"2023-04-12": 1,
			"2023-04-13": 0,
			"2023-04-14": 2,
			"2023-04-15": 0,
			"2023-04-16": 0,
			"2023-04-17": 3,
		};
		const stats = getContributionStats(mapToArray(contributions), [
			"Sun",
			"Sat",
		]);
		expect(stats.totalContributions).toBe(6);
		expect(stats.firstContribution).toBe("2023-04-12");
		expect(stats.longestStreak.length).toBe(4);
		expect(stats.currentStreak.length).toBe(4);
	});
});
