import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, describe, expect, it, type Mock, vi } from "vitest";
import type { TestResponse } from "../_testShim";
import {
	makeReq as makeShimReq,
	makeRes as makeShimRes,
	required,
	restorePatEnv,
	snapshotPatEnv,
} from "../_testShim";

/**
 * The reliability contract of the card routes.
 *
 * The stats and top-langs routes are the same handler with a different
 * service behind it, so their contract is one contract. These cases run
 * against both, and the two suites they replaced were copies of each other
 * with the service swapped.
 */

const STATS_FIXTURE = {
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
};

const TOPLANGS_FIXTURE = {
	langs: [{ name: "TypeScript", color: "#3178c6", size: 123, count: 1 }],
	totalLanguageSize: 123,
};

vi.mock("../../stats/src/fetchers/stats", () => ({
	fetchStats: vi.fn(async () => STATS_FIXTURE),
}));

vi.mock("../../stats/src/fetchers/top-languages", () => ({
	fetchTopLanguages: vi.fn(async () => TOPLANGS_FIXTURE),
}));

vi.mock("../../stats/src/cards/stats", () => ({
	renderStatsCard: vi.fn(() => '<svg id="stats-rendered"></svg>'),
}));

vi.mock("../../stats/src/cards/top-languages", () => ({
	renderTopLanguages: vi.fn(() => '<svg id="toplangs-rendered"></svg>'),
}));

type ShimRes = VercelResponse &
	Pick<TestResponse, "_headers" | "_body" | "_status">;

function makeReq(urlPath: string): VercelRequest {
	return makeShimReq(urlPath) as unknown as VercelRequest;
}

function makeRes(): ShimRes {
	return makeShimRes() as unknown as ShimRes;
}

/** One card route, with the service-specific parts of the contract. */
type Route = {
	label: string;
	/** The route module, loaded fresh per case. */
	load: () => Promise<
		(req: VercelRequest, res: VercelResponse) => Promise<unknown>
	>;
	/** The URL the route is called with. */
	url: string;
	/** The marker the mocked renderer puts in the body. */
	rendered: string;
	/** The service name in the diagnostics payload. */
	service: string;
	/** The error code an empty render carries. */
	internalCode: string;
	/** The error code a missing PAT carries. */
	rateLimitCode: string;
	/** The mocked fetcher module and the export to drive. */
	fetcherModule: () => Promise<Record<string, Mock>>;
	fetchExport: string;
	/** The mocked card renderer module and the export to drive. */
	cardModule: () => Promise<Record<string, Mock>>;
	cardExport: string;
};

const ROUTES: Route[] = [
	{
		label: "/api/stats",
		load: async () => (await import("../../api/stats.js")).default,
		url: "/api/stats?username=alice&theme=watchdog",
		rendered: "stats-rendered",
		service: "stats",
		internalCode: "STATS_INTERNAL",
		rateLimitCode: "STATS_RATE_LIMIT",
		fetcherModule: async () =>
			(await import("../../stats/src/fetchers/stats.js")) as unknown as Record<
				string,
				Mock
			>,
		fetchExport: "fetchStats",
		cardModule: async () =>
			(await import("../../stats/src/cards/stats.js")) as unknown as Record<
				string,
				Mock
			>,
		cardExport: "renderStatsCard",
	},
	{
		label: "/api/top-langs",
		load: async () => (await import("../../api/top-langs.js")).default,
		url: "/api/top-langs?username=alice&theme=watchdog&layout=compact",
		rendered: "toplangs-rendered",
		service: "top-langs",
		internalCode: "TOP_LANGS_INTERNAL",
		rateLimitCode: "TOP_LANGS_RATE_LIMIT",
		fetcherModule: async () =>
			(await import(
				"../../stats/src/fetchers/top-languages.js"
			)) as unknown as Record<string, Mock>,
		fetchExport: "fetchTopLanguages",
		cardModule: async () =>
			(await import(
				"../../stats/src/cards/top-languages.js"
			)) as unknown as Record<string, Mock>,
		cardExport: "renderTopLanguages",
	},
];

