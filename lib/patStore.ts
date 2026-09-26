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
	// Seed with a random offset between 0 and 1000 to avoid bias toward PAT_1
	// in serverless environments where memory resets on cold start.
	let counter = Math.floor(Math.random() * 1000);
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

// Namespace keys so multiple deployments/environments don't collide.
// Override with `PAT_STORE_NAMESPACE` if needed (e.g., project or environment name).
const NAMESPACE = (process.env.PAT_STORE_NAMESPACE || "zinnia").toLowerCase();
const RR_COUNTER_KEY = `${NAMESPACE}:rr:pat`;
const EX_PREFIX = `${NAMESPACE}:ex:`;

// Allow a configurable prefix (e.g., ZINNIA) for env vars injected by
// the Vercel Marketplace. Default is UPSTASH. Set `UPSTASH_PREFIX=ZINNIA`
// in Vercel if you used a custom prefix when installing the integration.
const UPSTASH_PREFIX = (process.env.UPSTASH_PREFIX || "UPSTASH").toUpperCase();

// Shared Upstash REST primitives (single implementation in lib/kv).
import { findEnv, upstashCall } from "./kv/upstash.js";

async function createUpstashStore(): Promise<PatStore | null> {
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
			const r = await upstashCall(url, token, "INCR", key || RR_COUNTER_KEY);
			return Number(r || 0);
		},
		isExhausted: async (patKey: string) => {
			const rNs = await upstashCall(url, token, "GET", `${EX_PREFIX}${patKey}`);
			return rNs !== null && rNs !== undefined;
		},
		setExhausted: async (patKey: string, ttlSeconds = 300) => {
			// Atomic SET with EX so a failed call can never leave a
			// persistent key behind.
			const ttl = String(Math.max(1, Math.floor(ttlSeconds)));
			await upstashCall(
				url,
				token,
				"SET",
				`${EX_PREFIX}${patKey}`,
				"1",
				"EX",
				ttl,
			);
		},
		clearExhausted: async (patKey: string) => {
			try {
				await upstashCall(url, token, "DEL", `${EX_PREFIX}${patKey}`);
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
			incrCounter: async (key: string) =>
				Number(await client.incr(key || RR_COUNTER_KEY)),
			isExhausted: async (patKey: string) =>
				Boolean(await client.get(`${EX_PREFIX}${patKey}`)),
			setExhausted: async (patKey: string, ttlSeconds = 300) => {
				await client.set(
					`${EX_PREFIX}${patKey}`,
					"1",
					"EX",
					Math.max(1, Math.floor(ttlSeconds)),
				);
			},
			clearExhausted: async (patKey: string) => {
				await client.del(`${EX_PREFIX}${patKey}`);
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
