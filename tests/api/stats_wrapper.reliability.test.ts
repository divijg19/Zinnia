import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TestResponse } from "../_testShim";
import {
	makeReq as makeShimReq,
	makeRes as makeShimRes,
	restorePatEnv,
	snapshotPatEnv,
} from "../_testShim";

// Prevent dotenv.config() from repopulating PAT_* vars when modules are
// re-evaluated after vi.resetModules(); env reads still work, and each
// test below snapshots/restores the ambient environment explicitly.
vi.mock("dotenv", () => ({ config: () => ({}) }));

vi.mock("../../stats/src/fetchers/stats", () => {
	return {
		fetchStats: vi.fn(async () => {
			return {
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
		}),
	};
});

vi.mock("../../stats/src/cards/stats", () => {
	return {
		renderStatsCard: vi.fn(() => '<svg id="stats-rendered"></svg>'),
	};
});

type ShimRes = VercelResponse &
	Pick<TestResponse, "_headers" | "_body" | "_status">;

function makeReq(urlPath: string): VercelRequest {
	return makeShimReq(urlPath) as unknown as VercelRequest;
}

function makeRes(): ShimRes {
	return makeShimRes() as unknown as ShimRes;
}

describe("/api/stats wrapper reliability", () => {
	afterEach(() => {
		delete process.env.PAT_1;
		vi.resetModules();
	});

	it("renders via stats fetcher + renderer", async () => {
		process.env.PAT_1 = "ghp_test_token";
		const { default: statsHandler } = await import("../../api/stats.js");
		const req = makeReq("/api/stats?username=alice&theme=watchdog");
		const res = makeRes();
		await statsHandler(req, res);

		expect(res._status()).toBe(200);
		expect(res._body()).toContain("<svg");
		expect(res._body()).toContain("stats-rendered");
		const ct = res._headers.get("content-type") ?? "";
		expect(ct).toContain("image/svg");
	});

	it("does not leak a request token into subsequent requests", async () => {
		const saved = snapshotPatEnv();
		try {
			const { default: statsHandler } = await import("../../api/stats.js");
			const req = makeReq("/api/stats?username=alice&theme=watchdog");
			Object.assign(req.headers, { authorization: "Bearer BADTOKEN" });
			const res = makeRes();
			await statsHandler(req, res);

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
			const { default: statsHandler } = await import("../../api/stats.js");
			const req = makeReq("/api/stats?username=alice&theme=watchdog");
			Object.assign(req.headers, { authorization: "Bearer OTHERTOKEN" });
			await statsHandler(req, makeRes());

			expect(process.env.PAT_1).toBe("ghp_original");
		} finally {
			restorePatEnv(saved);
		}
	});

	it("exposes the request token to fetchers during handling", async () => {
		const saved = snapshotPatEnv();
		try {
			const statsFetcher = await import("../../stats/src/fetchers/stats.js");
			let seen: string | undefined;
			vi.mocked(statsFetcher.fetchStats).mockImplementationOnce(async () => {
				seen = process.env.PAT_1;
				return {
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
			});
			const { default: statsHandler } = await import("../../api/stats.js");
			const req = makeReq("/api/stats?username=alice&theme=watchdog");
			Object.assign(req.headers, { authorization: "Bearer BADTOKEN" });
			await statsHandler(req, makeRes());

			expect(seen).toBe("BADTOKEN");
			expect(process.env.PAT_1).toBeUndefined();
		} finally {
			restorePatEnv(saved);
		}
	});

	it("does not emit auth-presence debug headers", async () => {
		process.env.PAT_1 = "ghp_test_token";
		const { default: statsHandler } = await import("../../api/stats.js");
		const req = makeReq("/api/stats?username=alice&theme=watchdog");
		Object.assign(req.headers, { authorization: "Bearer TOKEN" });
		const res = makeRes();
		await statsHandler(req, res);

		expect(res._headers.has("x-has-auth")).toBe(false);
		expect(res._headers.has("x-has-x-github-token")).toBe(false);
	});

	it("sends an error SVG instead of an empty body", async () => {
		process.env.PAT_1 = "ghp_test_token";
		const statsCard = await import("../../stats/src/cards/stats.js");
		vi.mocked(statsCard.renderStatsCard).mockImplementationOnce(() => "");
		const { default: statsHandler } = await import("../../api/stats.js");
		const req = makeReq("/api/stats?username=alice&theme=watchdog");
		const res = makeRes();
		await statsHandler(req, res);

		expect(res._status()).toBe(200);
		expect(res._body()).toContain("<svg");
		expect(res._body()).not.toBe("");
		expect(res._body()).toContain("ZINNIA_ERR:STATS_INTERNAL");
		expect(res._headers.get("etag")).toMatch(/^".+"$/);
	});

	it("returns JSON diagnostics with ?debug=1 on success", async () => {
		process.env.PAT_1 = "ghp_test_token";
		const { default: statsHandler } = await import("../../api/stats.js");
		const req = makeReq("/api/stats?username=alice&theme=watchdog&debug=1");
		const res = makeRes();
		await statsHandler(req, res);

		expect(res._status()).toBe(200);
		expect(res._headers.get("content-type")).toContain("application/json");
		expect(res._headers.get("cache-control")).toContain("no-store");
		const payload = JSON.parse(res._body());
		expect(payload.service).toBe("stats");
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
		const { default: statsHandler } = await import("../../api/stats.js");
		const req = makeReq("/api/stats?debug=1");
		const res = makeRes();
		await statsHandler(req, res);

		expect(res._status()).toBe(200);
		expect(res._headers.get("content-type")).toContain("application/json");
		const payload = JSON.parse(res._body());
		expect(payload.ok).toBe(false);
		expect(payload.stage).toBe("validation");
		expect(payload.code).toBe("UNKNOWN");
	});
});
