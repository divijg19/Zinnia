import { describe, expect, it, vi } from "vitest";
import { mockApiUtilsFactory, restoreMocks } from "../_mockHelpers";

function makeReq(urlPath: string) {
	return {
		headers: { host: "localhost", "x-forwarded-proto": "http" },
		url: urlPath,
	} as any;
}

function makeRes() {
	return {
		setHeader: vi.fn(),
		send: vi.fn(),
		status: vi.fn().mockReturnThis(),
	} as any;
}

describe("Trophy handler local renderer (watchdog)", () => {
	afterEach(() => {
		restoreMocks();
	});

	it("renders locally when theme=watchdog and returns SVG", async () => {
		const localSvg = "<svg>LOCAL</svg>";
		vi.resetModules();
		// Mock api utils lightly
		vi.doMock("../../api/_utils", mockApiUtilsFactory({}));
		// Mock the local renderer
		vi.doMock("../../trophy/src/renderer", () => ({
			renderTrophySVG: () => localSvg,
		}));

		const trophy = (await import("../../api/trophy.js")).default;
		const req = makeReq("/api/trophy?username=testuser&theme=watchdog");
		const res = makeRes();

		await trophy(req, res);

		expect(res.setHeader).toHaveBeenCalledWith(
			"Content-Type",
			"image/svg+xml; charset=utf-8",
		);
		expect(res.send).toHaveBeenCalledWith(localSvg);
	});
});
