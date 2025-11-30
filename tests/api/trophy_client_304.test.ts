import { describe, expect, it, vi } from "vitest";
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

describe("Trophy handler honors client If-None-Match with 304", () => {
	afterEach(() => {
		restoreMocks();
	});

	it("returns 304 when client If-None-Match equals cached etag", async () => {
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
		await trophy(req, res);

		expect(res.status).toHaveBeenCalledWith(304);
		expect(res.send).toHaveBeenCalledWith("");
	});
});
