// Simple cache adapter: in-memory Map + optional Upstash REST KV (GET/SET/EXPIRE)

type Cache = {
	get: (key: string) => Promise<string | null>;
	set: (key: string, value: string, ttlSeconds?: number) => Promise<void>;
};

const IN_MEMORY: Cache = (() => {
	const map = new Map<string, { v: string; expiresAt: number | null }>();
	return {
		get: async (key: string) => {
			const item = map.get(key);
			if (!item) return null;
			if (item.expiresAt && Date.now() > item.expiresAt) {
				map.delete(key);
				return null;
			}
			return item.v;
		},
		set: async (key: string, value: string, ttlSeconds?: number) => {
			const expires =
				ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
			map.set(key, { v: value, expiresAt: expires });
		},
	};
})();

// The KV primitives and the endpoint resolution are shared with every other
// KV consumer (lib/kv), so the render cache and the contribution cache cannot
// end up pointed at different buckets by a name only one of them knows.
import { resolveKvCredentials } from "../../lib/kv/credentials.js";
import { upstashCall } from "../../lib/kv/upstash.js";

async function createUpstashCache(): Promise<Cache | null> {
	const creds = resolveKvCredentials();
	if (!creds) return null;
	const { url, token } = creds;
	return {
		get: async (key: string) => {
			try {
				const r = await upstashCall(url, token, "GET", key);
				if (r === null || r === undefined) return null;
				return String(r);
			} catch (e) {
				try {
					if (process.env.UPSTASH_DEBUG === "1")
						console.warn("streak: upstash GET failed", String(e));
				} catch {}
				return null;
			}
		},
		set: async (key: string, value: string, ttlSeconds = 300) => {
			try {
				// Atomic SET ... EX: one round trip, and no window in which the
				// key exists without a TTL (as a separate EXPIRE would have).
				await upstashCall(
					url,
					token,
					"SET",
					key,
					value,
					"EX",
					String(Math.max(1, Math.floor(ttlSeconds))),
				);
			} catch (e) {
				try {
					if (process.env.UPSTASH_DEBUG === "1")
						console.warn("streak: upstash SET failed", String(e));
				} catch {}
				// do not rethrow — fall back to in-memory caching
			}
		},
	};
}

let CACHE: Cache | null = null;

export async function getCache(): Promise<Cache> {
	if (CACHE) return CACHE;
	const isTest =
		typeof process !== "undefined" &&
		(process.env.VITEST === "1" ||
			process.env.NODE_ENV === "test" ||
			typeof (globalThis as any).vi !== "undefined");
	if (isTest) {
		CACHE = IN_MEMORY;
		return CACHE;
	}
	const us = await createUpstashCache();
	if (us) {
		CACHE = us;
		return CACHE;
	}
	CACHE = IN_MEMORY;
	return CACHE;
}
