/**
 * Adapter supporting Upstash (REST) and managed Redis (ioredis), with
 * an in-memory fallback for local development and tests.
 *
 * Environment-driven behavior:
 * - UPSTASH_REST_URL + UPSTASH_REST_TOKEN -> use Upstash REST API (no extra deps)
 * - REDIS_URL (or REDIS_PROVIDER=redis) -> try to use ioredis client if installed
 * - otherwise fall back to in-memory store
 */

type PatStore = {
	incrCounter: (key: string) => Promise<number>;
	isExhausted: (patKey: string) => Promise<boolean>;
	setExhausted: (patKey: string, ttlSeconds?: number) => Promise<void>;
	clearExhausted: (patKey: string) => Promise<void>;
};

const IN_MEMORY_STORE: PatStore = (() => {
	let counter = 0;
	const exhausted = new Map<string, number>();
	return {
		incrCounter: async (_k: string) => ++counter,
		isExhausted: async (patKey: string) => {
			const t = exhausted.get(patKey);
			if (!t) return false;
			if (Date.now() > t) {
				exhausted.delete(patKey);
				return false;
			}
			return true;
		},
		setExhausted: async (patKey: string, ttlSeconds = 300) => {
			exhausted.set(patKey, Date.now() + ttlSeconds * 1000);
		},
		clearExhausted: async (patKey: string) => {
			exhausted.delete(patKey);
		},
	};
})();

let STORE: PatStore | null = null;

// Allow a configurable prefix (e.g., ZINNIA) for env vars injected by
// the Vercel Marketplace. Default is UPSTASH. Set `UPSTASH_PREFIX=ZINNIA`
// in Vercel if you used a custom prefix when installing the integration.
const UPSTASH_PREFIX = (process.env.UPSTASH_PREFIX || "UPSTASH").toUpperCase();

// Helper: Upstash REST wrapper using fetch
async function upstashCall(
	url: string,
	token: string,
	cmd: string,
	...args: string[]
) {
	const body = JSON.stringify([cmd, ...args]);
	const res = await fetch(url, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body,
	});
	if (!res.ok) throw new Error(`upstash request failed: ${res.status}`);
	const j = await res.json();
	return j?.result ?? null;
}

async function createUpstashStore(): Promise<PatStore | null> {
	// Helper to find the first present env var from a candidate list.
	function findEnv(...names: string[]) {
		for (const n of names) {
			if (process.env[n]) return process.env[n] as string;
			const up = n.toUpperCase();
			if (process.env[up]) return process.env[up] as string;
			const low = n.toLowerCase();
			if (process.env[low]) return process.env[low] as string;
		}
		return undefined;
	}

	// Common candidate keys injected by Vercel Marketplace for Upstash
	const url =
		findEnv(
			`${UPSTASH_PREFIX}_KV_REST_API_URL`,
			`${UPSTASH_PREFIX}_KV_REST_API_URL`,
			`${UPSTASH_PREFIX}_REST_URL`,
			`${UPSTASH_PREFIX}_URL`,
			`${UPSTASH_PREFIX}_KV_URL`,
			`${UPSTASH_PREFIX}_REDIS_URL`,
			"UPSTASH_REST_URL",
			"UPSTASH_URL",
			"ZINNIA_REST_URL",
			"ZINNIA_KV_REST_API_URL",
			"ZINNIA_KV_URL",
		) || undefined;

	const token =
		findEnv(
			`${UPSTASH_PREFIX}_KV_REST_API_TOKEN`,
			`${UPSTASH_PREFIX}_KV_REST_API_READ_ONLY_TOKEN`,
			`${UPSTASH_PREFIX}_REST_TOKEN`,
			`${UPSTASH_PREFIX}_TOKEN`,
			"UPSTASH_REST_TOKEN",
			"UPSTASH_TOKEN",
			"ZINNIA_REST_TOKEN",
			"ZINNIA_KV_REST_API_TOKEN",
		) || undefined;
	if (!url || !token) return null;
	return {
		incrCounter: async (key: string) => {
			const r = await upstashCall(url, token, "INCR", key);
			return Number(r || 0);
		},
		isExhausted: async (patKey: string) => {
			const r = await upstashCall(url, token, "GET", `ex:${patKey}`);
			return r !== null && r !== undefined;
		},
		setExhausted: async (patKey: string, ttlSeconds = 300) => {
			await upstashCall(url, token, "SET", `ex:${patKey}`, "1");
			try {
				await upstashCall(
					url,
					token,
					"EXPIRE",
					`ex:${patKey}`,
					String(Math.max(1, Math.floor(ttlSeconds))),
				);
			} catch (_e) {
				// ignore expiry failure; key will be treated as persistent until cleared
			}
		},
		clearExhausted: async (patKey: string) => {
			try {
				await upstashCall(url, token, "DEL", `ex:${patKey}`);
			} catch (_e) {
				// ignore
			}
		},
	};
}

async function createManagedRedisStore(): Promise<PatStore | null> {
	const redisUrl = process.env.REDIS_URL;
	if (!redisUrl) return null;
	try {
		// dynamic import to avoid requiring ioredis in environments that don't need it
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const IORedis = require("ioredis");
		const client = new IORedis(redisUrl);
		return {
			incrCounter: async (key: string) => Number(await client.incr(key)),
			isExhausted: async (patKey: string) =>
				Boolean(await client.get(`ex:${patKey}`)),
			setExhausted: async (patKey: string, ttlSeconds = 300) => {
				await client.set(
					`ex:${patKey}`,
					"1",
					"EX",
					Math.max(1, Math.floor(ttlSeconds)),
				);
			},
			clearExhausted: async (patKey: string) => {
				await client.del(`ex:${patKey}`);
			},
		};
	} catch (_e) {
		return null;
	}
}

export async function getPatStore(): Promise<PatStore> {
	if (STORE) return STORE;

	// Provider selection order: explicit Upstash envs (including custom prefix), REDIS_URL, fallback in-memory
	if (
		process.env.UPSTASH_REST_URL ||
		process.env.UPSTASH_URL ||
		process.env[`${UPSTASH_PREFIX}_REST_URL`] ||
		process.env.ZINNIA_REST_URL ||
		process.env.ZINNIA_URL
	) {
		const s = await createUpstashStore();
		if (s) {
			STORE = s;
			return STORE;
		}
	}

	if (
		process.env.REDIS_URL ||
		(process.env.REDIS_PROVIDER || "").toLowerCase() === "redis"
	) {
		const s = await createManagedRedisStore();
		if (s) {
			STORE = s;
			return STORE;
		}
	}

	STORE = IN_MEMORY_STORE;
	return STORE;
}

export type { PatStore };
