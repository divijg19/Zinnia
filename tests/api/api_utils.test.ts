import { promises as fs } from "node:fs";
import path from "node:path";
import { vi } from "vitest";

describe("trophy cache metadata helpers", () => {
	const url = `https://example.com/test-${Date.now()}-${Math.random()}`;
	const body = "<svg>OK</svg>";
	const etag = "test-etag-123";
	const cacheDir =
		process.env.TROPHY_CACHE_DIR || path.join(process.cwd(), "cache", "trophy");

	afterAll(async () => {
		// cleanup files if present
		try {
			// import computeCacheKey at runtime to avoid mocked module interference
			vi.resetModules();
			const mod = await import("../../api/_utils");
			const { computeCacheKey } = mod;
			const key = computeCacheKey(url);
			await fs.unlink(path.join(cacheDir, `${key}.svg`));
		} catch (_e) {
			// ignore
		}
		try {
			// import computeCacheKey at runtime (second attempt in case of race)
			vi.resetModules();
			const mod2 = await import("../../api/_utils");
			const { computeCacheKey: computeCacheKey2 } = mod2;
			const key = computeCacheKey2(url);
			await fs.unlink(path.join(cacheDir, `${key}.meta.json`));
		} catch (_e) {
			// ignore
		}
		// remove cache directory if empty
		try {
			await fs.rm(cacheDir, { recursive: true, force: true });
		} catch (_e) {
			// ignore
		}
	});

	test("write then read returns same body and etag", async () => {
		// Import the real module at test time to avoid other tests' vi.doMock affecting this test
		vi.resetModules();
		const mod = await import("../../api/_utils");
		const { readTrophyCacheWithMeta, writeTrophyCacheWithMeta } = mod;

		await writeTrophyCacheWithMeta(url, body, etag);
		const got = await readTrophyCacheWithMeta(url);
		expect(got).not.toBeNull();
		expect(got?.body).toBe(body);
		expect(got?.etag).toBe(etag);
		expect(typeof got?.ts).toBe("number");
	});
});
