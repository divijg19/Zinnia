import { describe, expect, it, vi } from "vitest";
import {
	makeReq,
	makeRes,
	type TestRequest,
	type TestResponse,
} from "../_resShim";

const loaderMocks = vi.hoisted(() => ({
	resolveCompiledHandler: vi.fn(),
	importByPath: vi.fn(),
}));

vi.mock("../../lib/loader/index.js", async (importOriginal) => {
	const actual = await importOriginal<Record<string, unknown>>();
	return {
		...actual,
		resolveCompiledHandler: loaderMocks.resolveCompiledHandler,
		importByPath: loaderMocks.importByPath,
	};
});

const LOCAL_SVG = "<svg>LOCAL_CANONICAL</svg>";

describe("api/streak defaults to the canonical local renderer", () => {
	it("never contacts the legacy upstream without explicit opt-in", async () => {
		vi.resetModules();
		process.env.VERCEL_ENV = "production";
		delete process.env.STREAK_PREFER_UPSTREAM;
		delete process.env.UPSTASH_KV_REST_API_URL;
		delete process.env.UPSTASH_KV_REST_API_TOKEN;

		loaderMocks.resolveCompiledHandler.mockReturnValue(
			"/fake/streak/dist/index.js",
		);
		loaderMocks.importByPath.mockResolvedValue({
			renderForUser: vi.fn(async () => ({
				status: 200,
				body: LOCAL_SVG,
				contentType: "image/svg+xml",
			})),
		});

		const upstreamFetch = vi.fn(async () => {
			throw new Error("upstream must not be contacted by default");
		});
		(globalThis as unknown as Record<string, unknown>).fetch = upstreamFetch;

		try {
			const { default: handler } = await import("../../api/streak.js");
			const res = makeRes("/api/streak?user=longstreak");
			await handler(
				makeReq("/api/streak?user=longstreak") as TestRequest,
				res as unknown as TestResponse,
			);

			expect(upstreamFetch).not.toHaveBeenCalled();
			expect(res.send).toHaveBeenCalledWith(LOCAL_SVG);
		} finally {
			delete (globalThis as unknown as Record<string, unknown>).fetch;
			delete process.env.VERCEL_ENV;
		}
	});
});
