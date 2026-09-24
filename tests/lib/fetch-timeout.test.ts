import { afterEach, describe, expect, it, vi } from "vitest";
import {
	DEFAULT_FETCH_TIMEOUT_MS,
	fetchWithTimeout,
	resolveTimeoutMs,
} from "../../lib/fetch-timeout";
import { clearGlobalFetchMock, setGlobalFetchMock } from "../_testShim";

describe("lib/fetch-timeout", () => {
	afterEach(() => {
		vi.useRealTimers();
		clearGlobalFetchMock();
	});

	it("parses env timeout values with fallback", () => {
		expect(resolveTimeoutMs(undefined)).toBe(DEFAULT_FETCH_TIMEOUT_MS);
		expect(resolveTimeoutMs(undefined, 5000)).toBe(5000);
		expect(resolveTimeoutMs("3000")).toBe(3000);
		expect(resolveTimeoutMs("abc")).toBe(DEFAULT_FETCH_TIMEOUT_MS);
		expect(resolveTimeoutMs("0")).toBe(DEFAULT_FETCH_TIMEOUT_MS);
		expect(resolveTimeoutMs("-5")).toBe(DEFAULT_FETCH_TIMEOUT_MS);
	});

	it("resolves healthy fetches untouched", async () => {
		const fetchMock = vi.fn(async () => new Response("ok"));
		setGlobalFetchMock(fetchMock);
		const res = await fetchWithTimeout("https://example.com", undefined, 8000);
		expect(await res.text()).toBe("ok");
		expect(fetchMock.mock.calls[0][1]).toHaveProperty("signal");
	});

	it("rejects hung fetches with fetch-timeout", async () => {
		vi.useFakeTimers();
		const fetchMock = vi.fn(
			(_url: unknown, init?: { signal?: AbortSignal }) =>
				new Promise((_resolve, reject) => {
					init?.signal?.addEventListener("abort", () => {
						reject(new DOMException("aborted", "AbortError"));
					});
				}),
		);
		setGlobalFetchMock(fetchMock);
		const pending = fetchWithTimeout("https://example.com", undefined, 50);
		const assertion = expect(pending).rejects.toThrow("fetch-timeout");
		await vi.advanceTimersByTimeAsync(100);
		await assertion;
		expect(vi.getTimerCount()).toBe(0);
	});

	it("rethrows non-abort failures unchanged", async () => {
		const boom = new Error("boom");
		setGlobalFetchMock(
			vi.fn(async () => {
				throw boom;
			}),
		);
		await expect(
			fetchWithTimeout("https://example.com", undefined, 8000),
		).rejects.toBe(boom);
	});
});
