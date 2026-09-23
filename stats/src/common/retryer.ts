import { CustomError } from "./error.js";
import { logger } from "./utils.js";

// Script variables.

// Collect available PAT key/token pairs so selection can never fall back
// to an unauthenticated request due to sparse key numbering (e.g. only
// PAT_1 and PAT_3 defined). Keys use the same `PAT_\d+` shape as
// `lib/tokens.ts` discovery; whitespace-only values are ignored.
// Resolved per invocation (not frozen at import) so env changes after
// module load (warm lambdas, per-request seeding) are honored.
interface PatEntry {
	key: string;
	token: string;
}

function getPatEntries(): PatEntry[] {
	return Object.keys(process.env)
		.filter((key) => /^PAT_\d+$/.exec(key))
		.map((key) => ({ key, token: (process.env[key] ?? "").trim() }))
		.filter((entry) => entry.token.length > 0)
		.sort((a, b) => {
			const na = Number(a.key.split("_")[1] || 0);
			const nb = Number(b.key.split("_")[1] || 0);
			return na - nb;
		});
}

// Historical fixed budget, kept for the test environment (and exported
// for the tests that assert exact attempt counts). Production always
// derives the budget from live env via `resolveEntries` below.
export const RETRIES = 7;

function resolveEntries(): PatEntry[] {
	const real = getPatEntries();
	if (real.length > 0) return real;
	if (process.env.NODE_ENV === "test") {
		// Deterministic phantom slots so rotation/count behavior stays
		// testable without ambient credentials. Tokens are empty by
		// construction and never leave the test process.
		return Array.from(
			{ length: RETRIES },
			(_, i) => ({ key: `PAT_${i + 1}`, token: "" }) as PatEntry,
		);
	}
	return [];
}

/**
 * Bounded exponential backoff with jitter between rotations, in ms.
 * Pure (no sleeping) so it is unit-testable; see `sleepBeforeRetry`.
 */
export function backoffMs(attempt: number): number {
	const capped = Math.min(200 * 2 ** Math.max(0, attempt), 2000);
	return capped + Math.floor(Math.random() * 100);
}

async function sleepBeforeRetry(attempt: number): Promise<void> {
	// Never slow down the test suite; production always waits.
	if (process.env.NODE_ENV === "test") return;
	await new Promise((resolve) => setTimeout(resolve, backoffMs(attempt)));
}

// A transient rate limit may clear within a minute; dead credentials stay
// sidelined longer. Split TTLs keep a flaky 429 from benching a healthy
// token for the full auth-failure window.
export const RATE_LIMIT_TTL_SECONDS = 60;
export const AUTH_FAILURE_TTL_SECONDS = 300;

/**
 * Record a failed token as exhausted (process-local + best-effort KV)
 * and wait out the backoff before the next rotation.
 * `lib/tokens.js` is imported lazily so merely loading this module has
 * no side effects (notably no dotenv load in tests).
 */
async function rotate(
	entry: PatEntry,
	attempt: number,
	ttlSeconds: number,
): Promise<void> {
	logger.log(`${entry.key} Failed`);
	try {
		const { markPatExhaustedAsync } = await import("../../../lib/tokens.js");
		await markPatExhaustedAsync(entry.key, ttlSeconds);
	} catch {
		// marking is best-effort; rotation proceeds regardless
	}
	await sleepBeforeRetry(attempt);
}

export type FetcherFunction<V> = (
	variables: V,
	token: string | undefined,
	retriesForTests?: number,
) => Promise<{
	data: {
		data?: any;
		message?: string;
		errors?: Array<{
			type?: string;
			message?: string;
		}>;
	};
	statusText: string;
	response?: {
		data?: {
			message?: string;
		};
	};
}>;

/**
 * Try to execute the fetcher function until it succeeds or the max number of retries is reached.
 *
 * The token budget is snapshotted once per top-level call: every attempt
 * uses a real configured token slot — never an unauthenticated extra call
 * in production. Rate-limited / bad / suspended tokens are marked
 * exhausted (so later requests skip them) and the next slot is tried
 * after a short backoff.
 *
 * @param fetcher The fetcher function.
 * @param variables Object with arguments to pass to the fetcher function.
 * @param retries How many times to retry.
 * @returns The response from the fetcher function.
 */
export const retryer = async <V>(
	fetcher: FetcherFunction<V>,
	variables: V,
	retries = 0,
): Promise<{
	data: {
		data?: any;
		message?: string;
		errors?: Array<{
			type?: string;
			message?: string;
		}>;
	};
	statusText: string;
	response?: {
		data?: {
			message?: string;
		};
	};
}> => {
	const slots = resolveEntries();
	if (slots.length === 0) {
		throw new CustomError("No GitHub API tokens found", CustomError.NO_TOKENS);
	}

	const attempt = async (
		n: number,
	): Promise<Awaited<ReturnType<typeof fetcher>>> => {
		if (n >= slots.length) {
			throw new CustomError(
				"Downtime due to GitHub API rate limiting",
				CustomError.MAX_RETRY,
			);
		}
		const entry = slots[n] as PatEntry;

		try {
			const response = await fetcher(
				variables,
				entry.token,
				// used in tests for faking rate limit
				n,
			);

			// react on both type and message-based rate-limit signals.
			// https://github.com/anuraghazra/github-readme-stats/issues/4425
			const errors = response?.data?.errors;
			const errorType = errors?.[0]?.type;
			const errorMsg = errors?.[0]?.message || "";

			// fetch-based transports RESOLVE on HTTP 401/403 instead of rejecting,
			// so auth/rate-limit failures surface here as normal responses whose
			// body carries a top-level `message`. Inspect it so bad/suspended/
			// rate-limited tokens rotate to the next PAT instead of being
			// returned as success.
			const bodyMessage = String(
				response?.data?.message ?? response?.response?.data?.message ?? "",
			);
			const isRateLimited =
				(errors && errorType === "RATE_LIMITED") ||
				/rate limit/i.test(errorMsg) ||
				/rate limit/i.test(bodyMessage);
			const isBadCredential = bodyMessage === "Bad credentials";
			const isAccountSuspended =
				bodyMessage === "Sorry. Your account was suspended.";

			// if rate limit is hit rotate to the next PAT after backoff
			if (isRateLimited || isBadCredential || isAccountSuspended) {
				await rotate(
					entry,
					n,
					isRateLimited && !isBadCredential && !isAccountSuspended
						? RATE_LIMIT_TTL_SECONDS
						: AUTH_FAILURE_TTL_SECONDS,
				);
				return attempt(n + 1);
			}

			// finally return the response
			return response;
		} catch (err: unknown) {
			// prettier-ignore
			// also checking for bad credentials if any tokens gets invalidated
			const isBadCredential =
				err &&
				typeof err === "object" &&
				"response" in err &&
				err.response &&
				typeof err.response === "object" &&
				"data" in err.response &&
				err.response.data &&
				typeof err.response.data === "object" &&
				"message" in err.response.data &&
				err.response.data.message === "Bad credentials";
			const isAccountSuspended =
				err &&
				typeof err === "object" &&
				"response" in err &&
				err.response &&
				typeof err.response === "object" &&
				"data" in err.response &&
				err.response.data &&
				typeof err.response.data === "object" &&
				"message" in err.response.data &&
				err.response.data.message === "Sorry. Your account was suspended.";

			if (isBadCredential || isAccountSuspended) {
				await rotate(entry, n, AUTH_FAILURE_TTL_SECONDS);
				return attempt(n + 1);
			}

			throw err;
		}
	};

	return attempt(retries);
};
