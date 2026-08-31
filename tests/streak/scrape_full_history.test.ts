import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getContributionStats } from "../../streak/src/stats.ts";
import { clearGlobalFetchMock, setGlobalFetchMock } from "../_globalFetchMock";

const tokens = vi.hoisted(() => ({
	getPat: vi.fn(),
	markExhausted: vi.fn(),
}));

vi.mock("../../lib/tokens", () => ({
	getGithubPATWithKeyForServiceAsync: tokens.getPat,
	markPatExhaustedAsync: tokens.markExhausted,
}));

const { fetchContributions } = await import("../../streak/src/fetcher.ts");

function iso(d: Date): string {
	return d.toISOString().slice(0, 10);
}

function* daily(from: string, to: string): Generator<string> {
	const cur = new Date(`${from}T00:00:00Z`);
	const stop = new Date(`${to}T00:00:00Z`);
	while (cur.getTime() <= stop.getTime()) {
		yield iso(cur);
		cur.setUTCDate(cur.getUTCDate() + 1);
	}
}

function suffix(n: number): string {
	if (n >= 11 && n <= 13) return "th";
	switch (n % 10) {
		case 1:
			return "st";
		case 2:
			return "nd";
		case 3:
			return "rd";
		default:
			return "th";
	}
}

function tooltipCountText(isoDate: string, count: number): string {
	const [y, m, d] = isoDate.split("-").map(Number);
	const month = new Date(Date.UTC(y, m - 1, d)).toLocaleString("en-US", {
		month: "long",
		timeZone: "UTC",
	});
	const day = `${d}${suffix(d)}`;
	return count > 0
		? `${count} contribution${count === 1 ? "" : "s"} on ${month} ${day}.`
		: `No contributions on ${month} ${day}.`;
}

function contributionDay(isoDate: string, count: number, ix: number): string {
	const level = count === 0 ? "0" : "2";
	return [
		`<td tabindex="0" data-ix="${ix}" aria-selected="false"`,
		`aria-describedby="contribution-graph-legend-level-${level}"`,
		`style="width: 10px" data-date="${isoDate}" id="contribution-day-component-0-${ix}"`,
		`data-level="${level}" role="gridcell" data-view-component="true" class="ContributionCalendar-day"></td>`,
		`<tool-tip style="pointer-events: none;" id="tooltip-probe-${ix}"`,
		`for="contribution-day-component-0-${ix}" data-view-component="true">${tooltipCountText(isoDate, count)}</tool-tip>`,
	].join(" ");
}

function calendarPage(fromDate: string, toDate: string, active: Set<string>) {
	const cells: string[] = [];
	let ix = 0;
	for (const d of daily(fromDate, toDate)) {
		cells.push(contributionDay(d, active.has(d) ? 1 : 0, ix++));
	}
	return `<div class="ContributionCalendar">${cells.join("\n  ")}</div>`;
}

function uniqueUsername(): string {
	return `scrape-full-history-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

describe("streak fetchContributions scrape full-history (no PAT)", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-08-26T12:00:00Z"));
		tokens.getPat.mockResolvedValue(undefined);
		tokens.markExhausted.mockResolvedValue(undefined);
	});

	afterEach(() => {
		clearGlobalFetchMock();
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	it("recovers a 376-day current streak starting 2025-08-16 from full-year scrape pages", async () => {
		const user = uniqueUsername();
		// True activity: a single 376-day run 2025-08-16 .. 2026-08-26.
		const active = new Set<string>(daily("2025-08-16", "2026-08-26"));

		// GitHub exposes only a trailing ~1-year window on the bare page.
		const bare = calendarPage("2025-08-24", "2026-08-26", active);
		const year2025 = calendarPage("2025-01-01", "2025-12-31", active);
		const year2026 = calendarPage("2026-01-01", "2026-12-31", active);

		const fetchMock = vi.fn(async (input: unknown) => {
			const url = String(input);
			if (url.includes("api.github.com/users/")) {
				return {
					ok: true,
					status: 200,
					json: async () => ({ created_at: "2025-08-16T00:00:00Z" }),
					text: async () =>
						JSON.stringify({ created_at: "2025-08-16T00:00:00Z" }),
				};
			}
			if (url.includes("contributions?from=2025-"))
				return { ok: true, status: 200, text: async () => year2025 };
			if (url.includes("contributions?from=2026-"))
				return { ok: true, status: 200, text: async () => year2026 };
			if (url.includes("contributions"))
				return { ok: true, status: 200, text: async () => bare };
			throw new Error(`unexpected fetch: ${url}`);
		});
		setGlobalFetchMock(fetchMock);

		const days = await fetchContributions(user);
		const stats = getContributionStats(days);

		expect(stats.currentStreak.start).toBe("2025-08-16");
		expect(stats.currentStreak.end).toBe("2026-08-26");
		expect(stats.currentStreak.length).toBe(376);
		// The scraper must request both full years, not just the bare page.
		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining("contributions?from=2025-"),
		);
		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining("contributions?from=2026-"),
		);
	});

	it("drops future zero cells from the current-year page so the run is not clipped", async () => {
		const user = uniqueUsername();
		const active = new Set<string>(daily("2025-08-16", "2026-08-26"));

		// Current-year page includes future zero cells (Sep..Dec 2026) that
		// must be filtered or the trailing zeros reset the current streak.
		const week2025 = calendarPage("2025-01-01", "2025-12-31", active);
		const week2026 = calendarPage("2026-01-01", "2026-12-31", active);
		const bare = calendarPage("2025-08-24", "2026-08-26", active);

		setGlobalFetchMock(
			vi.fn(async (input: unknown) => {
				const url = String(input);
				if (url.includes("api.github.com/users/")) {
					return {
						ok: true,
						status: 200,
						json: async () => ({ created_at: "2025-08-16T00:00:00Z" }),
						text: async () => "{}",
					};
				}
				if (url.includes("contributions?from=2025-"))
					return { ok: true, status: 200, text: async () => week2025 };
				if (url.includes("contributions?from=2026-"))
					return { ok: true, status: 200, text: async () => week2026 };
				if (url.includes("contributions"))
					return { ok: true, status: 200, text: async () => bare };
				throw new Error(`unexpected fetch: ${url}`);
			}),
		);

		const days = await fetchContributions(user);
		expect(days[days.length - 1]?.date).toBe("2026-08-26");
		const stats = getContributionStats(days);
		expect(stats.currentStreak.length).toBe(376);
		expect(stats.currentStreak.start).toBe("2025-08-16");
	});

	it("falls back to the trailing bare page when no per-year page is available", async () => {
		const user = uniqueUsername();
		const active = new Set<string>(daily("2025-08-24", "2026-08-26"));
		const bare = calendarPage("2025-08-24", "2026-08-26", active);

		setGlobalFetchMock(
			vi.fn(async (input: unknown) => {
				const url = String(input);
				if (url.includes("api.github.com/users/")) {
					return {
						ok: false,
						status: 403,
						json: async () => ({}),
						text: async () => "{}",
					};
				}
				if (url.includes("contributions?from=")) {
					return { ok: true, status: 200, text: async () => "" };
				}
				if (url.includes("contributions"))
					return { ok: true, status: 200, text: async () => bare };
				throw new Error(`unexpected fetch: ${url}`);
			}),
		);

		const days = await fetchContributions(user);
		expect(days.length).toBeGreaterThan(0);
		const stats = getContributionStats(days);
		// Degraded-but-functional: streak from the available trailing window.
		expect(stats.currentStreak.length).toBeGreaterThan(300);
	});
});
