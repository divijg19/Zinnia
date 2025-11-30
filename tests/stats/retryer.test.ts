import { describe, expect, it, vi } from "vitest";
import {
	type FetcherFunction,
	RETRIES,
	retryer,
} from "../../stats/src/common/retryer";
import { logger } from "../../stats/src/common/utils";

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
			expect(fetcherFail).toHaveBeenCalledTimes(RETRIES + 1);
			expect(err.message).toBe("Downtime due to GitHub API rate limiting");
		}
	});
});
