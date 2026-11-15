import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { headerValue, makeReq, makeRes, type TestResponse } from "../_testShim";

// The render cache has to be on for the stale path to exist.
process.env.RENDER_CACHE = "1";

const fetchStats = vi.hoisted(() => vi.fn());
vi.mock("../../stats/src/fetchers/stats", () => ({ fetchStats }));

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<unknown>;

const URL_PATH = "/api/stats?username=alice&theme=watchdog";

/**
 * Load the route with a fetcher that never answers.
 *
 * The point of these cases is the budget, not the card: a renderer that
 * hangs must not hold the response past the deadline, because GitHub Camo
 * stops waiting at ten seconds and renders nothing at all.
 */
async function loadHanging() {
	vi.resetModules();
	fetchStats.mockReset();
	fetchStats.mockImplementation(() => new Promise(() => {}));
	const rc = await import("../../lib/render-cache.js");
	const { default: handler } = await import("../../api/stats.js");
	return { handler, rc };
}

async function call(
	handler: Handler,
): Promise<{ res: TestResponse; ms: number }> {
	const res = makeRes();
	const started = Date.now();
	await handler(
		makeReq(URL_PATH) as unknown as VercelRequest,
		res as unknown as VercelResponse,
	);
	return { res, ms: Date.now() - started };
}

describe("card route render budget", () => {
	beforeEach(() => {
		delete process.env.UPSTASH_REST_URL;
		delete process.env.UPSTASH_REST_TOKEN;
		process.env.PAT_1 = "ghp_test_token";
	});

	afterEach(() => {
		delete process.env.PAT_1;
		delete process.env.RENDER_DEADLINE_MS;
		delete process.env.RENDER_CEILING_MS;
		process.env.RENDER_CACHE = "1";
	});

	it("serves the previous render when the renderer overruns the deadline", async () => {
		process.env.RENDER_DEADLINE_MS = "50";
		const { handler, rc } = await loadHanging();

		// A stale entry: the route has to render, and the previous render is
		// what it should fall back to.
		await rc.setCachedRender(
			"stats",
			rc.renderCacheKey(new URL(`http://localhost${URL_PATH}`)),
			"<svg>previous render</svg>",
			0,
		);

		const { res, ms } = await call(handler);

		expect(ms).toBeGreaterThanOrEqual(40);
		expect(ms).toBeLessThan(2000);
		expect(headerValue(res, "x-cache-status")).toBe("stale");
		expect(String(res.send.mock.calls[0]?.[0] ?? "")).toContain(
			"previous render",
		);
	});

	it("answers with a renderable card when nothing was rendered before", async () => {
		process.env.RENDER_CEILING_MS = "50";
		const { handler } = await loadHanging();

		const { res, ms } = await call(handler);

		expect(ms).toBeLessThan(2000);
		expect(res._status()).toBe(200);
		const body = String(res.send.mock.calls[0]?.[0] ?? "");
		// An empty body is a broken embed: the card must render something.
		expect(body).toContain("<svg");
		expect(body).not.toBe("");
	});
});
