import { beforeEach, describe, expect, it, vi } from "vitest";

describe("tokens async fallback behavior", () => {
	beforeEach(() => {
		vi.resetModules();
		delete process.env.UPSTASH_REST_URL;
		delete process.env.UPSTASH_REST_TOKEN;
		delete process.env.ZINNIA_REST_URL;
		delete process.env.ZINNIA_REST_TOKEN;
		(global as any).fetch = undefined;
		// set PATs for sync fallback
		process.env.PAT_1 = "AAA";
		process.env.PAT_2 = "BBB";
		process.env.PAT_3 = "CCC";
	});

	it("falls back to sync getGithubPAT when Upstash INCR fails", async () => {
		// Simulate Upstash REST throwing network error on INCR
		process.env.UPSTASH_REST_URL = "https://upstash.fail";
		process.env.UPSTASH_REST_TOKEN = "tok";

		(global as any).fetch = vi.fn().mockImplementation(async () => {
			throw new Error("network failure");
		});

		const tokens = await import("../../lib/tokens.js");
		// getGithubPATAsync should catch the error and return a sync token
		const t = await tokens.getGithubPATAsync();
		expect(["AAA", "BBB", "CCC"]).toContain(t as string);
	});
});
