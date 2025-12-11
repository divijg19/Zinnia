import type { VercelRequest, VercelResponse } from "@vercel/node";
import { describe, expect, it, vi } from "vitest";
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

describe("Trophy handler local renderer (mode=local)", () => {
	afterEach(() => {
		restoreMocks();
	});

	it("renders locally when mode=local and returns SVG", async () => {
		const localSvg = "<svg>LOCAL</svg>";
		vi.resetModules();
		// Mock api utils lightly
		vi.doMock("../../api/_utils", mockApiUtilsFactory({}));
		// Mock the local renderer
		vi.doMock("../../trophy/src/renderer", () => ({
			renderTrophySVG: () => localSvg,
		}));

		const trophy = (await import("../../api/trophy.js")).default;
		const req = makeReq("/api/trophy?username=testuser&mode=local");
		const res = makeRes();

		await trophy(
			req as unknown as VercelRequest,
			res as unknown as VercelResponse,
		);

		expect(res.setHeader).toHaveBeenCalledWith(
			"Content-Type",
			"image/svg+xml; charset=utf-8",
		);
		expect(res.send).toHaveBeenCalledWith(localSvg);
	});
});
