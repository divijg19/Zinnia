// Shared fetch-with-timeout helper.
//
// Zero imports by design: safe to use from any runtime layer (api routes,
// stats fetchers, leetcode core, token stores) without creating import
// cycles. On timeout the fetch rejects with `Error("fetch-timeout")` so
// callers can distinguish an abort from other network failures.
//
// NOTE: timeouts fail fast by design. On Hobby-tier functions (~10s
// budget) rotating through N tokens × timeout would exceed the platform
// limit, so callers must surface the error response immediately instead
// of retrying other tokens.

export const DEFAULT_FETCH_TIMEOUT_MS = 8000;

/** Parse an env-provided timeout; fall back on missing/invalid values. */
export function resolveTimeoutMs(
	raw: string | undefined,
	fallback: number = DEFAULT_FETCH_TIMEOUT_MS,
): number {
	if (raw === undefined) return fallback;
	const n = Number(raw);
	return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Fetch that aborts after `timeoutMs` (no-op when `<= 0`). */
export async function fetchWithTimeout(
	url: string | URL | Request,
	init: RequestInit | undefined,
	timeoutMs: number,
): Promise<Response> {
	const controller = new AbortController();
	const timer =
		timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;
	try {
		return await fetch(url, { ...init, signal: controller.signal });
	} catch (err: unknown) {
		// DOMException (abort) is not instanceof Error — match on name.
		if (
			(err instanceof Error && err.name === "AbortError") ||
			(typeof err === "object" &&
				err !== null &&
				"name" in err &&
				(err as { name?: unknown }).name === "AbortError")
		) {
			throw new Error("fetch-timeout");
		}
		throw err;
	} finally {
		if (timer !== null) clearTimeout(timer);
	}
}
