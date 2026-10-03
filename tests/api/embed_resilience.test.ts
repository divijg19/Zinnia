import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { headerValue, makeReq, makeRes, type TestResponse } from "../_testShim";

// This suite exercises the render cache, so opt back in past the suite-wide
// default (see tests/vitest.setup.ts).
process.env.RENDER_CACHE = "1";

vi.mock("dotenv", () => ({ config: () => ({}) }));

const fetchStats = vi.hoisted(() => vi.fn());
vi.mock("../../stats/src/fetchers/stats", () => ({ fetchStats }));

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<unknown>;

/** Fresh module graph per test so each gets its own render cache. */
async function load(overrides?: { throwWith?: unknown }) {
	vi.resetModules();
	fetchStats.mockReset();
	fetchStats.mockResolvedValue({
		name: "Alice",
		totalStars: 1,
		totalCommits: 2,
		totalIssues: 3,
		totalPRs: 4,
		totalPRsMerged: 0,
		mergedPRsPercentage: 0,
		totalReviews: 0,
		totalDiscussionsStarted: 0,
		totalDiscussionsAnswered: 0,
		contributedTo: 0,
		rank: { level: "C", percentile: 50 },
	});
	if (overrides?.throwWith) fetchStats.mockRejectedValue(overrides.throwWith);
	const rc = await import("../../lib/render-cache.js");
	const { default: handler } = await import("../../api/stats.js");
	return { handler, rc, stats: fetchStats };
}

const URL_PATH = "/api/stats?username=alice&theme=watchdog";
/** Canonical cache identity for {@link URL_PATH} (params are sorted). */
const cacheKeyFor = (rc: { renderCacheKey: (u: URL) => string }) =>
	rc.renderCacheKey(new URL(`http://localhost${URL_PATH}`));

/** Invoke a card route with the shared response shim and return the shim. */
async function call(handler: Handler): Promise<TestResponse> {
	const res = makeRes();
	await handler(
		makeReq(URL_PATH) as unknown as VercelRequest,
		res as unknown as VercelResponse,
	);
	return res;
}

