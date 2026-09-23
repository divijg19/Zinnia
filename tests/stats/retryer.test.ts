import { describe, expect, it, vi } from "vitest";
import {
	backoffMs,
	type FetcherFunction,
	RETRIES,
	retryer,
} from "../../stats/src/common/retryer";
import { logger } from "../../stats/src/common/utils";

// Never load ambient credentials: rotation budgets must be deterministic
// (phantom slots) regardless of the developer's .env.
vi.mock("dotenv", () => ({ config: () => ({}) }));

vi.mock("../../lib/tokens", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../../lib/tokens")>();
	return { ...actual, markPatExhaustedAsync: vi.fn() };
});

const fetcher = vi.fn((variables: any, token: any) => {
	logger.log(variables, token);
	return Promise.resolve({ data: "ok" });
});

const fetcherFail = vi.fn(() => {
	return Promise.resolve({ data: { errors: [{ type: "RATE_LIMITED" }] } });
});

const fetcherFailOnSecondTry = vi.fn((_vars: any, _token: any, retries = 0) => {
	return new Promise((res) => {
		if (retries < 1) {
			return res({ data: { errors: [{ type: "RATE_LIMITED" }] } });
		}
		return res({ data: "ok" });
	});
});

const fetcherFailWithMessageBasedRateLimitErr = vi.fn(
	(_vars: any, _token: any, retries = 0) => {
		return new Promise((res) => {
			if (retries < 1) {
				return res({
					data: {
						errors: [
							{
								type: "ASDF",
								message: "API rate limit already exceeded for user ID 11111111",
							},
						],
					},
				});
			}
			return res({ data: "ok" });
		});
	},
);

describe("Retryer (vitest)", () => {
	it("returns value and has zero retries on first try", async () => {
		const res = await retryer(
			fetcher as unknown as FetcherFunction<any>,
			{} as unknown as Record<string, unknown>,
		);
		expect(fetcher).toHaveBeenCalledTimes(1);
		expect(res).toStrictEqual({ data: "ok" });
	});

	it("retries and succeeds on second try", async () => {
		const res = await retryer(
			fetcherFailOnSecondTry as unknown as FetcherFunction<any>,
			{} as unknown as Record<string, unknown>,
		);
		expect(fetcherFailOnSecondTry).toHaveBeenCalledTimes(2);
		expect(res).toStrictEqual({ data: "ok" });
	});

	it("retries on message-based rate limit and succeeds", async () => {
		const res = await retryer(
			fetcherFailWithMessageBasedRateLimitErr as unknown as FetcherFunction<any>,
			{} as unknown as Record<string, unknown>,
		);
		expect(fetcherFailWithMessageBasedRateLimitErr).toHaveBeenCalledTimes(2);
		expect(res).toStrictEqual({ data: "ok" });
	});

	it("throws when maximum retries reached", async () => {
		try {
			await retryer(
				fetcherFail as unknown as FetcherFunction<any>,
				{} as unknown as Record<string, unknown>,
			);
		} catch (err: any) {
			// Exactly RETRIES attempts: every attempt uses a real configured
			// token slot — no phantom unauthenticated extra call.
			expect(fetcherFail).toHaveBeenCalledTimes(RETRIES);
			expect(err.message).toBe("Downtime due to GitHub API rate limiting");
		}
	});

	it("marks the failed token exhausted on rotation", async () => {
		const tokens = await import("../../lib/tokens");
		const mark = vi.mocked(tokens.markPatExhaustedAsync);
		mark.mockClear();
		await retryer(
			fetcherFailOnSecondTry as unknown as FetcherFunction<any>,
			{} as unknown as Record<string, unknown>,
		);
		expect(mark).toHaveBeenCalledTimes(1);
		expect(mark).toHaveBeenCalledWith("PAT_1");
	});

	it("keeps backoff bounded with jitter", async () => {
		for (let attempt = 0; attempt < 5; attempt++) {
			const ms = backoffMs(attempt);
			expect(ms).toBeGreaterThanOrEqual(Math.min(200 * 2 ** attempt, 2000));
			expect(ms).toBeLessThanOrEqual(Math.min(200 * 2 ** attempt, 2000) + 100);
		}
		expect(backoffMs(100)).toBeLessThanOrEqual(2100);
	});
});
