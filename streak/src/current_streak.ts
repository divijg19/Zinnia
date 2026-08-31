// Shared "current date / trailing edge" helpers for the streak engines.
//
// Both the UTC daily engine (stats.ts) and the timezone-aware engine
// (stats_tz.ts) must answer "what is today / where does an ongoing run end?"
// from the *clock* rather than from the last element of the contribution
// array, so that trailing or future cells (e.g. GitHub returning zero-count
// day cells beyond today, or a 72h-stale contributing cache) can never corrupt
// the reported current streak. Keeping this logic in one place prevents the
// daily, weekly and timezone engines from diverging on "today".

/** YYYY-MM-DD day key derived from a Date in UTC. */
export function utcDateKey(d: Date): string {
	return d.toISOString().slice(0, 10);
}

/** Shift a YYYY-MM-DD key by whole days using UTC calendar arithmetic.
 *  Round-tripping through the string key in UTC (never the target timezone)
 *  keeps west-of-UTC zones from double-shifting a local day. */
export function shiftDateKey(key: string, deltaDays: number): string {
	const ms = Date.parse(`${key}T00:00:00Z`);
	return new Date(ms + deltaDays * 86400_000).toISOString().slice(0, 10);
}

/**
 * Resolve the effective "today" and the real (non-future) day rows for streak
 * computation.
 *
 * Use the actual clock (`now`) as the anchor, but never anchor an ongoing run
 * to a day that does not exist in the data: if the data is stale and only
 * reaches an earlier day, the run is judged against that last real day instead
 * of the clock (we cannot see beyond what the upstream returned). Any future
 * cell that slips through is excluded so it can never extend or reset a run.
 */
export function resolveRealDays<T extends { date: string }>(
	days: ReadonlyArray<T>,
	now?: Date,
): { today: string; realDays: T[] } {
	const realToday = utcDateKey(now ?? new Date());
	let today: string | null = null;
	const realDays: T[] = [];
	for (const d of days) {
		if (d.date > realToday) continue;
		realDays.push(d);
		if (today === null || d.date > today) today = d.date;
	}
	return { today: today ?? realToday, realDays };
}

/**
 * Drop any day cell that falls after the real current date (UTC).
 *
 * GitHub can return zero-count day cells for the remainder of the current
 * year (and a stale 72h contributing cache may hold trailing cells). Such
 * future/trailing cells must never reach the streak engines or the cache,
 * otherwise they reset or shift an ongoing run. Call this at every fetch
 * return point before caching.
 */
export function sanitizeToToday<T extends { date: string }>(
	days: ReadonlyArray<T>,
	now?: Date,
): T[] {
	const realToday = utcDateKey(now ?? new Date());
	return days.filter((d) => d.date <= realToday);
}
