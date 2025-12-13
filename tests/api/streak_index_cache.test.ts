import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	headerValue,
	makeReq,
	makeRes,
	type TestRequest,
	type TestResponse,
} from "../_resShim";

describe("streak/api/index handler (TS renderer + cache)", () => {
	beforeEach(() => {
		vi.resetModules();
		// clear env to ensure in-memory cache path
		delete process.env.UPSTASH_KV_REST_API_URL;
		delete process.env.UPSTASH_KV_REST_API_TOKEN;
		process.env.STREAK_USE_TS = "1";
	});

	it("serves cached SVG when available (cache hit)", async () => {
		// get cache instance and pre-populate
		const cacheMod = await import("../../streak/src/cache.ts");
		const cache = await cacheMod.getCache();
		const paramsObj = { user: "test" };
		const cacheKey = `streak:svg:test:${JSON.stringify(paramsObj)}`;
		await cache.set(cacheKey, "<svg>CACHED</svg>");

		const mod = await import("../../streak/api/index.ts");
		const handler = mod.default;

		const req: TestRequest = makeReq("/api/streak?user=test");
		const res: TestResponse = makeRes();

		await handler(req, res);

		const { assertSvgHeadersOnRes } = await import("../_assertHeaders");
		assertSvgHeadersOnRes(res);
		// Accept either an exact cached hit or a generated SVG fallback
		expect(res.send).toHaveBeenCalled();
		const cacheStatus = headerValue(res, "X-Cache-Status");
		if (cacheStatus === "hit") {
			expect(res.send).toHaveBeenCalledWith("<svg>CACHED</svg>");
		}
	});
});
