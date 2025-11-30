// Timezone-aware streak calculation helpers
// Place into streak/src/stats_tz.ts

export type ContributionDay = { date: string; count: number };

export type Streaks = {
	currentStreak: number;
	currentStreakStart?: string; // local date key YYYY-MM-DD
	currentStreakEnd?: string; // local date key
	longestStreak: number;
	longestStreakStart?: string;
	longestStreakEnd?: string;
	totalContributions: number;
	daysWithContrib: Set<string>;
};

function toLocalDateKey(isoOrDate: string | Date, timeZone: string): string {
	const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
	const f = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
	return f.format(d);
}

function contributionDayToLocalKey(
	dayIsoUtc: string,
	timeZone: string,
): string {
	// Interpret contribution day as UTC midnight
	const utcMidnight = new Date(`${dayIsoUtc}T00:00:00Z`);
	return toLocalDateKey(utcMidnight, timeZone);
}

function shiftDateKey(
	key: string,
	deltaDays: number,
	timeZone: string,
): string {
	// Parse key as UTC midnight, shift by deltaDays, then format in target tz
	const ms = Date.parse(`${key}T00:00:00Z`);
	const shifted = new Date(ms + deltaDays * 86400_000);
	return toLocalDateKey(shifted, timeZone);
}

export function computeStreaks(
	contributionDays: ContributionDay[],
	timeZone = "UTC",
): Streaks {
	const daysWithContrib = new Set<string>();
	let totalContributions = 0;
	for (const d of contributionDays) {
		const key = contributionDayToLocalKey(d.date, timeZone);
		if (d.count && d.count > 0) {
			daysWithContrib.add(key);
			totalContributions += d.count;
		}
	}

	const todayKey = toLocalDateKey(new Date(), timeZone);

	// current streak: walk backwards from todayKey
	let currentStreak = 0;
	let cursor = todayKey;
	// If there's no data for today but time now in user's tz is before the end of day,
	// we still treat today as possible part of the streak only if there's a contribution.
	while (true) {
		if (daysWithContrib.has(cursor)) {
			currentStreak++;
			cursor = shiftDateKey(cursor, -1, timeZone);
		} else {
			break;
		}
	}
	const currentStreakEnd = currentStreak > 0 ? todayKey : undefined;
	const currentStreakStart =
		currentStreak > 0
			? shiftDateKey(todayKey, 1 - currentStreak, timeZone)
			: undefined;

	// longest streak: scan sorted keys
	const keys = Array.from(daysWithContrib).sort();
	let longestStreak = 0;
	let longestStart: string | undefined;
	let longestEnd: string | undefined;

	let runStart: string | null = null;
	let prevKey: string | null = null;
	let runLen = 0;
	for (const k of keys) {
		if (prevKey === null) {
			runStart = k;
			runLen = 1;
		} else {
			const nextOfPrev = shiftDateKey(prevKey, 1, timeZone);
			if (k === nextOfPrev) {
				runLen++;
			} else {
				if (runLen > longestStreak) {
					longestStreak = runLen;
					longestStart = runStart ?? undefined;
					longestEnd = prevKey ?? undefined;
				}
				runStart = k;
				runLen = 1;
			}
		}
		prevKey = k;
	}
	if (runLen > longestStreak) {
		longestStreak = runLen;
		longestStart = runStart ?? undefined;
		longestEnd = prevKey ?? undefined;
	}

	return {
		currentStreak,
		currentStreakStart,
		currentStreakEnd,
		longestStreak,
		longestStreakStart: longestStart,
		longestStreakEnd: longestEnd,
		totalContributions,
		daysWithContrib,
	};
}
