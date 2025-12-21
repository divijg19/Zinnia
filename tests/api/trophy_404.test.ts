import { describe, expect, it, vi } from "vitest";
// fetch mocks unused in this test (renderer injection used instead)
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

describe("Trophy handler upstream 404 svg passthrough", () => {
	afterEach(() => {
		restoreMocks();
	});

	it("returns rendered SVG from local renderer", async () => {
		const body = "<svg>NOTFOUND</svg>";
		vi.resetModules();
		vi.doMock("../../api/_utils", mockApiUtilsFactory({}));

		const rendererMod = await import("../../api/trophy-renderer-static.js");
		rendererMod.__testSetRenderer(() => body);

		const trophy = (await import("../../api/trophy.js")).default;
		const req = makeReq("/api/trophy?username=testuser&theme=light");
		const res = makeRes();
		await trophy(req as unknown as any, res as unknown as any);

		// ensure SVG headers and body are returned
		const { assertSvgHeadersOnRes } = await import("../_assertHeaders");
		assertSvgHeadersOnRes(res);
		expect(res.send).toHaveBeenCalledWith(body);
	});
});
