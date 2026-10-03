import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The suite-wide setup disables the render cache so route tests always exercise
// the real fetch. These tests drive it explicitly.
process.env.RENDER_CACHE = "1";

import {
	clearRenderMemory,
	getCachedRender,
	inFlightCount,
	markCacheStatus,
	RENDER_CEILING_MS,
	RENDER_DEADLINE_MS,
	renderBudgetMs,
	renderCacheKey,
	renderWithFallback,
	STALE_SERVE_SECONDS,
	setCachedRender,
	ttlForOutcome,
} from "../../lib/render-cache.js";

const KV_URL = "https://upstash.test";

/**
 * Minimal Upstash REST stand-in. `upstashCallWithin` posts `[cmd, ...args]` and
 * reads `result`, so GET/SET with EX is all the render cache uses.
 */
function fakeKv() {
	const store = new Map<string, string>();
	const calls: string[][] = [];
	const impl = async (_url: string, init: RequestInit) => {
		const cmd = JSON.parse(String(init.body)) as string[];
		calls.push(cmd);
		if (cmd[0] === "GET") {
			const value = store.get(cmd[1] as string);
			return new Response(JSON.stringify({ result: value ?? null }), {
				status: 200,
				headers: { "content-type": "application/json" },
			});
		}
		if (cmd[0] === "SET") {
			store.set(cmd[1] as string, String(cmd[2]));
			return new Response(JSON.stringify({ result: "OK" }), { status: 200 });
		}
		return new Response(JSON.stringify({ result: null }), { status: 200 });
	};
	return { store, calls, impl };
}

function clearKvEnv() {
	delete process.env.UPSTASH_REST_URL;
	delete process.env.UPSTASH_REST_TOKEN;
	delete process.env.ZINNIA_REST_URL;
	delete process.env.UPSTASH_KV_REST_API_URL;
}

/** Render `service/cacheKey`, reading the cache exactly as a route now does. */
function render(
	service: string,
	cacheKey: string,
	produce: () => Promise<string>,
	extra: { deadlineMs?: number } = {},
) {
	return renderWithFallback({
		service,
		cacheKey,
		freshSeconds: 600,
		cached: null,
		produce,
		...extra,
	});
}

/** As {@link render}, but for the cases that seed a stale entry first. */
async function renderWithSeeded(
	service: string,
	cacheKey: string,
	seededSvg: string,
	produce: () => Promise<string>,
	extra: { deadlineMs?: number } = {},
) {
	await setCachedRender(service, cacheKey, seededSvg, 0);
	return renderWithFallback({
		service,
		cacheKey,
		freshSeconds: 600,
		cached: await getCachedRender(service, cacheKey),
		produce,
		...extra,
	});
}

describe("renderCacheKey", () => {
	it("ignores ?debug and ?cache so one URL family shares one render", () => {
		expect(renderCacheKey(new URL("https://x/api/stats?username=alice"))).toBe(
			renderCacheKey(
				new URL("https://x/api/stats?username=alice&debug=1&cache=60"),
			),
		);
	});

	it("ignores underscore-prefixed probes so they cannot evict a card", () => {
		expect(
			renderCacheKey(new URL("https://x/api/stats?username=alice&_cb=abc")),
		).toBe(renderCacheKey(new URL("https://x/api/stats?username=alice")));
	});

	it("keeps params that change the rendered card", () => {
		expect(
			renderCacheKey(new URL("https://x/api/stats?username=alice")),
		).not.toBe(
			renderCacheKey(new URL("https://x/api/stats?username=alice&theme=dark")),
		);
	});

	it("is order-insensitive so equivalent URLs collapse to one entry", () => {
		expect(renderCacheKey(new URL("https://x/api/stats?a=1&b=2"))).toBe(
			renderCacheKey(new URL("https://x/api/stats?b=2&a=1")),
		);
	});

	it("omits the question mark when there is no query", () => {
		expect(renderCacheKey(new URL("https://x/api/stats"))).toBe("/api/stats");
	});
});

describe("renderBudgetMs", () => {
	afterEach(() => {
		delete process.env.RENDER_DEADLINE_MS;
		delete process.env.RENDER_CEILING_MS;
	});

	it("keeps a short budget when a cached body can be served instead", () => {
		expect(renderBudgetMs(true)).toBe(RENDER_DEADLINE_MS);
	});

	it("allows the real card to finish when there is nothing to fall back on", () => {
		expect(renderBudgetMs(false)).toBe(RENDER_CEILING_MS);
	});

	it("stays inside GitHub Camo's 10s fetch timeout", () => {
		// A budget at or above Camo's limit converts a slow render into a blank
		// embed, which is the failure this whole cache exists to prevent.
		expect(RENDER_CEILING_MS).toBeLessThan(10_000);
		expect(RENDER_DEADLINE_MS).toBeLessThan(RENDER_CEILING_MS);
	});

	it("is overridable per deployment and ignores garbage values", () => {
		try {
			process.env.RENDER_DEADLINE_MS = "1200";
			process.env.RENDER_CEILING_MS = "9200";
			expect(renderBudgetMs(true)).toBe(1200);
			expect(renderBudgetMs(false)).toBe(9200);
			process.env.RENDER_CEILING_MS = "not-a-number";
			expect(renderBudgetMs(false)).toBe(RENDER_CEILING_MS);
		} finally {
			delete process.env.RENDER_DEADLINE_MS;
			delete process.env.RENDER_CEILING_MS;
		}
	});
});

