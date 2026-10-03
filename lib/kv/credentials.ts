/**
 * KV endpoint resolution, shared by every KV consumer in the repo.
 *
 * The candidate lists lived inline in `lib/patStore.ts`. The render cache
 * needs the same endpoint discovery, and duplicating a thirty-name env-var
 * ladder would let the two drift — a PAT store pointed at one bucket while
 * renders are cached in another. One resolution, one source of truth.
 *
 * `UPSTASH_PREFIX` is read per call rather than frozen at import so a
 * marketplace install that injects its env late still resolves (same
 * rationale as `stats/src/common/retryer.ts`).
 */
import { findEnv } from "./upstash.js";

const URL_CANDIDATES = [
	"UPSTASH_KV_REST_API_URL",
	"UPSTASH_REST_URL",
	"UPSTASH_URL",
	"UPSTASH_KV_URL",
	"UPSTASH_REDIS_URL",
	"ZINNIA_REST_URL",
	"ZINNIA_KV_REST_API_URL",
	"ZINNIA_KV_URL",
];

const TOKEN_CANDIDATES = [
	"UPSTASH_KV_REST_API_TOKEN",
	"UPSTASH_KV_REST_API_READ_ONLY_TOKEN",
	"UPSTASH_REST_TOKEN",
	"UPSTASH_TOKEN",
	"ZINNIA_REST_TOKEN",
	"ZINNIA_KV_REST_API_TOKEN",
];

export type KvCredentials = { url: string; token: string };

/**
 * Candidates with the marketplace prefix substituted, e.g. `UPSTASH_PREFIX=ZINNIA`
 * turns `UPSTASH_REST_URL` into `ZINNIA_REST_URL`. The unprefixed names stay in
 * the list so a hand-rolled install keeps working.
 */
function candidates(base: string[]): string[] {
	const prefix = (process.env.UPSTASH_PREFIX || "UPSTASH").toUpperCase();
	const prefixed = base.map((name) => `${prefix}_${name}`);
	// De-duplicate: the default prefix reproduces the base names verbatim.
	return [...new Set([...prefixed, ...base])];
}

/** Resolved Upstash REST credentials, or `null` when KV is not configured. */
export function resolveKvCredentials(): KvCredentials | null {
	const url = findEnv(...candidates(URL_CANDIDATES));
	const token = findEnv(...candidates(TOKEN_CANDIDATES));
	if (!url || !token) return null;
	return { url, token };
}

/**
 * Whether *any* KV env var looks configured. Provider selection in
 * `lib/patStore.ts` prefers Upstash over managed Redis when both are present;
 * this is the cheap "should we even try" probe for that decision.
 */
export function hasKvEnvHint(): boolean {
	return Boolean(findEnv(...candidates(URL_CANDIDATES)));
}

export function hasManagedRedisEnv(): boolean {
	return Boolean(process.env.REDIS_URL);
}
