import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	headerValue,
	makeReq,
	makeRes,
	type TestRequest,
	type TestResponse,
} from "../_testShim";

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

function uniqueUser(): string {
	return `err-cache-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

async function importHandler() {
	const mod = await import("../../api/streak.js");
	return mod.default as unknown as (
		req: TestRequest,
		res: TestResponse,
	) => Promise<unknown>;
}

describe("api/streak local-render error caching guard", () => {
	let cacheDir: string;

	beforeEach(() => {
		vi.resetModules();
		delete process.env.UPSTASH_KV_REST_API_URL;
		delete process.env.UPSTASH_KV_REST_API_TOKEN;
		cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "streak-cache-test-"));
		process.env.STREAK_CACHE_DIR = cacheDir;
		loaderMocks.resolveCompiledHandler.mockReturnValue(
			"/fake/streak/dist/index.js",
		);
	});

	afterEach(() => {
		delete process.env.STREAK_CACHE_DIR;
		fs.rmSync(cacheDir, { recursive: true, force: true });
	});

	it("does not persist renderer error payloads and sends short cache headers", async () => {
		const errorSvg = "<svg>RENDERER_ERROR</svg>";
		loaderMocks.importByPath.mockResolvedValue({
			renderForUser: vi.fn(async () => ({
				status: 500,
				body: errorSvg,
				contentType: "image/svg+xml",
			})),
		});

		const handler = await importHandler();
		const user = uniqueUser();
		const res = makeRes();
		await handler(makeReq(`/api/streak?user=${user}`), res);

		// The renderer reported a 500, but the embed contract answers 200 with a
		// renderable body: the route never lets an upstream status through.
		expect(res._status()).toBe(200);
		expect(res.send).toHaveBeenCalledWith(errorSvg);

		const { getCacheAdapterForService } = await import(
			"../../lib/canonical/http_cache.js"
		);
		const cache = getCacheAdapterForService("streak");
		const localKey = `streak:local:${user}:${JSON.stringify({ user })}`;
		expect(await cache.get(localKey)).toBeFalsy();

		const cc = String(headerValue(res, "Cache-Control") ?? "");
		expect(cc).toContain("max-age=60");
		expect(cc).not.toContain("max-age=86400");
	});

	it("still persists and long-caches successful renders", async () => {
		const okSvg = "<svg>OK</svg>";
		loaderMocks.importByPath.mockResolvedValue({
			renderForUser: vi.fn(async () => ({
				status: 200,
				body: okSvg,
				contentType: "image/svg+xml",
			})),
		});

		const handler = await importHandler();
		const user = uniqueUser();
		const res = makeRes();
		await handler(makeReq(`/api/streak?user=${user}`), res);

		expect(res.send).toHaveBeenCalledWith(okSvg);

		const { getCacheAdapterForService } = await import(
			"../../lib/canonical/http_cache.js"
		);
		const cache = getCacheAdapterForService("streak");
		const localKey = `streak:local:${user}:${JSON.stringify({ user })}`;
		expect(await cache.get(localKey)).toBe(okSvg);

		const cc = String(headerValue(res, "Cache-Control") ?? "");
		expect(cc).toContain("max-age=86400");
	});

	it("does not persist empty renderer bodies", async () => {
		loaderMocks.importByPath.mockResolvedValue({
			renderForUser: vi.fn(async () => ({
				contentType: "image/svg+xml",
				body: "",
			})),
		});

		const handler = await importHandler();
		const user = uniqueUser();
		const res = makeRes();
		await handler(makeReq(`/api/streak?user=${user}`), res);

		const { getCacheAdapterForService } = await import(
			"../../lib/canonical/http_cache.js"
		);
		const cache = getCacheAdapterForService("streak");
		const localKey = `streak:local:${user}:${JSON.stringify({ user })}`;
		expect(await cache.get(localKey)).toBeFalsy();
	});
});

describe("api/streak filesystem-cache fallback is a real render", () => {
	let cacheDir: string;

	beforeEach(() => {
		vi.resetModules();
		process.env.RENDER_CACHE = "1";
		delete process.env.UPSTASH_KV_REST_API_URL;
		delete process.env.UPSTASH_KV_REST_API_TOKEN;
		cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "streak-fallback-test-"));
		process.env.STREAK_CACHE_DIR = cacheDir;
		loaderMocks.resolveCompiledHandler.mockReturnValue(
			"/fake/streak/dist/index.js",
		);
		// The renderer must never be reached: the filesystem cache answers first.
		loaderMocks.importByPath.mockResolvedValue({
			renderForUser: vi.fn(async () => {
				throw new Error("renderer must not run on a filesystem-cache hit");
			}),
		});
	});

	afterEach(() => {
		delete process.env.STREAK_CACHE_DIR;
		fs.rmSync(cacheDir, { recursive: true, force: true });
		process.env.RENDER_CACHE = "0";
	});

	it("serves the cached body and promotes it into the render cache", async () => {
		const cachedSvg = "<svg>FS-CACHED-CARD</svg>";
		const user = uniqueUser();
		const { getCacheAdapterForService } = await import(
			"../../lib/canonical/http_cache.js"
		);
		await getCacheAdapterForService("streak").set(
			`streak:local:${user}:${JSON.stringify({ user })}`,
			cachedSvg,
			3600,
		);

		const handler = await importHandler();
		const res = makeRes();
		await handler(makeReq(`/api/streak?user=${user}`), res);

		// A replayed body is a perfectly good earlier render, so it is served
		// as-is rather than being treated as a failure and replaced.
		expect(res.send).toHaveBeenCalledWith(cachedSvg);
		expect(res._status()).toBe(200);
		expect(headerValue(res, "ETag")).toMatch(/^"[0-9a-f]+"$/);

		// ...and it becomes available to every other instance.
		const { getCachedRender, renderCacheKey } = await import(
			"../../lib/render-cache.js"
		);
		const promoted = await getCachedRender(
			"streak",
			renderCacheKey(new URL(`http://localhost/api/streak?user=${user}`)),
		);
		expect(promoted?.svg).toBe(cachedSvg);
	});

	it("still prefers a render-cache card over a stale filesystem card", async () => {
		const user = uniqueUser();
		const { getCacheAdapterForService } = await import(
			"../../lib/canonical/http_cache.js"
		);
		await getCacheAdapterForService("streak").set(
			`streak:local:${user}:${JSON.stringify({ user })}`,
			"<svg>FS-CACHED-CARD</svg>",
			3600,
		);
		const { setCachedRender, renderCacheKey } = await import(
			"../../lib/render-cache.js"
		);
		await setCachedRender(
			"streak",
			renderCacheKey(new URL(`http://localhost/api/streak?user=${user}`)),
			"<svg>RENDER-CACHE-CARD</svg>",
			3600,
		);

		const handler = await importHandler();
		const res = makeRes();
		await handler(makeReq(`/api/streak?user=${user}`), res);

		// The render cache is checked before the filesystem cache, so a hit there
		// answers without touching the flow at all.
		expect(res.send).toHaveBeenCalledWith("<svg>RENDER-CACHE-CARD</svg>");
		expect(headerValue(res, "X-Cache-Status")).toBe("hit");
	});
});
