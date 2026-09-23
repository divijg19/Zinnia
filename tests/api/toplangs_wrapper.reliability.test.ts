import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, describe, expect, it, vi } from "vitest";

// Prevent dotenv.config() from repopulating PAT_* vars when modules are
// re-evaluated after vi.resetModules(); env reads still work, and each
// test below snapshots/restores the ambient environment explicitly.
vi.mock("dotenv", () => ({ config: () => ({}) }));

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

	it("does not leak a request token into subsequent requests", async () => {
		const saved = snapshotPatEnv();
		try {
			const { default: handler } = await import("../../api/top-langs.js");
			const req = makeReq(
				"/api/top-langs?username=alice&theme=watchdog&layout=compact",
			);
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
			const { default: handler } = await import("../../api/top-langs.js");
			const req = makeReq(
				"/api/top-langs?username=alice&theme=watchdog&layout=compact",
			);
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
			const topLangsFetcher = await import(
				"../../stats/src/fetchers/top-languages.js"
			);
			let seen: string | undefined;
			vi.mocked(topLangsFetcher.fetchTopLanguages).mockImplementationOnce(
				async () => {
					seen = process.env.PAT_1;
					return {
						langs: [
							{ name: "TypeScript", color: "#3178c6", size: 123, count: 1 },
						],
						totalLanguageSize: 123,
					};
				},
			);
			const { default: handler } = await import("../../api/top-langs.js");
			const req = makeReq(
				"/api/top-langs?username=alice&theme=watchdog&layout=compact",
			);
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
		const { default: handler } = await import("../../api/top-langs.js");
		const req = makeReq(
			"/api/top-langs?username=alice&theme=watchdog&layout=compact",
		);
		Object.assign(req.headers, { authorization: "Bearer TOKEN" });
		const res = makeRes();
		await handler(req, res);

		expect(res._headers.has("x-has-auth")).toBe(false);
		expect(res._headers.has("x-has-x-github-token")).toBe(false);
	});

	it("reports TOP_LANGS_RATE_LIMIT when no PAT is configured", async () => {
		const saved = snapshotPatEnv();
		try {
			const { default: handler } = await import("../../api/top-langs.js");
			const req = makeReq("/api/top-langs?username=alice&theme=watchdog");
			const res = makeRes();
			await handler(req, res);

			expect(res._status()).toBe(200);
			expect(res._body()).toContain("<svg");
			expect(res._body()).toContain("ZINNIA_ERR:TOP_LANGS_RATE_LIMIT");
		} finally {
			restorePatEnv(saved);
		}
	});

	it("sends an error SVG instead of an empty body", async () => {
		process.env.PAT_1 = "ghp_test_token";
		const topLangsCard = await import("../../stats/src/cards/top-languages.js");
		vi.mocked(topLangsCard.renderTopLanguages).mockImplementationOnce(() => "");
		const { default: handler } = await import("../../api/top-langs.js");
		const req = makeReq("/api/top-langs?username=alice&theme=watchdog");
		const res = makeRes();
		await handler(req, res);

		expect(res._status()).toBe(200);
		expect(res._body()).toContain("<svg");
		expect(res._body()).not.toBe("");
		expect(res._body()).toContain("ZINNIA_ERR:TOP_LANGS_INTERNAL");
		expect(res._headers.get("etag")).toMatch(/^".+"$/);
	});

	it("returns JSON diagnostics with ?debug=1 when no PAT is configured", async () => {
		const saved = snapshotPatEnv();
		try {
			const { default: handler } = await import("../../api/top-langs.js");
			const req = makeReq("/api/top-langs?username=alice&debug=1");
			const res = makeRes();
			await handler(req, res);

			expect(res._status()).toBe(200);
			expect(res._headers.get("content-type")).toContain("application/json");
			const payload = JSON.parse(res._body());
			expect(payload.service).toBe("top-langs");
			expect(payload.ok).toBe(false);
			expect(payload.stage).toBe("validation");
			expect(payload.code).toBe("TOP_LANGS_RATE_LIMIT");
			expect(payload.validation.patConfigured).toBe(false);
		} finally {
			restorePatEnv(saved);
		}
	});

	it("returns JSON diagnostics with ?debug=1 on renderer error", async () => {
		process.env.PAT_1 = "ghp_test_token";
		const topLangsCard = await import("../../stats/src/cards/top-languages.js");
		vi.mocked(topLangsCard.renderTopLanguages).mockImplementationOnce(() => {
			throw new Error("boom");
		});
		const { default: handler } = await import("../../api/top-langs.js");
		const req = makeReq("/api/top-langs?username=alice&debug=true");
		const res = makeRes();
		await handler(req, res);

		expect(res._status()).toBe(200);
		expect(res._headers.get("content-type")).toContain("application/json");
		const payload = JSON.parse(res._body());
		expect(payload.ok).toBe(false);
		expect(payload.stage).toBe("error");
		expect(payload.code).toBe("TOP_LANGS_INTERNAL");
		expect(payload.error).toContain("boom");
	});
});
