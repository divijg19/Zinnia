import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, describe, expect, it, vi } from "vitest";

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

function makeReq(urlPath: string): VercelRequest {
	return {
		method: "GET",
		url: urlPath,
		headers: {
			host: "localhost",
			"x-forwarded-proto": "http",
		},
	} as unknown as VercelRequest;
}

function makeRes() {
	const headers = new Map<string, string>();
	let statusCode = 200;
	let body: string | undefined;
	const res: Partial<VercelResponse> & {
		_headers: Map<string, string>;
		_body: () => string;
		_status: () => number;
	} = {
		setHeader: (k: string, v: unknown) => {
			headers.set(k.toLowerCase(), String(v));
			return res as unknown as VercelResponse;
		},
		getHeader: (k: string) => headers.get(k.toLowerCase()),
		status: ((code: number) => {
			statusCode = code;
			return res as unknown as VercelResponse;
		}) as unknown as VercelResponse["status"],
		send: ((b: unknown) => {
			body = typeof b === "string" ? b : b == null ? "" : String(b);
			return res as unknown as VercelResponse;
		}) as unknown as VercelResponse["send"],
		_headers: headers,
		_body: () => body ?? "",
		_status: () => statusCode,
	};
	return res as unknown as VercelResponse & {
		_headers: Map<string, string>;
		_body: () => string;
		_status: () => number;
	};
}

function snapshotPatEnv(): Record<string, string | undefined> {
	const saved: Record<string, string | undefined> = {};
	for (const k of Object.keys(process.env)) {
		if (/^PAT_\d*$/.test(k)) {
			saved[k] = process.env[k];
			delete process.env[k];
		}
	}
	return saved;
}

function restorePatEnv(saved: Record<string, string | undefined>): void {
	for (const k of Object.keys(process.env)) {
		if (/^PAT_\d*$/.test(k)) delete process.env[k];
	}
	for (const [k, v] of Object.entries(saved)) {
		if (v !== undefined) process.env[k] = v;
	}
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
});
