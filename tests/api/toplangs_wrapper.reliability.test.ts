import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../stats/src/fetchers/top-languages", () => {
	return {
		fetchTopLanguages: vi.fn(async () => {
			return {
				langs: [{ name: "TypeScript", color: "#3178c6", size: 123, count: 1 }],
				totalLanguageSize: 123,
			};
		}),
	};
});

vi.mock("../../stats/src/cards/top-languages", () => {
	return {
		renderTopLanguages: vi.fn(() => '<svg id="toplangs-rendered"></svg>'),
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
		expect(res._body()).toContain("toplangs-rendered");
	});
});
