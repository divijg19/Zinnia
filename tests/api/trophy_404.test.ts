import { describe, expect, it, vi } from "vitest";
import { makeFetchResolved, setGlobalFetchMock } from "../_globalFetchMock";
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

	it("forwards upstream 404 SVG and keeps badge embeddable", async () => {
		const upstreamBody = "<svg>NOTFOUND</svg>";
		vi.resetModules();
		vi.doMock("../../api/_utils", mockApiUtilsFactory({}));
		setGlobalFetchMock(
			makeFetchResolved({
				status: 404,
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

		// handler exposes the original upstream status but returns 200 so
		// embed consumers display the SVG instead of a broken image.
		expect(res.setHeader).toHaveBeenCalledWith("X-Upstream-Status", "404");
		expect(res.send).toHaveBeenCalledWith(upstreamBody);
		// transient responses for upstream 404s
		expect(res.setHeader).toHaveBeenCalledWith("X-Cache-Status", "transient");
	});
});