for (const route of ROUTES) {
	describe(`${route.label} wrapper reliability`, () => {
		afterEach(() => {
			delete process.env.PAT_1;
			vi.resetModules();
		});

		it("renders via fetcher + renderer", async () => {
			process.env.PAT_1 = "ghp_test_token";
			const handler = await route.load();
			const res = makeRes();
			await handler(makeReq(route.url), res);

			expect(res._status()).toBe(200);
			expect(res._body()).toContain("<svg");
			expect(res._body()).toContain(route.rendered);
			expect(res._headers.get("content-type") ?? "").toContain("image/svg");
		});

		it("does not leak a request token into subsequent requests", async () => {
			const saved = snapshotPatEnv();
			try {
				const handler = await route.load();
				const req = makeReq(route.url);
				Object.assign(req.headers, { authorization: "Bearer BADTOKEN" });
				const res = makeRes();
				await handler(req, res);

				expect(res._status()).toBe(200);
				expect(process.env.PAT_1).toBeUndefined();
			} finally {
				restorePatEnv(saved);
			}
		});

		it("preserves a pre-existing PAT_1 across requests", async () => {
			const saved = snapshotPatEnv();
			try {
				process.env.PAT_1 = "ghp_original";
				const handler = await route.load();
				const req = makeReq(route.url);
				Object.assign(req.headers, { authorization: "Bearer OTHERTOKEN" });
				await handler(req, makeRes());

				expect(process.env.PAT_1).toBe("ghp_original");
			} finally {
				restorePatEnv(saved);
			}
		});

		it("exposes the request token to fetchers during handling", async () => {
			const saved = snapshotPatEnv();
			try {
				const fetcher = await route.fetcherModule();
				let seen: string | undefined;
				vi.mocked(
					required(fetcher[route.fetchExport], route.fetchExport),
				).mockImplementationOnce(async () => {
					seen = process.env.PAT_1;
					return route.service === "stats" ? STATS_FIXTURE : TOPLANGS_FIXTURE;
				});
				const handler = await route.load();
				const req = makeReq(route.url);
				Object.assign(req.headers, { authorization: "Bearer BADTOKEN" });
				await handler(req, makeRes());

				expect(seen).toBe("BADTOKEN");
				expect(process.env.PAT_1).toBeUndefined();
			} finally {
				restorePatEnv(saved);
			}
		});

		it("does not emit auth-presence debug headers", async () => {
			process.env.PAT_1 = "ghp_test_token";
			const handler = await route.load();
			const req = makeReq(route.url);
			Object.assign(req.headers, { authorization: "Bearer TOKEN" });
			const res = makeRes();
			await handler(req, res);

			expect(res._headers.has("x-has-auth")).toBe(false);
			expect(res._headers.has("x-has-x-github-token")).toBe(false);
		});

		it(`reports ${route.rateLimitCode} when no PAT is configured`, async () => {
			const saved = snapshotPatEnv();
			try {
				const handler = await route.load();
				const res = makeRes();
				await handler(makeReq(route.url), res);

				expect(res._status()).toBe(200);
				expect(res._body()).toContain("<svg");
				expect(res._body()).toContain(`ZINNIA_ERR:${route.rateLimitCode}`);
			} finally {
				restorePatEnv(saved);
			}
		});

		it("sends an error SVG instead of an empty body", async () => {
			process.env.PAT_1 = "ghp_test_token";
			const card = await route.cardModule();
			vi.mocked(
				required(card[route.cardExport], route.cardExport),
			).mockImplementationOnce(() => "");
			const handler = await route.load();
			const res = makeRes();
			await handler(makeReq(route.url), res);

			expect(res._status()).toBe(200);
			expect(res._body()).toContain("<svg");
			expect(res._body()).not.toBe("");
			expect(res._body()).toContain(`ZINNIA_ERR:${route.internalCode}`);
			expect(res._headers.get("etag")).toMatch(/^".+"$/);
		});

		it("returns JSON diagnostics with ?debug=1 on success", async () => {
			process.env.PAT_1 = "ghp_test_token";
			const handler = await route.load();
			const res = makeRes();
			await handler(makeReq(`${route.url}&debug=1`), res);

			expect(res._status()).toBe(200);
			expect(res._headers.get("content-type")).toContain("application/json");
			expect(res._headers.get("cache-control")).toContain("no-store");
			const payload = JSON.parse(res._body());
			expect(payload.service).toBe(route.service);
			expect(payload.ok).toBe(true);
			expect(payload.stage).toBe("done");
			expect(payload.params.username).toBe("alice");
			expect(payload.validation).toEqual({
				username: true,
				patConfigured: true,
			});
			expect(typeof payload.timing.fetchMs).toBe("number");
			expect(typeof payload.timing.renderMs).toBe("number");
			expect(payload.render.bytes).toBeGreaterThan(0);
			expect(JSON.stringify(payload)).not.toContain("ghp_test_token");
		});

		it("returns JSON diagnostics with ?debug=1 on validation failure", async () => {
			const handler = await route.load();
			const res = makeRes();
			await handler(makeReq(`/api/${route.service}?debug=1`), res);

			expect(res._status()).toBe(200);
			expect(res._headers.get("content-type")).toContain("application/json");
			const payload = JSON.parse(res._body());
			expect(payload.ok).toBe(false);
			expect(payload.stage).toBe("validation");
			expect(payload.code).toBe("UNKNOWN");
		});

		it("returns JSON diagnostics with ?debug=1 on renderer error", async () => {
			process.env.PAT_1 = "ghp_test_token";
			const card = await route.cardModule();
			vi.mocked(
				required(card[route.cardExport], route.cardExport),
			).mockImplementationOnce(() => {
				throw new Error("boom");
			});
			const handler = await route.load();
			const res = makeRes();
			await handler(makeReq(`${route.url}&debug=true`), res);

			expect(res._status()).toBe(200);
			expect(res._headers.get("content-type")).toContain("application/json");
			const payload = JSON.parse(res._body());
			expect(payload.ok).toBe(false);
			expect(payload.stage).toBe("error");
			expect(payload.code).toBe(route.internalCode);
			expect(payload.error).toContain("boom");
		});
	});
}
