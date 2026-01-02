import path from "node:path";
import { pathToFileURL } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	clearGlobalFetchMock,
	makeFetchResolved,
	setGlobalFetchMock,
} from "../_globalFetchMock";
import { makeReq, makeRes } from "../_resShim";

// Helper to load handler fresh per scenario
async function loadHandlerWithMocks(
	mockModPath: string,
	mockExport: unknown,
	env: Record<string, string> = {},
) {
	vi.resetModules();
	clearGlobalFetchMock();
	for (const [k, v] of Object.entries(env)) process.env[k] = v;
	// ensure fetcher is mocked to avoid network GraphQL calls
	vi.doMock(
		"../../streak/src/fetcher",
		() =>
			({
				fetchContributions: async (_username: string) => [
					{ date: "2020-01-01", count: 1 },
				],
			}) as any,
	);
	// mock upstream fetch to not return an SVG, forcing local renderer
	setGlobalFetchMock(
		makeFetchResolved({ ok: false, status: 500, text: async () => "" }),
	);
	// Normalize module shape: if caller provided a raw function, treat it as a
	// `default` export so runtime imports like `mod.default` behave correctly.
	//
	// Vitest may also expect certain named exports to exist on mocked modules
	// (even if they're unused). Provide them as `undefined` by default so the
	// canonical loader can still exercise the intended export-shape branches.
	const baseMock =
		typeof mockExport === "function"
			? { default: mockExport }
			: (mockExport ?? {});
	const moduleMock = {
		loadStreakRenderer: undefined,
		renderFallbackSvg: undefined,
		renderForUser: undefined,
		...(baseMock as any),
	};

	// The canonical loader imports streak renderer from a few specifiers.
	// Mock all the common variants to keep this test deterministic.
	const absIndexJs = path.resolve(process.cwd(), "streak/dist/index.js");
	const absIndex = path.resolve(process.cwd(), "streak/dist/index");
	const absIndexJsUrl = pathToFileURL(absIndexJs).href;
	const specifiers = new Set<string>([
		mockModPath,
		"../../streak/dist/index.js",
		"../../streak/dist/index.mjs",
		"../../streak/dist/index",
		absIndexJs,
		absIndex,
		absIndexJsUrl,
	]);
	for (const spec of specifiers) {
		vi.doMock(spec, () => moduleMock as any);
	}
	const mod = await import("../../streak/api/index.ts");
	return mod.default as any;
}

describe("renderer import permutations", () => {
	beforeEach(() => {
		vi.resetModules();
		clearGlobalFetchMock();
		// Ensure any previous test-injected renderer fallback is cleared
		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			delete (globalThis as any).__STREAK_TEST_RENDERER;
		} catch {}
		process.env.STREAK_USE_TS = "1";
	});

	it("accepts top-level renderForUser function", async () => {
		const handler = await loadHandlerWithMocks("../../streak/dist/index", {
			renderForUser: async () => ({
				contentType: "image/svg+xml",
				body: "<svg>TOP</svg>",
			}),
		});
		const req: any = makeReq("/api/streak?user=test");
		req.query = { user: "test" };
		const res: any = makeRes();
		await handler(req, res);
		expect(res.send.mock.calls[0][0]).toContain("<svg>TOP</svg>");
	});

	it("accepts default.renderForUser shape", async () => {
		const handler = await loadHandlerWithMocks("../../streak/dist/index", {
			default: {
				renderForUser: async () => ({
					contentType: "image/svg+xml",
					body: "<svg>DEF.RENDER</svg>",
				}),
			},
		});
		const req: any = makeReq("/api/streak?user=test");
		req.query = { user: "test" };
		const res: any = makeRes();
		await handler(req, res);
		expect(res.send.mock.calls[0][0]).toContain("<svg>DEF.RENDER</svg>");
	});

	it("accepts default as function (module default export)", async () => {
		const handler = await loadHandlerWithMocks(
			"../../streak/dist/index",
			async () => ({
				contentType: "image/svg+xml",
				body: "<svg>DEFAULT-FN</svg>",
			}),
		);
		const req: any = makeReq("/api/streak?user=test");
		req.query = { user: "test" };
		const res: any = makeRes();
		await handler(req, res);
		expect(res.send.mock.calls[0][0]).toContain("<svg>DEFAULT-FN</svg>");
	});

	it("falls back to svg_builder when module missing exports", async () => {
		const handler = await loadHandlerWithMocks("../../streak/dist/index", {
			nothing: true,
		});
		const req: any = makeReq("/api/streak?user=test");
		req.query = { user: "test" };
		const res: any = makeRes();
		await handler(req, res);
		const out = res.send.mock.calls[0][0] as string;
		expect(out).toContain("<svg");
	});
});
