import type { VercelRequest, VercelResponse } from "@vercel/node";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	checkCardResponse,
	loadManifest,
} from "../../scripts/lib/embed-contract.js";
import { headerValue, makeReq, makeRes } from "../_testShim";

/**
 * The embed contract, checked against the URLs that are actually embedded.
 *
 * `config/embeds.json` is the manifest of the cards in the GitHub profile
 * README. The smoke script checks those cards against a live origin, but it
 * needs a deployment and a token, so it cannot run on every pull request.
 * This suite is the same contract, in process: for every card in the
 * manifest, the route that serves it is driven with a mocked upstream and has
 * to answer with a renderable card.
 *
 * A card that nobody covers fails the suite, so the manifest cannot grow past
 * the contract coverage.
 */

const CARD_SVG =
	'<svg xmlns="http://www.w3.org/2000/svg" width="495" height="195" viewBox="0 0 495 195" role="img" aria-label="card"><title>card</title><rect width="100%" height="100%" fill="#ffffff"/></svg>';

const fetchStats = vi.hoisted(() => vi.fn());
vi.mock("../../stats/src/fetchers/stats", () => ({ fetchStats }));

const fetchTopLanguages = vi.hoisted(() => vi.fn());
vi.mock("../../stats/src/fetchers/top-languages", () => ({
	fetchTopLanguages,
}));

const loaderMocks = vi.hoisted(() => ({
	resolveCompiledHandler: vi.fn(),
	importByPath: vi.fn(),
}));

vi.mock("../../lib/loader/index.js", async (importOriginal) => {
	const actual = await importOriginal<Record<string, unknown>>();
	return {
		...actual,
		resolveCompiledHandler: loaderMocks.resolveCompiledHandler,
		importByPath: loaderMocks.importByPath,
	};
});

/** The stats payload the stats card renders from. */
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

/** The language payload the top-languages card renders from. */
const TOPLANGS_FIXTURE = {
	TypeScript: { name: "TypeScript", color: "#3178c6", size: 45000 },
	Python: { name: "Python", color: "#3572A5", size: 15000 },
};

/** A route handler, as the api/ modules export them. */
type RouteHandler = (
	req: VercelRequest,
	res: VercelResponse,
) => Promise<unknown>;

/**
 * The route that serves each card, keyed by the route name in the manifest's
 * path. A manifest entry whose route has no driver fails the suite.
 *
 * The imports are static on purpose: Vite cannot resolve a dynamic import
 * built from a template literal.
 */
const DRIVERS: Record<string, () => Promise<RouteHandler>> = {
	stats: async () =>
		(await import("../../api/stats.js")).default as RouteHandler,
	"top-langs": async () =>
		(await import("../../api/top-langs.js")).default as RouteHandler,
	streak: async () =>
		(await import("../../api/streak.js")).default as RouteHandler,
	trophy: async () =>
		(await import("../../api/trophy.js")).default as RouteHandler,
	leetcode: async () =>
		(await import("../../api/leetcode.js")).default as RouteHandler,
};

/** The route a manifest path is served by, e.g. `/api/stats?...` -> `stats`. */
function routeOf(path: string): string {
	const match = /^\/api\/([^/?]+)/.exec(path);
	return match?.[1] ?? "";
}

describe("the embedded cards answer the embed contract", () => {
	beforeEach(() => {
		vi.resetModules();
		fetchStats.mockReset();
		fetchTopLanguages.mockReset();
		loaderMocks.resolveCompiledHandler.mockReset();
		loaderMocks.importByPath.mockReset();

		delete process.env.UPSTASH_REST_URL;
		delete process.env.UPSTASH_REST_TOKEN;
		process.env.PAT_1 = "ghp_test_token";

		fetchStats.mockResolvedValue(STATS_FIXTURE);
		fetchTopLanguages.mockResolvedValue(TOPLANGS_FIXTURE);
		loaderMocks.resolveCompiledHandler.mockReturnValue("/fake/renderer.js");
		loaderMocks.importByPath.mockResolvedValue({
			renderForUser: async () => ({
				status: 200,
				body: CARD_SVG,
				contentType: "image/svg+xml",
			}),
			renderTrophySVG: async () => CARD_SVG,
			Generator: class {
				verbose = false;
				async generate() {
					return CARD_SVG;
				}
			},
		});
	});

	it("covers every card in the manifest", async () => {
		const manifest = await loadManifest("config/embeds.json");
		expect(manifest.embeds.length).toBeGreaterThan(0);
		for (const embed of manifest.embeds) {
			const route = routeOf(embed.path);
			expect(
				DRIVERS[route],
				`the manifest card '${embed.name}' (${route}) has no contract driver`,
			).toBeDefined();
		}
	});

	it("answers every embedded card with a renderable card", async () => {
		const manifest = await loadManifest("config/embeds.json");
		for (const embed of manifest.embeds) {
			const route = routeOf(embed.path);
			const driver = DRIVERS[route];
			if (!driver) {
				throw new Error(`no contract driver for '${embed.name}' (${route})`);
			}
			const handler = await driver();
			const res = makeRes();
			const started = Date.now();
			await handler(
				makeReq(embed.path) as unknown as VercelRequest,
				res as unknown as VercelResponse,
			);
			const ms = Date.now() - started;
			const body = String(res.send.mock.calls[0]?.[0] ?? "");

			const problems = checkCardResponse({
				status: res._status(),
				contentType: headerValue(res, "content-type") ?? "",
				etag: headerValue(res, "etag") ?? "",
				cacheControl: headerValue(res, "cache-control") ?? "",
				body,
				ms,
				budgetMs: 5000,
			});
			expect(
				problems,
				`${embed.name} (${embed.path}): ${problems.join("; ")}`,
			).toEqual([]);
		}
	});
});
