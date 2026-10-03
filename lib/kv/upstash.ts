import { fetchWithTimeout } from "../fetch-timeout.js";

/**
 * Shared Upstash REST primitives (no external deps).
 *
 * Both `lib/patStore.ts` and `streak/src/cache.ts` build on these; KV must
 * never gate rendering, so every call fails fast. Callers swallow failures
 * into their in-memory fallbacks.
 */
export const KV_CALL_TIMEOUT_MS = 5000;

export async function upstashCall(
	url: string,
	token: string,
	cmd: string,
	...args: string[]
): Promise<unknown> {
	return upstashCallWithin(url, token, KV_CALL_TIMEOUT_MS, cmd, ...args);
}

/**
 * `upstashCall` with an explicit per-call budget.
 *
 * The default 5s suits PAT coordination, which runs off the critical path.
 * Callers that sit in front of a render (the render cache) pass a much smaller
 * budget so a slow KV can never be the reason an embed exceeds GitHub Camo's
 * fetch timeout. The budget is a named parameter rather than a trailing
 * variadic one so a caller can never silently pass it as a Redis argument.
 */
export async function upstashCallWithin(
	url: string,
	token: string,
	timeoutMs: number,
	cmd: string,
	...args: string[]
): Promise<unknown> {
	const body = JSON.stringify([cmd, ...args]);
	const res = await fetchWithTimeout(
		url,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body,
		},
		timeoutMs,
	);
	if (!res.ok) {
		// Try to capture response text for diagnostics but limit size.
		let text = "";
		try {
			text = (await res.text()).slice(0, 200);
		} catch {}
		const msg = `upstash request failed: ${res.status}${text ? `:${text}` : ""}`;
		throw new Error(msg);
	}
	const j = await res.json();
	return j?.result ?? null;
}

/** Find the first present env var from a candidate list (case-insensitive). */
export function findEnv(...names: string[]): string | undefined {
	for (const n of names) {
		if (process.env[n]) return process.env[n] as string;
		const up = n.toUpperCase();
		if (process.env[up]) return process.env[up] as string;
		const low = n.toLowerCase();
		if (process.env[low]) return process.env[low] as string;
	}
	return undefined;
}
