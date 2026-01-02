import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, describe, expect, it, vi } from "vitest";

// Mock the loader utilities used by api/stats to avoid relying on build artifacts.
vi.mock("../../lib/loader/index.js", () => {
	return {
		resolveCompiledHandler: () => "/virtual/stats/api/index.js",
		importByPath: async () => {
			return {
				// A renderer-style export (the intended path)
				renderStatsCard: async () => '<svg id="stats-renderer"></svg>',
				// A misleading default export that is NOT a web handler.
				default: () => {
					throw new Error("default export should not be invoked as a handler");
				},
			};
		},
		pickHandlerFromModule: () => ({
			name: "default",
			fn: () => {
				throw new Error("pickHandlerFromModule path should not be reached");
			},
		}),
		invokePossibleRequestHandler: async () => {
			throw new Error("invokePossibleRequestHandler should not be reached");
		},
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

	it("prefers renderer exports over default handler shape", async () => {
		process.env.PAT_1 = "ghp_test_token";
		const { default: statsHandler } = await import("../../api/stats.js");
		const req = makeReq("/api/stats?username=alice&theme=watchdog");
		const res = makeRes();
		await statsHandler(req, res);

		expect(res._status()).toBe(200);
		expect(res._body()).toContain("<svg");
		expect(res._body()).toContain("stats-renderer");
		const ct = res._headers.get("content-type") ?? "";
		expect(ct).toContain("image/svg");
	});
});
