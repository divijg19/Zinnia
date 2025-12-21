import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearGlobalFetchMock } from "../_globalFetchMock";
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
		// reset any injected renderer
		try {
			const mod = await import("../../api/trophy-renderer-static.js");
			mod.__testResetRenderer?.();
		} catch { }
	});

	it("renders via local renderer and writes cache", async () => {
		const body = "<svg>LOCAL-OK</svg>";
		const writeSpy = vi.fn(async () => { });
		vi.resetModules();
		vi.doMock("../../api/_utils", mockApiUtilsFactory({ writeSpy }));

		const rendererMod = await import("../../api/trophy-renderer-static.js");
		rendererMod.__testSetRenderer(() => body);

		const trophy = (await import("../../api/trophy.js")).default;
		const req = makeReq("/api/trophy?username=testuser&theme=light");
		const res = makeRes();

		await trophy(req as unknown as any, res as unknown as any);

		const { assertSvgHeadersOnRes } = await import("../_assertHeaders");
		assertSvgHeadersOnRes(res);
		expect(res.send).toHaveBeenCalledWith(body);
		expect(writeSpy).toHaveBeenCalled();
	});
});
