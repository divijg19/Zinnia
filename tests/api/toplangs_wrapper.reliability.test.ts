import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/loader/index.js", () => {
	return {
		resolveCompiledHandler: () => "/virtual/stats/api/index.js",
		importByPath: async () => {
			return {
				renderTopLanguages: async () => '<svg id="toplangs-renderer"></svg>',
				// This resembles a Vercel-style handler; wrapper must call it as (req,res),
				// not as a web Request handler.
				default: (_req: any, res: any) => {
					res.setHeader("Content-Type", "image/svg+xml");
					res.status(200);
					return res.send('<svg id="toplangs-default"></svg>');
				},
			};
		},
		pickHandlerFromModule: (mod: any) => ({ name: "default", fn: mod.default }),
		invokePossibleRequestHandler: async () => {
			throw new Error(
				"invokePossibleRequestHandler should not be used for default export",
			);
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

describe("/api/top-langs wrapper reliability", () => {
	afterEach(() => {
		delete process.env.PAT_1;
		vi.resetModules();
	});

	it("uses renderer exports when available", async () => {
		process.env.PAT_1 = "ghp_test_token";
		const { default: handler } = await import("../../api/top-langs.js");
		const req = makeReq(
			"/api/top-langs?username=alice&theme=watchdog&layout=compact",
		);
		const res = makeRes();
		await handler(req, res);

		expect(res._status()).toBe(200);
		expect(res._body()).toContain("toplangs-renderer");
	});

	it("treats default export as a Vercel handler, not a web Request handler", async () => {
		// Force renderer exports to be absent so the wrapper takes the picked handler path.
		process.env.PAT_1 = "ghp_test_token";
		vi.doMock("../../lib/loader/index.js", () => {
			return {
				resolveCompiledHandler: () => "/virtual/stats/api/index.js",
				importByPath: async () => ({
					default: (_req: any, res: any) => {
						res.setHeader("Content-Type", "image/svg+xml");
						res.status(200);
						return res.send('<svg id="toplangs-default"></svg>');
					},
				}),
				pickHandlerFromModule: (mod: any) => ({
					name: "default",
					fn: mod.default,
				}),
				invokePossibleRequestHandler: async () => {
					throw new Error("should not be called for default");
				},
			};
		});
		vi.resetModules();

		const { default: handler } = await import("../../api/top-langs.js");
		const req = makeReq("/api/top-langs?username=alice");
		const res = makeRes();
		await handler(req, res);

		expect(res._status()).toBe(200);
		expect(res._body()).toContain("toplangs-default");
	});
});
