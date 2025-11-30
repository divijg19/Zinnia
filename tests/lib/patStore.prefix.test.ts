import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearGlobalFetchMock, setGlobalFetchMock } from "../_globalFetchMock";

describe("patStore prefix detection (ZINNIA)", () => {
	beforeEach(() => {
		vi.resetModules();
		delete process.env.UPSTASH_REST_URL;
		delete process.env.UPSTASH_REST_TOKEN;
		delete process.env.UPSTASH_PREFIX;
		delete process.env.ZINNIA_REST_URL;
		delete process.env.ZINNIA_REST_TOKEN;
		clearGlobalFetchMock();
	});

	it("detects ZINNIA_* env vars and calls the correct REST URL", async () => {
		// Provide ZINNIA envs as injected by Marketplace
		process.env.ZINNIA_REST_URL = "https://zinnia.test";
		process.env.ZINNIA_REST_TOKEN = "secret";

		const calls: Array<{ url: string; opts: any }> = [];
		setGlobalFetchMock(
			vi.fn().mockImplementation(async (url: string, opts: any) => {
				calls.push({ url, opts });
				return { ok: true, json: async () => ({ result: 1 }) };
			}),
		);

		const mod = await import("../../lib/patStore.js");
		const store = await mod.getPatStore();
		const v = await store.incrCounter("pat_rr_counter");

		expect(v).toBe(1);
		expect(calls.length).toBeGreaterThan(0);
		expect(calls[0].url).toBe(process.env.ZINNIA_REST_URL);
		const body = JSON.parse(calls[0].opts.body as string);
		expect(body[0]).toBe("INCR");
	});
});
