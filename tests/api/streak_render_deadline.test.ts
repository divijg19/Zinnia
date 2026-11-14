import type { VercelRequest, VercelResponse } from "@vercel/node";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { headerValue, makeReq, makeRes } from "../_testShim";

// The streak route loads its renderer through the shared loader, so the
// loader is the seam: the compiled handler never has to exist for these
// tests. The renderer below never settles, which is exactly the case the
// render deadline exists for.
const loaderMocks = vi.hoisted(() => ({
	resolveCompiledHandler: vi.fn(),
	importByPath: vi.fn(),
}));

vi.mock("../../lib/loader/index.js", async (importOriginal) => {
	const actual = await importOriginal<Record<string, unknown>>();
	return {
		...actual,
		resolveCompiledHandler: loaderMocks.resolveCompiledHandler,
		importByPath: loaderMocks.importByPath,
	};
});

const STALE_SVG =
	'<svg xmlns="http://www.w3.org/2000/svg" width="495" height="195"><title>previous render</title></svg>';

/** A renderer that never answers. */
function hangingRenderer() {
	return {
		renderForUser: vi.fn(() => new Promise<never>(() => {})),
	};
}

async function callRoute(user: string) {
	const { default: handler } = await import("../../api/streak.js");
	const res = makeRes();
	const started = Date.now();
	await handler(
		makeReq(`/api/streak?user=${user}`) as unknown as VercelRequest,
		res as unknown as VercelResponse,
	);
	return { res, elapsed: Date.now() - started };
}

describe("api/streak render deadline", () => {
	beforeEach(() => {
		vi.resetModules();
		loaderMocks.resolveCompiledHandler.mockReset();
		loaderMocks.importByPath.mockReset();
		delete process.env.UPSTASH_REST_URL;
		delete process.env.UPSTASH_REST_TOKEN;
		delete process.env.UPSTASH_KV_REST_API_URL;
		delete process.env.UPSTASH_KV_REST_API_TOKEN;
		process.env.VERCEL_ENV = "production";
		// The render cache is off across the suite; these cases need it on.
		process.env.RENDER_CACHE = "1";
		process.env.RENDER_DEADLINE_MS = "50";
		process.env.RENDER_CEILING_MS = "50";
	});

	it("serves the previous render when the renderer overruns its budget", async () => {
		const user = "deadline-stale-user";
		loaderMocks.resolveCompiledHandler.mockReturnValue(
			"/fake/streak/dist/index.js",
		);
		loaderMocks.importByPath.mockResolvedValue(hangingRenderer());

		const rc = await import("../../lib/render-cache.js");
		// A stale entry: the route has to render, and the previous render is
		// what it should fall back to.
		await rc.setCachedRender(
			"streak",
			rc.renderCacheKey(new URL(`http://localhost/api/streak?user=${user}`)),
			STALE_SVG,
			0,
		);

		const { res, elapsed } = await callRoute(user);

		// The route waited for its budget and then bailed out, instead of
		// waiting for a renderer that never answers.
		expect(elapsed).toBeGreaterThanOrEqual(40);
		expect(elapsed).toBeLessThan(2000);
		expect(res.send).toHaveBeenCalledWith(STALE_SVG);
		expect(headerValue(res, "X-Cache-Status")).toBe("stale");
	});

	it("answers with a renderable error card when nothing was rendered before", async () => {
		const user = "deadline-nocache-user";
		loaderMocks.resolveCompiledHandler.mockReturnValue(
			"/fake/streak/dist/index.js",
		);
		loaderMocks.importByPath.mockResolvedValue(hangingRenderer());

		const { res, elapsed } = await callRoute(user);

		expect(elapsed).toBeLessThan(2000);
		expect(res.status).toHaveBeenCalledWith(200);
		const body = String(res.send.mock.calls[0]?.[0] ?? "");
		expect(body).toContain("<svg");
		// An empty body is a broken embed: the card must render something.
		expect(body).not.toBe("");
	});

	it("reports the overrun in the debug diagnostics", async () => {
		const user = "deadline-debug-user";
		loaderMocks.resolveCompiledHandler.mockReturnValue(
			"/fake/streak/dist/index.js",
		);
		loaderMocks.importByPath.mockResolvedValue(hangingRenderer());

		const { default: handler } = await import("../../api/streak.js");
		const res = makeRes();
		await handler(
			makeReq(`/api/streak?user=${user}&debug=1`) as unknown as VercelRequest,
			res as unknown as VercelResponse,
		);

		const payload = JSON.parse(String(res.send.mock.calls[0]?.[0] ?? "{}"));
		expect(payload.ok).toBe(false);
		expect(payload.code).toBe("STREAK_INTERNAL");
	});
});
