import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockApiUtilsFactory, restoreMocks } from "../_mockHelpers";
import {
	makeFetchResolved,
	makeReq,
	makeRes,
	setGlobalFetchMock,
} from "../_testShim";

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