describe("renderWithFallback", () => {
	beforeEach(() => {
		clearRenderMemory();
		clearKvEnv();
	});

	afterEach(() => {
		clearKvEnv();
		vi.unstubAllGlobals();
		clearRenderMemory();
	});

	it("renders, reports `miss`, and caches the body", async () => {
		const key = "/api/stats?username=alice";
		const out = await render("stats", key, async () => "<svg>fresh</svg>");

		expect(out.status).toBe("miss");
		expect(out.svg).toBe("<svg>fresh</svg>");
		expect(out.ageMs).toBe(0);
		expect((await getCachedRender("stats", key))?.svg).toBe("<svg>fresh</svg>");
	});

	it("serves a fresh cached render without running the producer", async () => {
		const key = "/api/stats?username=bob";
		await setCachedRender("stats", key, "<svg>cached</svg>", 600);
		const produce = vi.fn(async () => "<svg>fresh</svg>");

		const out = await renderWithFallback({
			service: "stats",
			cacheKey: key,
			freshSeconds: 600,
			cached: await getCachedRender("stats", key),
			produce,
		});

		expect(out.status).toBe("hit");
		expect(out.svg).toBe("<svg>cached</svg>");
		expect(produce).not.toHaveBeenCalled();
	});

	it("falls back to the previous render when the producer throws", async () => {
		const out = await renderWithSeeded(
			"stats",
			"/api/stats?username=carol",
			"<svg>previous</svg>",
			async () => {
				throw new Error("upstream down");
			},
		);

		expect(out.status).toBe("stale");
		expect(out.svg).toBe("<svg>previous</svg>");
		expect(out.deadlineExceeded).toBe(false);
	});

	it("falls back to the previous render when the producer overruns its deadline", async () => {
		const out = await renderWithSeeded(
			"stats",
			"/api/stats?username=dave",
			"<svg>previous</svg>",
			() => new Promise<string>(() => {}),
			{ deadlineMs: 20 },
		);

		expect(out.status).toBe("stale");
		expect(out.deadlineExceeded).toBe(true);
	});

	it("waits longer when there is nothing cached, so the real card wins", async () => {
		// The regression: a single 3500ms budget sat inside the cold fetch
		// distribution, so roughly a quarter of cold renders returned an error
		// card instead of a card.
		const key = "/api/stats?username=slow";
		let elapsed = 0;
		const out = await renderWithFallback({
			service: "stats",
			cacheKey: key,
			freshSeconds: 600,
			cached: null,
			produce: async () => {
				await new Promise((r) => setTimeout(r, 60));
				elapsed = Date.now();
				return "<svg>eventually</svg>";
			},
			// Far beyond the stale budget, but under the ceiling.
			deadlineMs: RENDER_CEILING_MS,
		});

		expect(out.status).toBe("miss");
		expect(out.svg).toBe("<svg>eventually</svg>");
		expect(elapsed).toBeGreaterThan(RENDER_DEADLINE_MS / 2);
	});

	it("releases the slot of a hung producer so later requests can retry", async () => {
		const key = "/api/stats?username=hung";
		const hung = await renderWithSeeded(
			"stats",
			key,
			"<svg>previous</svg>",
			() => new Promise<string>(() => {}),
			{ deadlineMs: 20 },
		);
		expect(hung.status).toBe("stale");
		// Otherwise every later request joins the hung attempt and is served the
		// same stale body forever.
		expect(inFlightCount()).toBe(0);

		const retried = await renderWithFallback({
			service: "stats",
			cacheKey: key,
			freshSeconds: 600,
			cached: await getCachedRender("stats", key),
			produce: async () => "<svg>recovered</svg>",
			deadlineMs: 500,
		});
		expect(retried.status).toBe("miss");
		expect(retried.svg).toBe("<svg>recovered</svg>");
	});

	it("rethrows when the producer fails and nothing is cached", async () => {
		await expect(
			render("stats", "/api/stats?username=nobody", async () => {
				throw new Error("upstream down");
			}),
		).rejects.toThrow("upstream down");
	});

	it("treats an empty render as a failure rather than caching nothing", async () => {
		const out = await renderWithSeeded(
			"stats",
			"/api/stats?username=erin",
			"<svg>previous</svg>",
			async () => "",
		);
		expect(out.status).toBe("stale");
		expect(out.svg).toBe("<svg>previous</svg>");
	});

	it("coalesces concurrent renders of the same card into one producer call", async () => {
		const key = "/api/stats?username=frank";
		let calls = 0;
		const produce = vi.fn(async () => {
			calls += 1;
			await new Promise((r) => setTimeout(r, 5));
			return "<svg>coalesced</svg>";
		});
		const one = () =>
			renderWithFallback({
				service: "stats",
				cacheKey: key,
				freshSeconds: 600,
				cached: null,
				produce,
			});

		const results = await Promise.all([one(), one(), one()]);

		expect(calls).toBe(1);
		expect(produce).toHaveBeenCalledTimes(1);
		for (const out of results) expect(out.svg).toBe("<svg>coalesced</svg>");
		expect(inFlightCount()).toBe(0);
	});

	it("does not coalesce different cards", async () => {
		let calls = 0;
		const produce = async () => {
			calls += 1;
			await new Promise((r) => setTimeout(r, 5));
			return `<svg>${calls}</svg>`;
		};
		await Promise.all([
			render("stats", "/api/stats?username=a", produce),
			render("stats", "/api/stats?username=b", produce),
		]);
		expect(calls).toBe(2);
	});

	it("returns producer headers only when it actually rendered", async () => {
		const key = "/api/streak?user=grace";
		const produced = await renderWithFallback({
			service: "streak",
			cacheKey: key,
			freshSeconds: 600,
			cached: null,
			produce: async () => ({
				svg: "<svg>local</svg>",
				headers: { "X-Streak-Renderer": "local" },
			}),
		});
		expect(produced.headers).toEqual({ "X-Streak-Renderer": "local" });

		const hit = await renderWithFallback({
			service: "streak",
			cacheKey: key,
			freshSeconds: 600,
			cached: await getCachedRender("streak", key),
			produce: async () => {
				throw new Error("must not run");
			},
		});
		// No producer ran, so claiming which renderer won would be a lie.
		expect(hit.headers).toEqual({});
	});

	it("reads and writes KV so renders survive across instances", async () => {
		const kv = fakeKv();
		vi.stubGlobal("fetch", kv.impl);
		process.env.UPSTASH_REST_URL = KV_URL;
		process.env.UPSTASH_REST_TOKEN = "token";

		const key = "/api/stats?username=heidi";
		await setCachedRender("stats", key, "<svg>kv</svg>", 600);
		clearRenderMemory();

		expect((await getCachedRender("stats", key))?.svg).toBe("<svg>kv</svg>");
		expect(kv.calls.some((c) => c[0] === "SET")).toBe(true);
		expect(kv.calls.some((c) => c[0] === "GET")).toBe(true);
	});

	it("degrades to fetching when KV is unreachable", async () => {
		vi.stubGlobal("fetch", async () => new Response("nope", { status: 500 }));
		process.env.UPSTASH_REST_URL = KV_URL;
		process.env.UPSTASH_REST_TOKEN = "token";

		const out = await render(
			"stats",
			"/api/stats?username=ivan",
			async () => "<svg>fetched</svg>",
		);
		expect(out.status).toBe("miss");
		expect(out.svg).toBe("<svg>fetched</svg>");
	});

	it("ignores a KV entry whose payload is not a usable render", async () => {
		// The env must be set here, not inside the stub: credentials resolve
		// before `fetch` is ever called, so a stub that set them would never run
		// and the case would pass for the wrong reason.
		process.env.UPSTASH_REST_URL = KV_URL;
		process.env.UPSTASH_REST_TOKEN = "token";
		const bodies = [
			'{"v":1,"svg":""}',
			'{"v":2,"ts":1,"fresh":1,"svg":"<svg/>"}',
			'{"v":1,"fresh":1}',
			"not json",
		];
		for (const body of bodies) {
			vi.stubGlobal(
				"fetch",
				async () =>
					new Response(JSON.stringify({ result: body }), {
						status: 200,
						headers: { "content-type": "application/json" },
					}),
			);
			expect(
				await getCachedRender("stats", "/api/stats?username=judy"),
				`payload: ${body}`,
			).toBeNull();
		}
	});

	it("is a no-op when RENDER_CACHE is off", async () => {
		process.env.RENDER_CACHE = "0";
		try {
			const key = "/api/stats?username=kyle";
			await setCachedRender("stats", key, "<svg>stored</svg>", 600);
			expect(await getCachedRender("stats", key)).toBeNull();
			const out = await render("stats", key, async () => "<svg>live</svg>");
			expect(out.status).toBe("miss");
			expect(out.svg).toBe("<svg>live</svg>");
		} finally {
			process.env.RENDER_CACHE = "1";
		}
	});
});

describe("response helpers", () => {
	it("keeps the caller's TTL for fresh bodies and shortens stale ones", () => {
		expect(ttlForOutcome({ status: "hit" } as never, 86400)).toBe(86400);
		expect(ttlForOutcome({ status: "stale" } as never, 86400)).toBe(
			STALE_SERVE_SECONDS,
		);
	});

	it("records the tier on the response", () => {
		const headers: Record<string, string> = {};
		markCacheStatus({ setHeader: (k, v) => (headers[k] = v) }, "stale");
		expect(headers["X-Cache-Status"]).toBe("stale");
	});
});
