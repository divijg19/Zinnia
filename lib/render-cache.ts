import crypto from "node:crypto";
import { emptyRenderer } from "./errors.js";
import { resolveTimeoutMs } from "./fetch-timeout.js";
import { resolveKvCredentials } from "./kv/credentials.js";
import { upstashCallWithin } from "./kv/upstash.js";

/**
 * Cross-instance cache for rendered SVG bodies, plus the stale-if-error policy
 * that keeps a README embed from ever rendering blank.
 *
 * Why this exists: the only cache in front of GitHub's API was the CDN. Every
 * revalidation of a 24h TTL re-ran the full fetch (measured 1.0-6.3s cold),
 * the five cards on one README page share a TTL and therefore expire together,
 * and GitHub Camo gives up after 10s of fetching. A miss inside that window
 * renders as a broken image that only a refresh appears to fix, because Camo
 * caches nothing on failure. Serving the previous render keeps the card
 * visible and bounds the origin's worst case well inside Camo's budget.
 *
 * Tiers, in read order:
 * 1. process memory - free, and serves warm instances
 * 2. Upstash KV     - shares renders across instances and deployments
 *
 * Both are best-effort. A KV outage degrades to the previous behavior (fetch
 * upstream) instead of failing the request.
 */

/**
 * KV budget. Deliberately far below the 5s used for PAT coordination: this call
 * sits in front of the render, so a slow KV must never be the reason an embed
 * exceeds Camo's fetch timeout.
 */
const RENDER_KV_TIMEOUT_MS = 400;

/**
 * How long a render stays usable once its freshness window closes. A day is
 * long enough to ride out an upstream or token outage, short enough that a
 * recovery replaces the card on the next request rather than days later.
 */
const STALE_WINDOW_SECONDS = 86400;

/**
 * TTL advertised when serving a stale render. Short on purpose: the body is
 * past its freshness window, so downstream caches (Camo included) should come
 * back quickly instead of pinning an out-of-date card for another day.
 */
export const STALE_SERVE_SECONDS = 60;

/**
 * Cap on entries held per service in process memory. Serverless instances are
 * short-lived so a small bound is plenty; it exists only to stop a pathological
 * parameter space (one entry per distinct query string) growing without limit.
 */
const MEMORY_ENTRIES_PER_SERVICE = 64;

/** Which tier produced a response body. `transient`/`fallback` are set by the error paths. */
export type CacheStatus = "hit" | "miss" | "stale";

export type CachedRender = {
	svg: string;
	/** Epoch ms after which the body should be refreshed but is still usable. */
	freshUntilMs: number;
	storedAtMs: number;
};

export type RenderOutcome = {
	svg: string;
	status: CacheStatus;
	/**
	 * Diagnostic headers the producer set while rendering (e.g. which streak
	 * renderer won). Empty on cache paths, where no producer ran and claiming
	 * one would be a lie.
	 */
	headers: Record<string, string>;
	/** Age of the served body in ms when it came from the cache. */
	ageMs: number;
	/** True when the producer overran its deadline and the stale body was used. */
	deadlineExceeded: boolean;
};

/**
 * What a producer may return: a bare SVG string, or one plus diagnostic
 * headers to re-apply when the body is actually served.
 */
export type RenderedSvg =
	| string
	| { svg: string; headers?: Record<string, string> };

/** Raised when a producer outlives its deadline. Never escapes this module. */
class RenderDeadlineError extends Error {
	constructor(readonly budgetMs: number) {
		super(`render deadline exceeded after ${budgetMs}ms`);
		this.name = "RenderDeadlineError";
	}
}

function namespace(): string {
	return (process.env.PAT_STORE_NAMESPACE || "zinnia").toLowerCase();
}

function kvKeyFor(service: string, cacheKey: string): string {
	const digest = crypto
		.createHash("sha1")
		.update(cacheKey, "utf8")
		.digest("hex")
		.slice(0, 24);
	return `${namespace()}:rc:${service.toLowerCase()}:${digest}`;
}

/**
 * Canonical cache identity for a card request.
 *
 * `debug` and `cache` are control parameters, not card content: `?cache=`
 * selects a TTL instead of describing a different card, and `?debug=1` asks
 * for JSON instead of an image. Excluding them means one URL family shares one
 * render and `?cache=` stops being a silent cache buster. Underscore params are
 * dropped so ad-hoc probes (the embed smoke script's `&_cb=`) exercise the real
 * cache rather than evicting it.
 */
