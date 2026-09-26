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

type ShimRes = VercelResponse &
	Pick<TestResponse, "_headers" | "_body" | "_status">;

function makeReq(urlPath: string): VercelRequest {
	return makeShimReq(urlPath) as unknown as VercelRequest;
}

function makeRes(): ShimRes {
	return makeShimRes() as unknown as ShimRes;
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
						TypeScript: {
							name: "TypeScript",
							color: "#3178c6",
							size: 123,
							count: 1,
						},
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