describe("card route render cache", () => {
	beforeEach(() => {
		delete process.env.UPSTASH_REST_URL;
		delete process.env.UPSTASH_REST_TOKEN;
	});

	afterEach(() => {
		delete process.env.PAT_1;
		process.env.RENDER_CACHE = "1";
	});

	it("renders once, then serves the cached body without re-fetching", async () => {
		process.env.PAT_1 = "ghp_test_token";
		const { handler, stats } = await load();

		const first = await call(handler);
		expect(first._status()).toBe(200);
		expect(headerValue(first, "x-cache-status")).toBe("miss");
		expect(stats).toHaveBeenCalledTimes(1);

		const second = await call(handler);
		expect(second._status()).toBe(200);
		expect(headerValue(second, "x-cache-status")).toBe("hit");
		expect(second._body()).toBe(first._body());
		// The whole point: the second embed request never touches GitHub.
		expect(stats).toHaveBeenCalledTimes(1);
	});

	it("shares one render between ?debug and image requests", async () => {
		process.env.PAT_1 = "ghp_test_token";
		const { handler, stats } = await load();

		await call(handler);
		const debug = makeRes();
		await handler(
			makeReq(`${URL_PATH}&debug=1`) as unknown as VercelRequest,
			debug as unknown as VercelResponse,
		);

		expect(headerValue(debug, "content-type")).toContain("application/json");
		const payload = JSON.parse(debug._body());
		expect(payload.cache.status).toBe("hit");
		expect(stats).toHaveBeenCalledTimes(1);
	});

	it("serves the previous render when the fetch fails", async () => {
		process.env.PAT_1 = "ghp_test_token";
		const { handler, rc } = await load({
			throwWith: new Error("upstream down"),
		});
		await rc.setCachedRender(
			"stats",
			cacheKeyFor(rc),
			"<svg>PREVIOUS</svg>",
			0,
		);

		const res = await call(handler);

		expect(res._status()).toBe(200);
		expect(res._body()).toContain("PREVIOUS");
		expect(headerValue(res, "x-cache-status")).toBe("stale");
		// Short TTL: an out-of-date card must not be pinned downstream.
		expect(headerValue(res, "cache-control")).toContain("max-age=60");
		expect(headerValue(res, "etag")).toMatch(/^"[0-9a-f]+"$/);
	});

	it("prefers fresh data over a stale entry when the fetch succeeds", async () => {
		process.env.PAT_1 = "ghp_test_token";
		const { handler, rc, stats } = await load();
		await rc.setCachedRender(
			"stats",
			cacheKeyFor(rc),
			"<svg>PREVIOUS</svg>",
			0,
		);

		const res = await call(handler);

		expect(res._body()).not.toContain("PREVIOUS");
		expect(headerValue(res, "x-cache-status")).toBe("miss");
		expect(stats).toHaveBeenCalledTimes(1);
	});

	it("reports a diagnosable failure instead of a blank timing block", async () => {
		// The deadline bug shipped because the diagnostic that would have named it
		// came back with `timing: {}` and a `cache` block carrying no status, so a
		// reader of `?debug=1` had no way to tell a slow render from a broken one.
		process.env.PAT_1 = "ghp_test_token";
		const { handler } = await load({ throwWith: new Error("upstream down") });

		const res = makeRes();
		await handler(
			makeReq(`${URL_PATH}&debug=1`) as unknown as VercelRequest,
			res as unknown as VercelResponse,
		);
		const payload = JSON.parse(res._body());

		expect(payload.stage).toBe("error");
		expect(payload.code).toBe("STATS_INTERNAL");
		expect(payload.error).toContain("upstream down");
		expect(payload.timing.totalMs).toBeGreaterThanOrEqual(0);
		expect(payload.cache.status).toBe("miss");
		expect(payload.cache.ttlSeconds).toBe(86400);
	});

	it("serves a degraded card as a success, and says it was stale", async () => {
		// A producer failure with a cached body is not an error response: the route
		// answers 200 with the previous render. The diagnostics must reflect that
		// rather than report a failure, and must not claim a fetch happened.
		process.env.PAT_1 = "ghp_test_token";
		const { handler, rc } = await load({
			throwWith: new Error("upstream down"),
		});
		await rc.setCachedRender(
			"stats",
			cacheKeyFor(rc),
			"<svg>PREVIOUS</svg>",
			0,
		);

		const res = makeRes();
		await handler(
			makeReq(`${URL_PATH}&debug=1`) as unknown as VercelRequest,
			res as unknown as VercelResponse,
		);
		const payload = JSON.parse(res._body());

		expect(payload.ok).toBe(true);
		expect(payload.stage).toBe("done");
		expect(payload.cache.status).toBe("stale");
		expect(payload.cache.ageMs).toBeGreaterThanOrEqual(0);
		expect(payload.timing.fetchMs).toBeUndefined();
		expect(payload.timing.totalMs).toBeGreaterThanOrEqual(0);
	});

	it("reports an error card when there is nothing cached to fall back on", async () => {
		process.env.PAT_1 = "ghp_test_token";
		const { handler } = await load({ throwWith: new Error("upstream down") });

		const res = await call(handler);

		expect(res._status()).toBe(200);
		expect(res._body()).toContain("<svg");
		expect(res._body()).toContain("ZINNIA_ERR:STATS_INTERNAL");
		expect(headerValue(res, "x-cache-status")).toBe("transient");
	});

	it("keeps the embed rendering while a PAT is missing, and says so in ?debug=1", async () => {
		const { handler, rc } = await load();
		await rc.setCachedRender(
			"stats",
			cacheKeyFor(rc),
			"<svg>PREVIOUS</svg>",
			0,
		);
		delete process.env.PAT_1;

		// A deploy without a PAT cannot render, but the trophy route already
		// answers from cache in that state; a README embed should not go blank
		// just because an environment variable is missing.
		const res = await call(handler);
		expect(res._status()).toBe(200);
		expect(res._body()).toContain("PREVIOUS");
		expect(headerValue(res, "x-cache-status")).toBe("stale");
		// Short TTL: the misconfiguration is re-checked constantly, not papered over.
		expect(headerValue(res, "cache-control")).toContain("max-age=60");

		// ...and stays unambiguous for whoever is deploying.
		const debug = makeRes();
		await handler(
			makeReq(`${URL_PATH}&debug=1`) as unknown as VercelRequest,
			debug as unknown as VercelResponse,
		);
		const payload = JSON.parse(debug._body());
		expect(payload.stage).toBe("validation");
		expect(payload.code).toBe("STATS_RATE_LIMIT");
		expect(payload.error).toContain("PAT_1");
		expect(payload.validation.patConfigured).toBe(false);
	});

	it("still reports the missing PAT when there is nothing cached", async () => {
		const { handler } = await load();
		delete process.env.PAT_1;

		const res = await call(handler);

		expect(res._body()).toContain("PAT_1");
		expect(headerValue(res, "x-cache-status")).toBe("transient");
	});

	it("serves a fresh cached card without a PAT at full freshness", async () => {
		const { handler, rc } = await load();
		await rc.setCachedRender(
			"stats",
			cacheKeyFor(rc),
			"<svg>PREVIOUS</svg>",
			3600,
		);
		delete process.env.PAT_1;

		const res = await call(handler);

		expect(res._body()).toContain("PREVIOUS");
		expect(headerValue(res, "x-cache-status")).toBe("hit");
		expect(headerValue(res, "cache-control")).toContain("max-age=86400");
	});
});

describe("missing user reporting", () => {
	afterEach(() => {
		delete process.env.PAT_1;
		process.env.RENDER_CACHE = "1";
	});

	it("names the username and uses USER_NOT_FOUND instead of 'internal error'", async () => {
		process.env.PAT_1 = "ghp_test_token";
		const err = Object.assign(new Error("Could not fetch user."), {
			type: "USER_NOT_FOUND",
		});
		const { handler } = await load({ throwWith: err });

		const res = await call(handler);

		expect(res._status()).toBe(200);
		expect(res._body()).toContain("alice");
		expect(res._body()).toContain("ZINNIA_ERR:USER_NOT_FOUND");
		expect(res._body()).not.toContain("internal error");
	});

	it("reports USER_NOT_FOUND in ?debug=1 too", async () => {
		process.env.PAT_1 = "ghp_test_token";
		const err = Object.assign(new Error("Could not fetch user."), {
			type: "USER_NOT_FOUND",
		});
		const { handler } = await load({ throwWith: err });
		const res = makeRes();
		await handler(
			makeReq(`${URL_PATH}&debug=1`) as unknown as VercelRequest,
			res as unknown as VercelResponse,
		);
		const payload = JSON.parse(res._body());
		expect(payload.code).toBe("USER_NOT_FOUND");
		expect(payload.stage).toBe("error");
	});

	it("recognises GitHub's 'could not resolve to a user' wording", async () => {
		const { isUserNotFoundError } = await import("../../lib/user-errors.js");
		expect(
			isUserNotFoundError(
				new Error("Could not resolve to a User with the login"),
			),
		).toBe(true);
		expect(isUserNotFoundError(new Error("Something went wrong"))).toBe(false);
		expect(isUserNotFoundError("Could not resolve to a User")).toBe(false);
		expect(isUserNotFoundError(null)).toBe(false);
	});
});