export function renderCacheKey(url: URL): string {
	const entries = [...url.searchParams].sort(([a], [b]) =>
		a < b ? -1 : a > b ? 1 : 0,
	);
	const params = new URLSearchParams();
	for (const [key, value] of entries) {
		const lower = key.toLowerCase();
		if (lower === "debug" || lower === "cache") continue;
		if (key.startsWith("_")) continue;
		params.append(key, value);
	}
	const query = params.toString();
	return query ? `${url.pathname}?${query}` : url.pathname;
}

/** `RENDER_CACHE=0` turns the cache off entirely (tests, and field debugging). */
function enabled(): boolean {
	const raw = (process.env.RENDER_CACHE ?? "").trim().toLowerCase();
	return !(raw === "0" || raw === "false" || raw === "no" || raw === "off");
}

type MemoryEntry = { entry: CachedRender; expiresAtMs: number };
const memory = new Map<string, MemoryEntry>();
const memoryKey = (service: string, cacheKey: string) =>
	`${service}:${cacheKey}`;

function readMemory(service: string, cacheKey: string): CachedRender | null {
	const hit = memory.get(memoryKey(service, cacheKey));
	if (!hit) return null;
	if (Date.now() > hit.expiresAtMs) {
		memory.delete(memoryKey(service, cacheKey));
		return null;
	}
	return hit.entry;
}

function writeMemory(
	service: string,
	cacheKey: string,
	entry: CachedRender,
	expiresAtMs: number,
): void {
	const key = memoryKey(service, cacheKey);
	const prefix = `${service}:`;
	if (!memory.has(key)) {
		let own = 0;
		for (const k of memory.keys()) if (k.startsWith(prefix)) own++;
		// Map preserves insertion order, so the first owned key is the oldest.
		for (const k of memory.keys()) {
			if (own < MEMORY_ENTRIES_PER_SERVICE) break;
			if (k.startsWith(prefix)) {
				memory.delete(k);
				own--;
			}
		}
	}
	memory.set(key, { entry, expiresAtMs });
}

/** Drop every process-local entry. Exported for tests. */
export function clearRenderMemory(): void {
	memory.clear();
}

type KvPayload = { v: 1; ts: number; fresh: number; svg: string };

function toCachedRender(payload: KvPayload): CachedRender | null {
	if (
		payload?.v !== 1 ||
		typeof payload.svg !== "string" ||
		!payload.svg ||
		!Number.isFinite(Number(payload.ts))
	) {
		return null;
	}
	const ts = Number(payload.ts);
	const fresh = Number.isFinite(Number(payload.fresh))
		? Number(payload.fresh)
		: 0;
	return { svg: payload.svg, storedAtMs: ts, freshUntilMs: ts + fresh * 1000 };
}

async function readKv(
	service: string,
	cacheKey: string,
): Promise<CachedRender | null> {
	const creds = resolveKvCredentials();
	if (!creds) return null;
	try {
		const raw = await upstashCallWithin(
			creds.url,
			creds.token,
			RENDER_KV_TIMEOUT_MS,
			"GET",
			kvKeyFor(service, cacheKey),
		);
		if (typeof raw !== "string" || !raw) return null;
		return toCachedRender(JSON.parse(raw) as KvPayload);
	} catch {
		return null;
	}
}

async function writeKv(
	service: string,
	cacheKey: string,
	svg: string,
	freshSeconds: number,
): Promise<void> {
	const creds = resolveKvCredentials();
	if (!creds || !svg) return;
	const payload: KvPayload = {
		v: 1,
		ts: Date.now(),
		fresh: Math.max(0, Math.floor(freshSeconds)),
		svg,
	};
	const ttl = Math.max(1, Math.floor(freshSeconds) + STALE_WINDOW_SECONDS);
	try {
		await upstashCallWithin(
			creds.url,
			creds.token,
			RENDER_KV_TIMEOUT_MS,
			"SET",
			kvKeyFor(service, cacheKey),
			JSON.stringify(payload),
			"EX",
			String(ttl),
		);
	} catch {
		// best-effort: a failed write only costs a refetch next time
	}
}

function expiresAtFor(entry: CachedRender): number {
	return entry.freshUntilMs + STALE_WINDOW_SECONDS * 1000;
}

