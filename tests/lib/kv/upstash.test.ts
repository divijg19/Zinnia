import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { findEnv, upstashCall } from "../../../lib/kv/upstash";
import { clearGlobalFetchMock, setGlobalFetchMock } from "../../_testShim";

describe("lib/kv/upstash", () => {
	beforeEach(clearGlobalFetchMock);
	afterEach(clearGlobalFetchMock);

	it("posts the command array with bearer auth and returns the result", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ result: "OK" }),
		});
		setGlobalFetchMock(fetchMock);

		const out = await upstashCall(
			"https://upstash.test",
			"tok",
			"SET",
			"k",
			"v",
			"EX",
			"300",
		);

		expect(out).toBe("OK");
		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toBe("https://upstash.test");
		expect(init.method).toBe("POST");
		expect((init.headers as Record<string, string>).Authorization).toBe(
			"Bearer tok",
		);
		expect(JSON.parse(init.body as string)).toEqual([
			"SET",
			"k",
			"v",
			"EX",
			"300",
		]);
	});

	it("normalizes a missing result field to null", async () => {
		setGlobalFetchMock(
			vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
		);
		expect(await upstashCall("https://upstash.test", "t", "GET", "k")).toBe(
			null,
		);
	});

	it("throws on non-ok responses with status and truncated body", async () => {
		setGlobalFetchMock(
			vi.fn().mockResolvedValue({
				ok: false,
				status: 401,
				text: async () => "x".repeat(500),
			}),
		);
		await expect(
			upstashCall("https://upstash.test", "t", "GET", "k"),
		).rejects.toThrow(/^upstash request failed: 401:x{200}$/);
	});

	it("findEnv matches exact, upper, and lower case env names", () => {
		process.env.KV_UPPER = "upper-value";
		process.env.kv_lower = "lower-value";
		try {
			expect(findEnv("KV_UPPER")).toBe("upper-value");
			expect(findEnv("kv_upper")).toBe("upper-value");
			expect(findEnv("KV_LOWER")).toBe("lower-value");
			expect(findEnv("KV_MISSING")).toBeUndefined();
			expect(findEnv("KV_MISSING", "KV_UPPER")).toBe("upper-value");
		} finally {
			delete process.env.KV_UPPER;
			delete process.env.kv_lower;
		}
	});
});
