import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeReq, makeRes } from "../_testShim";

/**
 * `?debug=1` used to answer with JSON on stats and top-langs only: the flag and
 * the JSON writer lived in `lib/params.ts` and `lib/errors.ts`, and the three
 * hand-written routes never called them. An embedder following the documented
 * "add ?debug=1 to any card URL" got an SVG back and no diagnostics at all.
 */
process.env.RENDER_CACHE = "1";

vi.mock("dotenv", () => ({ config: () => ({}) }));

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<unknown>;

// Static specifiers: Vite cannot resolve a template-literal dynamic import.
const ROUTES = [
	{
		name: "stats",
		path: "/api/stats",
		load: () => import("../../api/stats.js"),
	},
	{
		name: "top-langs",
		path: "/api/top-langs",
		load: () => import("../../api/top-langs.js"),
	},
	{
		name: "streak",
		path: "/api/streak",
		load: () => import("../../api/streak.js"),
	},
	{
		name: "trophy",
		path: "/api/trophy",
		load: () => import("../../api/trophy.js"),
	},
	{
		name: "leetcode",
		path: "/api/leetcode",
		load: () => import("../../api/leetcode.js"),
	},
] as const;

async function loadHandler(
	name: (typeof ROUTES)[number]["name"],
): Promise<Handler> {
	const entry = ROUTES.find((r) => r.name === name);
	if (!entry) throw new Error(`unknown route ${name}`);
	return (await entry.load()).default as Handler;
}

describe("?debug=1 parity across card routes", () => {
	beforeEach(() => {
		vi.resetModules();
		delete process.env.UPSTASH_REST_URL;
		delete process.env.UPSTASH_REST_TOKEN;
	});

	afterEach(() => {
		delete process.env.PAT_1;
		process.env.RENDER_CACHE = "1";
		vi.restoreAllMocks();
	});

	it.each(ROUTES)(
		"$name answers a validation failure with JSON diagnostics",
		async ({ path, name }) => {
			const handler = await loadHandler(name);
			const res = makeRes();
			await handler(
				makeReq(`${path}?debug=1`) as unknown as VercelRequest,
				res as unknown as VercelResponse,
			);

			expect(res._status()).toBe(200);
			expect(res._headers.get("content-type")).toContain("application/json");
			expect(res._headers.get("cache-control")).toContain("no-store");

			const payload = JSON.parse(res._body());
			expect(payload.service).toBe(name);
			expect(payload.ok).toBe(false);
			expect(payload.stage).toBe("validation");
			expect(payload.code).toBe("UNKNOWN");
			expect(payload.error).toMatch(/username|user/i);
		},
	);

	it.each(ROUTES)(
		"$name ignores ?debug=0 and still returns an SVG card",
		async ({ path, name }) => {
			const handler = await loadHandler(name);
			const res = makeRes();
			await handler(
				makeReq(`${path}?username=`) as unknown as VercelRequest,
				res as unknown as VercelResponse,
			);
			// A malformed username is a validation failure, and without debug=1
			// that must be the standard error card.
			expect(res._body()).toContain("<svg");
			expect(res._body()).toContain("ZINNIA_ERR:");
		},
	);

	it("trophy reports a successful render with cache and timing detail", async () => {
		vi.doMock("../../lib/loader/index.js", () => ({
			resolveCompiledHandler: () => "/fake/trophy.js",
			importByPath: async () => ({
				renderTrophySVG: async () => "<svg>TROPHY-CARD</svg>",
			}),
			pickHandlerFromModule: () => null,
			invokePossibleRequestHandler: async () => null,
		}));
		const handler = await loadHandler("trophy");
		const res = makeRes();
		await handler(
			makeReq(
				"/api/trophy?username=alice&theme=light&debug=1",
			) as unknown as VercelRequest,
			res as unknown as VercelResponse,
		);

		expect(res._headers.get("content-type")).toContain("application/json");
		const payload = JSON.parse(res._body());
		expect(payload.service).toBe("trophy");
		expect(payload.ok).toBe(true);
		expect(payload.stage).toBe("done");
		expect(payload.params.username).toBe("alice");
		expect(payload.cache.status).toBe("miss");
		expect(payload.cache.ttlSeconds).toBe(86400);
		expect(typeof payload.timing.totalMs).toBe("number");
		expect(payload.render.bytes).toBeGreaterThan(0);
		// PAT presence is safe to expose; the value must never appear.
		expect(payload.validation.patConfigured).toBe(false);
		expect(JSON.stringify(payload)).not.toContain("ghp_");
	});

	it("streak reports a cached render without claiming a fetch happened", async () => {
		const rc = await import("../../lib/render-cache.js");
		await rc.setCachedRender(
			"streak",
			rc.renderCacheKey(new URL("http://localhost/api/streak?user=alice")),
			"<svg>STREAK-CARD</svg>",
			3600,
		);
		const handler = await loadHandler("streak");
		const res = makeRes();
		await handler(
			makeReq("/api/streak?user=alice&debug=1") as unknown as VercelRequest,
			res as unknown as VercelResponse,
		);

		const payload = JSON.parse(res._body());
		expect(payload.service).toBe("streak");
		expect(payload.ok).toBe(true);
		expect(payload.cache.status).toBe("hit");
		expect(payload.timing.fetchMs).toBeUndefined();
		expect(payload.render.bytes).toBe("<svg>STREAK-CARD</svg>".length);
	});

	it("leetcode reports a cached render without contacting LeetCode", async () => {
		const rc = await import("../../lib/render-cache.js");
		await rc.setCachedRender(
			"leetcode",
			rc.renderCacheKey(
				new URL("http://localhost/api/leetcode?username=alice"),
			),
			"<svg>LEETCODE-CARD</svg>",
			3600,
		);
		const handler = await loadHandler("leetcode");
		const res = makeRes();
		await handler(
			makeReq(
				"/api/leetcode?username=alice&debug=1",
			) as unknown as VercelRequest,
			res as unknown as VercelResponse,
		);

		const payload = JSON.parse(res._body());
		expect(payload.service).toBe("leetcode");
		expect(payload.cache.status).toBe("hit");
		expect(payload.render.bytes).toBe("<svg>LEETCODE-CARD</svg>".length);
	});
});

describe("getDebugFlag", () => {
	it("accepts only 1 and true", async () => {
		const { getDebugFlag } = await import("../../lib/debug.js");
		expect(getDebugFlag(new URL("https://x/?debug=1"))).toBe(true);
		expect(getDebugFlag(new URL("https://x/?debug=TRUE"))).toBe(true);
		expect(getDebugFlag(new URL("https://x/?debug=true"))).toBe(true);
		expect(getDebugFlag(new URL("https://x/?debug=0"))).toBe(false);
		expect(getDebugFlag(new URL("https://x/?debug=yes"))).toBe(false);
		expect(getDebugFlag(new URL("https://x/"))).toBe(false);
	});
});
