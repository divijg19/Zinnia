import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	clearGlobalFetchMock,
	makeFetchResolved,
	setGlobalFetchMock,
} from "../_globalFetchMock";
import { mockApiUtilsFactory, restoreMocks } from "../_mockHelpers";

function makeReq(urlPath: string) {
	return {
		headers: { host: "localhost", "x-forwarded-proto": "http" },
		url: urlPath,
	} as unknown as Record<string, unknown>;
}

function makeRes() {
	return {
		setHeader: vi.fn(),
		send: vi.fn(),
		status: vi.fn().mockReturnThis(),
	} as unknown as Record<string, unknown>;
}

describe("Trophy handler ETag & cache behavior", () => {
	beforeEach(async () => {
		// avoid touching real filesystem here; tests use mocked api/_utils
		clearGlobalFetchMock();
	});

	afterEach(async () => {
		restoreMocks();
	});

	it("writes cache on upstream 200 and serves body", async () => {
		const upstreamBody = "<svg>UPSTREAM-OK</svg>";
		// Mock the api utils to capture writes and avoid fs I/O
		const writeSpy = vi.fn(async () => {});
		vi.resetModules();
		vi.doMock("../../api/_utils", mockApiUtilsFactory({ writeSpy }));
		setGlobalFetchMock(
			makeFetchResolved({
				status: 200,
				headers: {
					get: (k: string) => (k === "content-type" ? "image/svg+xml" : null),
				},
				text: async () => upstreamBody,
			}),
		);

		const trophy = (await import("../../api/trophy.js")).default;
		const req = makeReq("/api/trophy?username=testuser&theme=light");
		const res = makeRes();

		await trophy(req, res);

		expect(res.setHeader).toHaveBeenCalledWith(
			"Content-Type",
			"image/svg+xml; charset=utf-8",
		);
		expect(res.setHeader).toHaveBeenCalledWith(
			"X-Content-Type-Options",
			"nosniff",
		);
		expect(res.send).toHaveBeenCalledWith(upstreamBody);
		expect(writeSpy).toHaveBeenCalled();
	});

	it("serves cached body on upstream 304", async () => {
		const upstreamBody = "<svg>CACHED</svg>";
		// Mock readTrophyCacheWithMeta to return cached body/etag and upstream 304
		vi.resetModules();
		vi.doMock(
			"../../api/_utils",
			mockApiUtilsFactory({ readMeta: { body: upstreamBody, etag: "etag-1" } }),
		);
		setGlobalFetchMock(
			makeFetchResolved({
				status: 304,
				headers: { get: () => null },
				text: async () => "",
			}),
		);

		const trophy = (await import("../../api/trophy.js")).default;
		const req = makeReq("/api/trophy?username=testuser&theme=light");
		const res = makeRes();
		await trophy(req, res);

		expect(res.setHeader).toHaveBeenCalledWith(
			"Content-Type",
			"image/svg+xml; charset=utf-8",
		);
		expect(res.setHeader).toHaveBeenCalledWith(
			"X-Content-Type-Options",
			"nosniff",
		);
		expect(res.send).toHaveBeenCalledWith(upstreamBody);
		// cached responses are marked as fallback
		expect(res.setHeader).toHaveBeenCalledWith("X-Cache-Status", "fallback");
	});

	it("falls back to cached body on upstream 500", async () => {
		const upstreamBody = "<svg>FALLBACK</svg>";
		// Mock readTrophyCache to return fallback body and upstream returns 500
		vi.resetModules();
		vi.doMock(
			"../../api/_utils",
			mockApiUtilsFactory({ readBody: upstreamBody }),
		);
		setGlobalFetchMock(
			makeFetchResolved({
				status: 500,
				headers: { get: () => "image/svg+xml" },
				text: async () => "<svg>ERR</svg>",
			}),
		);

		const trophy = (await import("../../api/trophy.js")).default;
		const res = makeRes();
		const req = makeReq("/api/trophy?username=testuser&theme=light");
		await trophy(req, res);

		expect(res.setHeader).toHaveBeenCalledWith(
			"Content-Type",
			"image/svg+xml; charset=utf-8",
		);
		expect(res.setHeader).toHaveBeenCalledWith(
			"X-Content-Type-Options",
			"nosniff",
		);
		// fallback served
		expect(res.send).toHaveBeenCalledWith(upstreamBody);
		expect(res.setHeader).toHaveBeenCalledWith("X-Cache-Status", "fallback");
	});
});
