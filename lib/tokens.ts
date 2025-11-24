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
 * Mark a PAT key as exhausted for the given TTL (seconds). Default TTL is 300s.
 * This is process-local and will auto-unmark after TTL when inspected.
 */
export function markPatExhausted(key: string, ttlSeconds = 300) {
	if (typeof key !== "string" || !key) return;
	const until = Date.now() + Math.max(0, ttlSeconds) * 1000;
	exhaustedUntil.set(key, until);
}

export function unmarkPatExhausted(key: string) {
	exhaustedUntil.delete(key);
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
