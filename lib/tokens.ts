const STATIC_PAT_KEYS = ["PAT_1", "PAT_2", "PAT_3", "PAT_4", "PAT_5"] as const;

// In-memory map of token -> expiry timestamp (ms) for exhausted/invalid tokens
const exhaustedUntil = new Map<string, number>();

function isPatExhausted(key: string): boolean {
	const until = exhaustedUntil.get(key);
	if (!until) return false;
	if (Date.now() > until) {
		exhaustedUntil.delete(key);
		return false;
	}
	return true;
}

// Lazy import of KV-backed store helper. Kept local so tests/dev don't
// need @vercel/kv unless enabled via env var.
import { getPatStore } from "./patStore.js";

/**
 * Discover configured PAT keys from the environment.
 * Returns keys like `PAT_1`, `PAT_2` sorted by their numeric suffix.
 */
export function discoverPatKeys(): string[] {
	const envKeys = Object.keys(process.env).filter((k) => /^PAT_\d+$/.test(k));
	const keys = Array.from(new Set([...STATIC_PAT_KEYS, ...envKeys])).filter(
		(k) => Boolean(process.env[k]),
	);
	keys.sort((a, b) => {
		const na = Number(a.split("_")[1] || 0);
		const nb = Number(b.split("_")[1] || 0);
		return na - nb;
	});
	return keys;
}

/**
 * Choose a PAT key (like `PAT_2`) from available, non-exhausted keys.
 * Selection is randomized to distribute load across tokens in serverless environments.
 */
export function choosePatKey(): string | undefined {
	const keys = discoverPatKeys().filter((k) => !isPatExhausted(k));
	if (keys.length === 0) return undefined;
	// deterministic, per-process round-robin for even distribution
	if (typeof (choosePatKey as any).rrCounter === "undefined")
		(choosePatKey as any).rrCounter = 0;
	const rr = (choosePatKey as any).rrCounter as number;
	const key = keys[rr % keys.length];
	(choosePatKey as any).rrCounter = (rr + 1) % keys.length;
	return key;
}

export function getGithubPAT(): string | undefined {
	const key = choosePatKey();
	if (!key) return undefined;
	const t = process.env[key];
	return t && t.trim().length > 0 ? t.trim() : undefined;
}

/**
 * Async selector that uses a global counter in Vercel KV (when enabled)
 * to pick a token in a globally coordinated round-robin. Falls back to
 * the synchronous `getGithubPAT()` when KV is not enabled or fails.
 */
export async function getGithubPATAsync(): Promise<string | undefined> {
	try {
		const store = await getPatStore();
		const keys = discoverPatKeys();
		if (keys.length === 0) return undefined;

		// If the store is the in-memory fallback, prefer the fast synchronous path
		if (!store || store === undefined) return getGithubPAT();

		const n = await store.incrCounter("pat_rr_counter");
		const start = Number(n) % keys.length;
		for (let i = 0; i < keys.length; i++) {
			const idx = (start + i) % keys.length;
			const k = keys[idx];
			if (isPatExhausted(k)) continue;
			const remoteEx = await store.isExhausted(k);
			if (remoteEx) continue;
			const token = process.env[k];
			if (token && token.trim().length > 0) return token.trim();
		}
		return undefined;
	} catch (_err) {
		return getGithubPAT();
	}
}

/**
 * Mark a PAT key as exhausted for the given TTL (seconds). Default TTL is 300s.
 * This is process-local and will auto-unmark after TTL when inspected.
 */
export function markPatExhausted(key: string, ttlSeconds = 300) {
	if (typeof key !== "string" || !key) return;
	const until = Date.now() + Math.max(0, ttlSeconds) * 1000;
	exhaustedUntil.set(key, until);
}

/**
 * Async variant persists exhausted state to KV when available.
 */
export async function markPatExhaustedAsync(key: string, ttlSeconds = 300) {
	if (typeof key !== "string" || !key) return;
	const until = Date.now() + Math.max(0, ttlSeconds) * 1000;
	exhaustedUntil.set(key, until);
	try {
		const store = await getPatStore();
		if (store && typeof store.setExhausted === "function") {
			await store.setExhausted(key, ttlSeconds);
		}
	} catch (_e) {
		// ignore KV failures
	}
}

export function unmarkPatExhausted(key: string) {
	exhaustedUntil.delete(key);
}

export async function unmarkPatExhaustedAsync(key: string) {
	exhaustedUntil.delete(key);
	try {
		const store = await getPatStore();
		if (store && typeof store.clearExhausted === "function") {
			await store.clearExhausted(key);
		}
	} catch (_e) {
		// ignore
	}
}

export function listPatStatus() {
	return discoverPatKeys().map((k) => {
		const until = exhaustedUntil.get(k) || null;
		const remaining = until
			? Math.max(0, Math.ceil((until - Date.now()) / 1000))
			: 0;
		return {
			key: k,
			present: Boolean(process.env[k]),
			exhausted: remaining > 0,
			exhaustedTtlSec: remaining,
		};
	});
}

export { STATIC_PAT_KEYS as PAT_KEYS };
