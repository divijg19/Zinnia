import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCard } from "../../scripts/lib/embed-contract";

/**
 * A retry is only a retry if it reaches the origin again. Error cards carry a
 * 60s shared-cache lifetime, so reusing the cache-busted URL measured 17ms on
 * the second attempt - the cached error card, not a fresh render. These tests
 * pin both the fresh URL per attempt and the diagnostics the old code dropped.
 */

type FakeResponse = {
	status: number;
	headers: { get(name: string): string | null };
	text(): Promise<string>;
};

const HEALTHY_SVG =
	'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="100" viewBox="0 0 600 100"></svg>';
const ERROR_SVG =
	'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" viewBox="0 0 600 60"><text>oops</text></svg>\n<!-- ZINNIA_ERR:STATS_INTERNAL -->';

function response(body: string, cacheStatus = "miss"): FakeResponse {
	const headers = new Map<string, string>([
		["content-type", "image/svg+xml; charset=utf-8"],
		["etag", '"abc"'],
		["cache-control", "public, max-age=86400"],
		["x-cache-status", cacheStatus],
	]);
	return {
		status: 200,
		headers: { get: (name) => headers.get(name.toLowerCase()) ?? null },
		text: async () => body,
	};
}

const healthy = () => response(HEALTHY_SVG);
const errorCard = () => response(ERROR_SVG, "transient");

/** Stub fetch with a queue of responses; returns the URLs it was called with. */
function mockFetch(responses: FakeResponse[]): string[] {
	const calls: string[] = [];
	const last = responses[responses.length - 1] ?? healthy();
	vi.stubGlobal(
		"fetch",
		vi.fn(async (url: string) => {
			calls.push(String(url));
			return responses.shift() ?? last;
		}),
	);
	return calls;
}

const CARD_URL = "https://cards.test/api/stats?username=divijg19&_cb=first";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("fetchCard retries", () => {
	it("uses a fresh cache-buster for every retry and stops on a healthy card", async () => {
		const calls = mockFetch([errorCard(), errorCard(), healthy()]);

		const result = await fetchCard(CARD_URL, 5000, 2);

		expect(calls).toHaveLength(3);
		expect(calls[0]).toBe(CARD_URL);
		expect(new Set(calls).size).toBe(3);
		for (const call of calls) {
			expect(new URL(call).searchParams.get("_cb")).toBeTruthy();
		}
		expect(result.attempts).toBe(3);
		expect(result.problems).toEqual([]);
		expect(result.history).toHaveLength(3);
		expect(result.history[0]?.problems).toContain(
			"error card (ZINNIA_ERR marker)",
		);
		expect(result.history[2]?.problems).toEqual([]);
	});

	it("keeps every failed attempt's diagnostic when none recovers", async () => {
		mockFetch([errorCard()]);

		const result = await fetchCard(CARD_URL, 5000, 1);

		expect(result.attempts).toBe(2);
		expect(result.problems).toContain("error card (ZINNIA_ERR marker)");
		expect(result.history).toHaveLength(2);
		for (const attempt of result.history) {
			expect(attempt.problems).toContain("error card (ZINNIA_ERR marker)");
			expect(attempt.cacheStatus).toBe("transient");
		}
	});

	it("does not fetch again after the first healthy response", async () => {
		const calls = mockFetch([healthy()]);

		const result = await fetchCard(CARD_URL, 5000, 2, 1000);

		expect(calls).toHaveLength(1);
		expect(result.attempts).toBe(1);
		expect(result.history).toHaveLength(1);
	});

	it("waits the configured delay before retrying", async () => {
		mockFetch([errorCard(), healthy()]);

		const started = Date.now();
		const result = await fetchCard(CARD_URL, 5000, 1, 25);

		expect(Date.now() - started).toBeGreaterThanOrEqual(20);
		expect(result.attempts).toBe(2);
	});
});
