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

function uniqueUser(): string {
	return `err-cache-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

async function importHandler() {
	const mod = await import("../../api/streak.js");
	return mod.default as (
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
		const res = makeRes(`/api/streak?user=${user}`);
		await handler(makeReq(`/api/streak?user=${user}`), res);

		expect(res.status).toHaveBeenCalledWith(500);
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
		const res = makeRes(`/api/streak?user=${user}`);
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
});
