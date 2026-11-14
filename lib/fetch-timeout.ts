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
	const timeoutSignal =
		timeoutMs > 0 ? AbortSignal.timeout(timeoutMs) : undefined;
	// A caller-supplied signal is kept and combined with the timeout, so an
	// upstream abort still cancels the request.
	const signal =
		init?.signal && timeoutSignal
			? AbortSignal.any([init.signal, timeoutSignal])
			: (init?.signal ?? timeoutSignal);
	try {
		return await fetch(url, { ...init, signal });
	} catch (err: unknown) {
		// A DOMException is not an `Error` instance - match on the name. The
		// built-in timeout aborts with "TimeoutError"; a caller's signal
		// aborts with "AbortError". Both are timeouts from the caller's point
		// of view, and both become `Error("fetch-timeout")`.
		const name =
			typeof err === "object" && err !== null && "name" in err
				? (err as { name?: unknown }).name
				: undefined;
		if (name === "TimeoutError" || name === "AbortError") {
			throw new Error("fetch-timeout");
		}
		throw err;
	}
}