/**
 * Read a render from every tier. Returns the cached body whether fresh or past
 * its freshness window; callers decide which it is.
 */
export async function getCachedRender(
	service: string,
	cacheKey: string,
): Promise<CachedRender | null> {
	if (!enabled()) return null;
	const fromMemory = readMemory(service, cacheKey);
	if (fromMemory) return fromMemory;
	const fromKv = await readKv(service, cacheKey);
	if (!fromKv) return null;
	// Promote, so the next request on this instance skips KV entirely.
	const expiresAtMs = expiresAtFor(fromKv);
	if (Date.now() <= expiresAtMs) {
		writeMemory(service, cacheKey, fromKv, expiresAtMs);
	}
	return fromKv;
}

export async function setCachedRender(
	service: string,
	cacheKey: string,
	svg: string,
	freshSeconds: number,
): Promise<void> {
	if (!enabled() || !svg) return;
	const now = Date.now();
	const entry: CachedRender = {
		svg,
		storedAtMs: now,
		freshUntilMs: now + Math.max(0, Math.floor(freshSeconds)) * 1000,
	};
	writeMemory(service, cacheKey, entry, expiresAtFor(entry));
	await writeKv(service, cacheKey, svg, freshSeconds);
}

/** An in-flight render attempt. Compared by identity, never by promise value. */
type InFlightSlot = { promise: Promise<RenderedSvg> };

const inFlight = new Map<string, InFlightSlot>();

/** Renders currently coalescing. Exported for tests. */
export function inFlightCount(): number {
	return inFlight.size;
}

/**
 * Wall-clock budget for a render when a cached body is available. At this point
 * the deadline is not a hard limit but a latency choice: hitting it means a
 * stale card can be served immediately, so there is nothing to gain by waiting.
 */
export const RENDER_DEADLINE_MS = 3500;

/**
 * Budget when there is nothing cached, so the real card is the only good answer
 * and an error card would be strictly worse.
 *
 * Chosen to sit above the longest outbound fetch budget (`resolveTimeoutMs`
 * defaults to 8000ms) and below GitHub Camo's 10s origin fetch timeout: the
 * ceiling therefore only ever fires after the upstream has already given up,
 * and the response still reaches an embedder inside its window. Measured cold
 * stats fetches run 2.7-6.3s, which a single 3500ms budget truncated - roughly
 * a quarter of cold renders returned an error card instead.
 */
export const RENDER_CEILING_MS = 8500;

/**
 * Budget for one render. See the two constants for why they differ.
 *
 * Both are overridable per deployment (`RENDER_DEADLINE_MS`,
 * `RENDER_CEILING_MS`); `deadlineMs` on the call overrides both, which is how
 * tests drive the timeout deterministically.
 */
export function renderBudgetMs(hasCachedBody: boolean): number {
	return resolveTimeoutMs(
		hasCachedBody
			? process.env.RENDER_DEADLINE_MS
			: process.env.RENDER_CEILING_MS,
		hasCachedBody ? RENDER_DEADLINE_MS : RENDER_CEILING_MS,
	);
}

/**
 * Run `produce` at most once per card at a time, persisting the result once.
 *
 * Coalescing is what stops a README page's five cards - sharing a TTL, and so
 * expiring together - from issuing five simultaneous GitHub API calls and
 * tripping secondary rate limits. Every awaiter shares the winner's body.
 */
function produceCoalesced(
	coalesceKey: string,
	produce: () => Promise<RenderedSvg>,
	persist: (result: RenderedSvg) => Promise<void>,
): InFlightSlot {
	const existing = inFlight.get(coalesceKey);
	if (existing) return existing;
	// Identity token, filled in below. Comparing slots rather than promises
	// keeps a settled slot from being cleared by (or clearing) a newer attempt.
	const slot: InFlightSlot = {
		promise: undefined as unknown as Promise<RenderedSvg>,
	};
	slot.promise = (async () => {
		try {
			const result = await produce();
			await persist(result);
			return result;
		} finally {
			releaseInFlight(coalesceKey, slot);
		}
	})();
	inFlight.set(coalesceKey, slot);
	return slot;
}

/** Clear a slot, but only if it is still the current attempt for that card. */
function releaseInFlight(coalesceKey: string, slot: InFlightSlot): void {
	if (inFlight.get(coalesceKey) === slot) inFlight.delete(coalesceKey);
}

