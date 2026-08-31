// Shared fixture builders for streak engine tests.

export type DayCell = { date: string; count: number };

/** Consecutive daily cells, each contributing 1, from `start` to `end`. */
export function buildRun(start: string, end: string): DayCell[] {
	const out: DayCell[] = [];
	let cursor = new Date(`${start}T00:00:00Z`);
	const stop = new Date(`${end}T00:00:00Z`);
	while (cursor.getTime() <= stop.getTime()) {
		out.push({ date: cursor.toISOString().slice(0, 10), count: 1 });
		cursor = new Date(cursor.getTime() + 86_400_000);
	}
	return out;
}

/** Every day in `start`..`end` as a zero-count cell (GitHub returns these for
 *  the remainder of the current year). */
export function buildZeros(start: string, end: string): DayCell[] {
	return buildRun(start, end).map((d) => ({ date: d.date, count: 0 }));
}
