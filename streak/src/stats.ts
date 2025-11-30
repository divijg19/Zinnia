import type { ContributionDay } from "./types.js";

export type Stats = {
	mode: string;
	totalContributions: number;
	firstContribution: string;
	longestStreak: { start: string; end: string; length: number };
	currentStreak: { start: string; end: string; length: number };
	excludedDays?: string[];
};

function getPreviousSunday(date: string): string {
	const d = new Date(`${date}T00:00:00Z`);
	const day = d.getUTCDay();
	d.setUTCDate(d.getUTCDate() - day);
	return d.toISOString().slice(0, 10);
}

export function normalizeDays(days: string[]): string[] {
	return days
		.map((d) => (d || "").toString().trim())
		.map((d) => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase())
		.map((d) => d.slice(0, 3))
		.filter((d) =>
			["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].includes(d),
		);
}

function isExcludedDay(date: string, excludedDays: string[]): boolean {
	if (!excludedDays || excludedDays.length === 0) return false;
	const dow = new Date(`${date}T00:00:00Z`).toUTCString().slice(0, 3);
	return excludedDays.includes(dow);
}

export function getContributionStats(
	days: ContributionDay[],
	excludedDays: string[] = [],
): Stats {
	if (!days || days.length === 0) throw new Error("No contributions found.");
	// days expected sorted ascending
	const last = days[days.length - 1];
	const firstItem = days[0];
	if (!last || !firstItem) throw new Error("No contributions found.");
	const today = last.date;
	const first = firstItem.date;

	const excludedNormalized = normalizeDays(excludedDays || []);

	let totalContributions = 0;
	let longest = { start: first, end: first, length: 0 };
	let current = { start: first, end: first, length: 0 };

	for (const { date, count } of days) {
		totalContributions += count;
		const excluded = isExcludedDay(date, excludedNormalized);
		if (count > 0 || (current.length > 0 && excluded)) {
			current.length = current.length + 1;
			current.end = date;
			if (current.length === 1) current.start = date;
			if (!current.start) current.start = date;
			if (current.length > longest.length) {
				longest = { ...current };
			}
		} else if (date !== today) {
			current = { start: today, end: today, length: 0 };
		}
	}

	return {
		mode: "daily",
		totalContributions,
		firstContribution: first,
		longestStreak: longest,
		currentStreak: current,
		excludedDays: excludedNormalized,
	};
}

export function getWeeklyContributionStats(days: ContributionDay[]): Stats {
	if (!days || days.length === 0) throw new Error("No contributions found.");
	const lastItem = days[days.length - 1];
	if (!lastItem) throw new Error("No contributions found.");
	const thisWeek = getPreviousSunday(lastItem.date);
	const firstItem = days[0];
	if (!firstItem) throw new Error("No contributions found.");
	const first = firstItem.date;
	const firstWeek = getPreviousSunday(first);

	const stats: Stats = {
		mode: "weekly",
		totalContributions: 0,
		firstContribution: "",
		longestStreak: { start: firstWeek, end: firstWeek, length: 0 },
		currentStreak: { start: firstWeek, end: firstWeek, length: 0 },
	} as Stats;

	const weeks: Record<string, number> = {};
	for (const { date, count } of days) {
		const week = getPreviousSunday(date);
		if (!weeks[week]) weeks[week] = 0;
		const c = typeof count === "number" ? count : 0;
		if (c > 0) {
			weeks[week] += c;
			if (!stats.firstContribution) stats.firstContribution = date;
		}
	}

	for (const week of Object.keys(weeks).sort()) {
		const count = weeks[week] || 0;
		stats.totalContributions += count;
		if (count > 0) {
			stats.currentStreak.length++;
			stats.currentStreak.end = week;
			if (stats.currentStreak.length === 1) stats.currentStreak.start = week;
			if (stats.currentStreak.length > stats.longestStreak.length) {
				stats.longestStreak.start = stats.currentStreak.start;
				stats.longestStreak.end = stats.currentStreak.end;
				stats.longestStreak.length = stats.currentStreak.length;
			}
		} else if (week !== thisWeek) {
			stats.currentStreak.length = 0;
			stats.currentStreak.start = thisWeek;
			stats.currentStreak.end = thisWeek;
		}
	}

	return stats;
}
