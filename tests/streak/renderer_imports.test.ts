import path from "node:path";
import { pathToFileURL } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	clearGlobalFetchMock,
	makeFetchResolved,
	makeReq,
	makeRes,
	setGlobalFetchMock,
} from "../_testShim";

/**
 * The renderer export shapes the streak route can find.
 *
 * The route loads the compiled renderer through the canonical loader, which
 * tries a handful of specifiers and export shapes. This covers the ones the
 * route actually accepts, so a change in how the shard is bundled cannot
 * leave the streak card without a renderer.
 */

/** Load the route with the renderer module mocked into one shape. */
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

	// Vitest may also expect certain named exports to exist on mocked modules
	// (even if they're unused). Provide them as `undefined` by default so the
	// canonical loader can still exercise the intended export-shape branches.
	const moduleMock = {
		loadStreakRenderer: undefined,
		renderFallbackSvg: undefined,
		renderForUser: undefined,
		...((mockExport ?? {}) as any),
	};

	// The canonical loader imports the streak renderer from a few specifiers.
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
	const mod = await import("../../api/streak.js");
	return mod.default as any;
}

/** Drive the route and return the body it sent. */
async function renderThrough(handler: any): Promise<string> {
	const req: any = makeReq("/api/streak?user=test");
	req.query = { user: "test" };
	const res: any = makeRes();
	await handler(req, res);
	return res.send.mock.calls[0]?.[0] as string;
}

describe("renderer import permutations", () => {
	beforeEach(() => {
		vi.resetModules();
		clearGlobalFetchMock();
		// Ensure any previous test-injected renderer fallback is cleared
		try {
			delete (globalThis as any).__STREAK_TEST_RENDERER;
		} catch {}
		process.env.STREAK_USE_TS = "1";
	});

	it("accepts a compiled handler exported as default", async () => {
		// The shape the shard actually ships: a request handler.
		const handler = await loadHandlerWithMocks("../../streak/dist/index", {
			default: async () => new Response("<svg>DEFAULT-HANDLER</svg>"),
		});
		expect(await renderThrough(handler)).toContain(
			"<svg>DEFAULT-HANDLER</svg>",
		);
	});

	it("accepts a top-level renderForUser function", async () => {
		const handler = await loadHandlerWithMocks("../../streak/dist/index", {
			renderForUser: async () => ({
				contentType: "image/svg+xml",
				body: "<svg>TOP</svg>",
			}),
		});
		expect(await renderThrough(handler)).toContain("<svg>TOP</svg>");
	});

	it("falls back to svg_builder when module missing exports", async () => {
		const handler = await loadHandlerWithMocks("../../streak/dist/index", {
			nothing: true,
		});
		const out = await renderThrough(handler);
		expect(out).toContain("<svg");
	});
});
