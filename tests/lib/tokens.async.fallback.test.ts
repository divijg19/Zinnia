import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	clearGlobalFetchMock,
	makeFetchRejected,
	setGlobalFetchMock,
} from "../_globalFetchMock";

describe("tokens async fallback behavior", () => {
	let prevNodeEnv: string | undefined;

	beforeEach(() => {
		vi.resetModules();
		prevNodeEnv = process.env.NODE_ENV;
		// lib/env.ts loads .env unless NODE_ENV=production; that can re-seed PAT_4+
		// and make token selection non-deterministic.
		process.env.NODE_ENV = "production";
		// Ensure determinism: other tests (or dotenv) may have already seeded PAT_4+
		// and token selection is round-robin/randomized across all PAT_* keys.
		for (const k of Object.keys(process.env)) {
			if (/^PAT_\d+$/.test(k)) delete process.env[k];
		}
		delete process.env.UPSTASH_REST_URL;
		delete process.env.UPSTASH_REST_TOKEN;
		delete process.env.ZINNIA_REST_URL;
		delete process.env.ZINNIA_REST_TOKEN;
		clearGlobalFetchMock();
		// set PATs for sync fallback
		process.env.PAT_1 = "AAA";
		process.env.PAT_2 = "BBB";
		process.env.PAT_3 = "CCC";
	});

	// Restore NODE_ENV to avoid cross-test pollution.
	afterEach(() => {
		if (prevNodeEnv === undefined) delete process.env.NODE_ENV;
		else process.env.NODE_ENV = prevNodeEnv;
	});

	it("falls back to sync getGithubPAT when Upstash INCR fails", async () => {
		// Simulate Upstash REST throwing network error on INCR
		process.env.UPSTASH_REST_URL = "https://upstash.fail";
		process.env.UPSTASH_REST_TOKEN = "tok";

		setGlobalFetchMock(makeFetchRejected(new Error("network failure")));

		const tokens = await import("../../lib/tokens.js");
		// getGithubPATAsync should catch the error and return a sync token
		const t = await tokens.getGithubPATAsync();
		expect(["AAA", "BBB", "CCC"]).toContain(t as string);
	});
});
