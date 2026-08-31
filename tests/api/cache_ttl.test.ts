import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getCacheAdapterForService } from "../../lib/canonical/http_cache.js";

describe("getCacheAdapterForService TTL enforcement (runtime shim)", () => {
	let cacheDir: string;

	beforeEach(() => {
		delete process.env.UPSTASH_KV_REST_API_URL;
		delete process.env.UPSTASH_KV_REST_API_TOKEN;
		cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "streak-ttl-test-"));
		process.env.STREAK_CACHE_DIR = cacheDir;
	});

	afterEach(() => {
		delete process.env.STREAK_CACHE_DIR;
		fs.rmSync(cacheDir, { recursive: true, force: true });
	});

	it("serves a cached entry while it is within its TTL", async () => {
		const cache = getCacheAdapterForService("streak");
		await cache.set("streak:local:ttl:1", "<svg>fresh</svg>", 3600);

		expect(await cache.get("streak:local:ttl:1")).toBe("<svg>fresh</svg>");
	});

	it("treats an expired cached entry as a miss", async () => {
		const cache = getCacheAdapterForService("streak");
		const key = "streak:local:ttl:2";
		await cache.set(key, "<svg>stale</svg>", 1);

		// The temp dir holds exactly one entry (its meta file) after the single
		// `set` above. Rewind its timestamp so the 1-second TTL has elapsed.
		const dir = (process.env.STREAK_CACHE_DIR as string) ?? cacheDir;
		const metas = fs.readdirSync(dir).filter((f) => f.endsWith(".meta.json"));
		expect(metas).toHaveLength(1);
		const metaFile = path.join(dir, metas[0] as string);
		const meta = JSON.parse(fs.readFileSync(metaFile, "utf8"));
		meta.ts = Date.now() - 10_000;
		fs.writeFileSync(metaFile, JSON.stringify(meta), "utf8");

		expect(await cache.get(key)).toBeNull();
	});

	it("respects an entry written without a TTL as a permanent cache entry", async () => {
		const cache = getCacheAdapterForService("streak");
		await cache.set("streak:local:ttl:3", "<svg>no-ttl</svg>");

		expect(await cache.get("streak:local:ttl:3")).toBe("<svg>no-ttl</svg>");
	});
});
