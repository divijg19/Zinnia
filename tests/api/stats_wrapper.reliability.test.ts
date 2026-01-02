import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, describe, expect, it, vi } from "vitest";

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
});
