import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeFetchResolved, setGlobalFetchMock } from "../_globalFetchMock";
import { mockApiUtilsFactory, restoreMocks } from "../_mockHelpers";

function makeReq(urlPath: string, headers: Record<string, string> = {}) {
	return {
		headers: { host: "localhost", "x-forwarded-proto": "http", ...headers },
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

describe("Trophy handler always-200 + ETag on If-None-Match", () => {
	afterEach(() => {
		restoreMocks();
	});

	it("sends full SVG body with ETag set when client If-None-Match matches", async () => {
		const cachedBody = "<svg>CACHED</svg>";
		const etag = cachedBody.slice(0, 16);
		vi.resetModules();
		vi.doMock(
			"../../api/_utils",
			mockApiUtilsFactory({ readMeta: { body: cachedBody, etag } }),
		);
		// upstream returns 304 Not Modified
		setGlobalFetchMock(
			makeFetchResolved({
				status: 304,
				headers: { get: () => null },
				text: async () => "",
			}),
		);

		const trophy = (await import("../../api/trophy.js")).default;
		const req = makeReq("/api/trophy?username=testuser&theme=light", {
			"if-none-match": etag,
		});
		const res = makeRes();
		await trophy(
			req as unknown as VercelRequest,
			res as unknown as VercelResponse,
		);

		// Never a bare 304-empty: the full SVG body is sent and an ETag is set.
		const sentArg = (res.send as any).mock.calls[0]?.[0] ?? "";
		expect(String(sentArg)).toContain("<svg");
		expect(res.setHeader).toHaveBeenCalledWith(
			"ETag",
			expect.stringMatching(/^".+"$/),
		);
	});
});
