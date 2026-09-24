import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockApiUtilsFactory, restoreMocks } from "../_mockHelpers";
import { makeReq, makeRes } from "../_testShim";

/** Local renderer behind the loader mock (skips the compiled path). */
function mockLocalRenderer(renderTrophySVG: () => Promise<string> | string) {
	let calls = 0;
	const loaderMock = () => ({
		resolveCompiledHandler: () => {
			calls += 1;
			// No compiled handler on call 1 (falls to local path); local
			// renderer on later calls.
			return calls === 1 ? null : "/fake/local-trophy.js";
		},
		importByPath: async () => ({ renderTrophySVG }),
		pickHandlerFromModule: () => null,
		invokePossibleRequestHandler: async () => null,
	});
	vi.doMock("../../lib/loader/index.js", loaderMock);
	vi.doMock("../../lib/loader/index", loaderMock);
}

describe("trophy username + empty-body parity", () => {
	afterEach(() => {
		restoreMocks();
	});

	it("accepts ?user= like the other routes", async () => {
		vi.resetModules();
		vi.doMock("../../api/_utils", mockApiUtilsFactory());
		mockLocalRenderer(async () => "<svg>OK</svg>");

		const trophy = (await import("../../api/trophy.js")).default;
		const res = makeRes();
		await trophy(
			makeReq(
				"/api/trophy?user=testuser&theme=light",
			) as unknown as VercelRequest,
			res as unknown as VercelResponse,
		);

		expect(res.send).toHaveBeenCalledWith("<svg>OK</svg>");
	});

	it("sends an error SVG instead of an empty body", async () => {
		vi.resetModules();
		vi.doMock("../../api/_utils", mockApiUtilsFactory());
		mockLocalRenderer(async () => "");

		const trophy = (await import("../../api/trophy.js")).default;
		const res = makeRes();
		await trophy(
			makeReq("/api/trophy?username=testuser") as unknown as VercelRequest,
			res as unknown as VercelResponse,
		);

		const sent = (res.send as any).mock.calls[0]?.[0] ?? "";
		expect(String(sent)).toContain("<svg");
		expect(String(sent)).not.toBe("");
		expect(String(sent)).toContain("ZINNIA_ERR:TROPHY_INTERNAL");
	});
});
