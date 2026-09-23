import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, describe, expect, it, vi } from "vitest";
import { computeEtag } from "../../lib/canonical/http_cache.js";
import { forwardWebResponseToVercel } from "../../lib/http.js";
import { mockApiUtilsFactory, restoreMocks } from "../_mockHelpers";

function makeReq(urlPath: string) {
	return {
		headers: { host: "localhost", "x-forwarded-proto": "http" },
		method: "GET",
		url: urlPath,
	} as unknown as Record<string, unknown>;
}

function makeRes() {
	return {
		setHeader: vi.fn(),
		send: vi.fn(),
		status: vi.fn().mockReturnThis(),
	} as unknown as Record<string, unknown>;
}

/** Mock the loader so the trophy compiled-handler path is deterministic. */
function mockCompiledTrophy(compiledHandler: (webReq: Request) => unknown) {
	let calls = 0;
	const loaderMock = () => ({
		resolveCompiledHandler: () => {
			calls += 1;
			return calls === 1 ? "/fake/compiled-trophy.js" : "/fake/local-trophy.js";
		},
		importByPath: async (p: string) =>
			String(p).includes("compiled")
				? { default: compiledHandler }
				: { renderTrophySVG: async () => "<svg>LOCAL-FALLBACK</svg>" },
		pickHandlerFromModule: (mod: Record<string, unknown>, names: string[]) => {
			for (const n of names)
				if (typeof mod[n] === "function")
					return { fn: mod[n], name: n, via: n };
			return null;
		},
		invokePossibleRequestHandler: async (fn: any, webReq: Request) =>
			await fn(webReq),
	});
	vi.doMock("../../lib/loader/index.js", loaderMock);
	vi.doMock("../../lib/loader/index", loaderMock);
}

describe("forwardWebResponseToVercel embed contract", () => {
	afterEach(() => {
		restoreMocks();
	});

	it("ignores upstream error status + stale cache/etag, sends 200 + fresh ETag", async () => {
		const body = "<svg>COMPILED</svg>";
		const webRes = new Response(body, {
			status: 500,
			headers: {
				"content-type": "image/svg+xml",
				"cache-control": "public, max-age=999999",
				etag: '"stale-upstream-etag"',
			},
		});
		const res = makeRes();
		await forwardWebResponseToVercel(res as unknown as VercelResponse, webRes);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.send).toHaveBeenCalledTimes(1);
		expect(res.send).toHaveBeenCalledWith(body);
		expect(res.setHeader).toHaveBeenCalledWith(
			"ETag",
			`"${computeEtag(body)}"`,
		);
		expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
		const setCalls = (res.setHeader as any).mock.calls as [string, unknown][];
		expect(setCalls.some(([, v]) => String(v).includes("999999"))).toBe(false);
		expect(
			setCalls.some(([, v]) => String(v).includes("stale-upstream-etag")),
		).toBe(false);
	});

	it("returns null without touching res for an empty (304-style) body", async () => {
		const webRes = new Response(null, { status: 304 });
		const res = makeRes();
		const out = await forwardWebResponseToVercel(
			res as unknown as VercelResponse,
			webRes,
		);

		expect(out).toBeNull();
		expect(res.send).not.toHaveBeenCalled();
		expect(res.status).not.toHaveBeenCalled();
		expect(res.setHeader).not.toHaveBeenCalled();
	});
});

describe("trophy compiled-handler path follows the embed contract", () => {
	afterEach(() => {
		restoreMocks();
	});

	it("sends 200 + full body + our cache headers for a stale upstream response", async () => {
		const compiledBody = "<svg>COMPILED-TROPHY</svg>";
		vi.resetModules();
		vi.doMock("../../api/_utils", mockApiUtilsFactory());
		mockCompiledTrophy(
			() =>
				new Response(compiledBody, {
					status: 500,
					headers: {
						"cache-control": "public, max-age=999999",
						etag: '"stale-upstream-etag"',
					},
				}),
		);

		const trophy = (await import("../../api/trophy.js")).default;
		const req = makeReq("/api/trophy?username=testuser&theme=light");
		const res = makeRes();
		await trophy(
			req as unknown as VercelRequest,
			res as unknown as VercelResponse,
		);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.send).toHaveBeenCalledWith(compiledBody);
		const setCalls = (res.setHeader as any).mock.calls as [string, unknown][];
		const cacheCall = setCalls.find(([k]) => k === "Cache-Control");
		expect(cacheCall?.[1]).toContain("max-age=86400");
		expect(String(cacheCall?.[1])).not.toContain("999999");
		expect(
			setCalls.some(([, v]) => String(v).includes("stale-upstream-etag")),
		).toBe(false);
		expect(res.setHeader).toHaveBeenCalledWith(
			"ETag",
			expect.stringMatching(/^".+"$/),
		);
	});

	it("falls through to the local renderer on an empty upstream body", async () => {
		vi.resetModules();
		vi.doMock("../../api/_utils", mockApiUtilsFactory());
		mockCompiledTrophy(() => new Response(null, { status: 304 }));

		const trophy = (await import("../../api/trophy.js")).default;
		const req = makeReq("/api/trophy?username=testuser&theme=light");
		const res = makeRes();
		await trophy(
			req as unknown as VercelRequest,
			res as unknown as VercelResponse,
		);

		const sentArg = (res.send as any).mock.calls[0]?.[0] ?? "";
		expect(String(sentArg)).toContain("<svg>LOCAL-FALLBACK</svg>");
		expect(res.setHeader).toHaveBeenCalledWith(
			"ETag",
			expect.stringMatching(/^".+"$/),
		);
	});
});