/**
 * A deadline that rejects with `RenderDeadlineError`. Always disposed by the
 * caller so a cache deadline can never hold the event loop open.
 */
function withDeadline<T>(promise: Promise<T>, budgetMs: number) {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const guard =
		budgetMs > 0
			? new Promise<never>((_resolve, reject) => {
					timer = setTimeout(
						() => reject(new RenderDeadlineError(budgetMs)),
						budgetMs,
					);
					// A pending cache deadline must never keep the instance alive.
					timer.unref?.();
				})
			: null;
	const settled = guard ? Promise.race([promise, guard]) : promise;
	const dispose = () => {
		if (timer !== undefined) clearTimeout(timer);
	};
	return { settled, dispose };
}

/**
 * Serve a card from cache when possible, otherwise render it, and fall back to
 * the last known good render instead of an error card.
 *
 * 1. cached and still fresh  -> `hit`, no upstream call at all
 * 2. producer succeeds       -> `miss`, cached for next time
 * 3. producer fails/overruns -> `stale`, the previous render
 * 4. nothing cached          -> rethrow, so the route's error card applies
 *
 * `freshSeconds` is the caller's resolved CDN TTL and doubles as the stored
 * render's freshness window.
 */
export async function renderWithFallback(options: {
	service: string;
	cacheKey: string;
	freshSeconds: number;
	/**
	 * The entry already read for this card. Required rather than looked up
	 * internally: every route needs it anyway - card-handler to survive a
	 * missing PAT, streak to answer before running its flow - and making the
	 * caller pass it keeps the cache read visible at each call site instead of
	 * hidden behind an optional parameter with three possible meanings.
	 */
	cached: CachedRender | null;
	produce: () => Promise<RenderedSvg>;
	deadlineMs?: number;
}): Promise<RenderOutcome> {
	const { service, cacheKey, freshSeconds, produce, cached } = options;
	const budgetMs = options.deadlineMs ?? renderBudgetMs(Boolean(cached));

	if (cached && Date.now() < cached.freshUntilMs) {
		return {
			svg: cached.svg,
			status: "hit",
			headers: {},
			ageMs: Date.now() - cached.storedAtMs,
			deadlineExceeded: false,
		};
	}

	const slot = produceCoalesced(
		`${service}:${cacheKey}`,
		produce,
		async (result) => {
			await setCachedRender(
				service,
				cacheKey,
				typeof result === "string" ? result : result.svg,
				freshSeconds,
			);
		},
	);
	const { settled, dispose } = withDeadline(slot.promise, budgetMs);

	try {
		const produced = await settled;
		const svg = typeof produced === "string" ? produced : produced.svg;
		if (!svg) emptyRenderer(service);
		return {
			svg,
			status: "miss",
			headers: typeof produced === "string" ? {} : (produced.headers ?? {}),
			ageMs: 0,
			deadlineExceeded: false,
		};
	} catch (err) {
		// The producer may still resolve (and persist) after we stop waiting.
		// `settled` is a race participant, so its later settlement - including
		// rejection - is already handled and cannot surface as an unhandled
		// rejection here.
		if (err instanceof RenderDeadlineError) {
			// A producer that never settles would otherwise hold its coalescing
			// slot forever: every later request would join the hung attempt and be
			// served the same stale card, with no path back to a real render.
			releaseInFlight(`${service}:${cacheKey}`, slot);
		}
		if (cached) {
			return {
				svg: cached.svg,
				status: "stale",
				headers: {},
				ageMs: Date.now() - cached.storedAtMs,
				deadlineExceeded: err instanceof RenderDeadlineError,
			};
		}
		throw err;
	} finally {
		dispose();
	}
}

/**
 * TTL to advertise for an outcome. Fresh bodies keep the caller's resolved TTL;
 * a stale body gets the short window so downstream caches come back soon.
 */
export function ttlForOutcome(
	outcome: RenderOutcome,
	resolvedSeconds: number,
): number {
	return outcome.status === "stale" ? STALE_SERVE_SECONDS : resolvedSeconds;
}

/** Record which tier produced the body. */
export function markCacheStatus(
	res: { setHeader: (k: string, v: string) => unknown },
	status: CacheStatus,
): void {
	res.setHeader("X-Cache-Status", status);
}
