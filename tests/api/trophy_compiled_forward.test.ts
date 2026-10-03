import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockApiUtilsFactory, restoreMocks } from "../_mockHelpers";
import { makeReq, makeRes } from "../_testShim";

/**
 * The embed contract for the trophy compiled-handler path.
 *
 * The contract itself - ignore an upstream error status, stale `Cache-Control`
 * and a stale `ETag`; always answer 200 with the full body and our own ETag;
 * never forward an empty body - is asserted through the route, which is the
 * only place these headers are actually applied. `lib/http.ts` used to hold
 * that logic as a standalone helper used solely by this route; folding it in
 * removed the helper rather than leaving an orphaned copy of the contract.
 */

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

/**
 * Mock only module resolution, leaving the real `invokePossibleRequestHandler`
 * in place. That is what makes a two-parameter compiled handler get invoked the
 * way production invokes it, which is the case under test below.
 */
function mockCompiledTrophyWithRealInvoker(
	compiledHandler: (...args: unknown[]) => unknown,
) {
	let calls = 0;
	const loaderMock = async (importOriginal: () => Promise<unknown>) => {
		const actual = (await importOriginal()) as Record<string, unknown>;
		return {
			...actual,
			resolveCompiledHandler: () => {
				calls += 1;
				return calls === 1
					? "/fake/compiled-trophy.js"
					: "/fake/local-trophy.js";
			},
			importByPath: async (p: string) =>
				String(p).includes("compiled")
					? { default: compiledHandler }
					: { renderTrophySVG: async () => "<svg>LOCAL-FALLBACK</svg>" },
		};
	};
	vi.doMock("../../lib/loader/index.js", loaderMock);
	vi.doMock("../../lib/loader/index", loaderMock);
}

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

	it("answers exactly once when a compiled handler is shaped like a Vercel (req, res) handler", async () => {
		// `invokePossibleRequestHandler` prefers `(req, res)` whenever the
		// function declares two parameters. If the route handed it the live
		// response, such a handler would write a body directly and the route
		// would *also* fall through to the local renderer, sending twice.
		vi.resetModules();
		vi.doMock("../../api/_utils", mockApiUtilsFactory());
		mockCompiledTrophyWithRealInvoker((_req: unknown, res: unknown) => {
			(res as { send: (body: string) => unknown }).send(
				"<svg>WROTE-DIRECTLY</svg>",
			);
			return undefined;
		});

		const trophy = (await import("../../api/trophy.js")).default;
		const req = makeReq("/api/trophy?username=testuser&theme=light");
		const res = makeRes();
		await trophy(
			req as unknown as VercelRequest,
			res as unknown as VercelResponse,
		);

		expect(res.send).toHaveBeenCalledTimes(1);
		const sent = String((res.send as any).mock.calls[0]?.[0] ?? "");
		expect(sent).toContain("LOCAL-FALLBACK");
		expect(sent).not.toContain("WROTE-DIRECTLY");
	});
});
