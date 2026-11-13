// Shared "current date / trailing edge" helpers for the streak engines.
//
// The daily (stats.ts) and weekly engines must answer "what is today / where
// does an ongoing run end?" from the *clock* rather than from the last element
// of the contribution array, so that trailing or future cells (e.g. GitHub
// returning zero-count day cells beyond today, or a 72h-stale contributing
// cache) can never corrupt the reported current streak. Keeping this logic in
// one place prevents the daily and weekly engines from diverging on "today".
//
// Every key here is built from `Date#toISOString`, i.e. plain UTC calendar
// arithmetic. Locale-formatted output (`Intl.DateTimeFormat#format`) must
// never be parsed as a date: its shape is CLDR data, not an API contract, and
// a runtime with small-ICU data resolves every locale to `en-US`.

/** YYYY-MM-DD day key derived from a Date in UTC. */
export function utcDateKey(d: Date): string {
	return d.toISOString().slice(0, 10);
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
