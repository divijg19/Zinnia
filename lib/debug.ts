import type { VercelResponse } from "@vercel/node";
import type { RenderOutcome } from "./render-cache.js";

/**
 * `?debug=1` diagnostics, shared by every card route.
 *
 * Lived split between `lib/params.ts` (the flag) and `lib/errors.ts` (the JSON
 * writer), which meant only the routes built on `createCardHandler` could offer
 * diagnostics: `/api/trophy`, `/api/leetcode` and `/api/streak` silently
 * returned an SVG to a `?debug=1` request. The shape below is the contract the
 * README documents - the validation stage, PAT presence (never its value), and
 * fetch/render timings - so every route can answer with it.
 */

export type Diag = {
	service: string;
	ok: boolean;
	stage: string;
	timing: Record<string, unknown>;
	params?: Record<string, unknown>;
	validation?: Record<string, unknown>;
	cache?: Record<string, unknown>;
	render?: Record<string, unknown>;
	error?: string;
	code?: string;
};

/** Fresh diagnostics for one request. Callers mutate it as stages complete. */
export function newDiag(service: string): Diag {
	return { service, ok: false, stage: "init", timing: {} };
}

/** `?debug=1` / `?debug=true` flag. Anything else is a normal card request. */
export function getDebugFlag(url: URL): boolean {
	const value = (url.searchParams.get("debug") || "").toLowerCase();
	return value === "1" || value === "true";
}

/**
 * Send diagnostics JSON. Never cached: a debug response must not be able to
 * occupy a cache slot that a real card request would read back.
 */
export function sendDebugJson(
	res: VercelResponse,
	payload: Record<string, unknown>,
) {
	try {
		res.setHeader("Content-Type", "application/json; charset=utf-8");
	} catch {}
	try {
		res.setHeader("Cache-Control", "no-store");
	} catch {}
	try {
		res.status(200);
	} catch {}
	return res.send(JSON.stringify(payload, null, 2));
}

/**
 * Render-cache facts for the diagnostics payload. On a cache path there is no
 * fetch, so `fetchMs` is absent rather than zero - the distinction between
 * "fast because cached" and "fetched instantly" is the whole point.
 */
export function describeCacheOutcome(outcome: RenderOutcome) {
	return {
		status: outcome.status,
		ageMs: outcome.ageMs,
		deadlineExceeded: outcome.deadlineExceeded,
	};
}
