import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The suite-wide setup disables the render cache so route tests always exercise
// the real fetch. These tests drive it explicitly.
process.env.RENDER_CACHE = "1";

import {
	clearRenderMemory,
	defaultDeadlineMs,
	getCachedRender,
	inFlightCount,
	markCacheStatus,
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
	const impl = async (_url: string, _init: RequestInit) => {
		const cmd = JSON.parse(String(_init.body)) as string[];
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

describe("renderCacheKey", () => {
	it("ignores ?debug and ?cache so one URL family shares one render", () => {
		const a = renderCacheKey(new URL("https://x/api/stats?username=alice"));
		const b = renderCacheKey(
			new URL("https://x/api/stats?username=alice&debug=1&cache=60"),
		);
		expect(a).toBe(b);
	});

	it("ignores underscore-prefixed probes so they cannot evict a card", () => {
		const a = renderCacheKey(new URL("https://x/api/stats?username=alice"));
		const b = renderCacheKey(
			new URL("https://x/api/stats?username=alice&_cb=abc123"),
		);
		expect(a).toBe(b);
	});

	it("keeps params that change the rendered card", () => {
		const a = renderCacheKey(new URL("https://x/api/stats?username=alice"));
		const b = renderCacheKey(
			new URL("https://x/api/stats?username=alice&theme=dark"),
		);
		expect(a).not.toBe(b);
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
		const out = await renderWithFallback({
			service: "stats",
			cacheKey: "/api/stats?username=alice",
			freshSeconds: 600,
			produce: async () => "<svg>fresh</svg>",
		});
		expect(out.status).toBe("miss");
		expect(out.svg).toBe("<svg>fresh</svg>");
		expect(out.ageMs).toBe(0);

		const cached = await getCachedRender("stats", "/api/stats?username=alice");
		expect(cached?.svg).toBe("<svg>fresh</svg>");
	});

	it("serves a fresh cached render without running the producer", async () => {
		const key = "/api/stats?username=bob";
		await setCachedRender("stats", key, "<svg>cached</svg>", 600);
		const produce = vi.fn(async () => "<svg>fresh</svg>");

		const out = await renderWithFallback({
			service: "stats",
			cacheKey: key,
			freshSeconds: 600,
			produce,
		});

		expect(out.status).toBe("hit");
		expect(out.svg).toBe("<svg>cached</svg>");
		expect(produce).not.toHaveBeenCalled();
	});

	it("falls back to the previous render when the producer throws", async () => {
		const key = "/api/stats?username=carol";
		// freshSeconds 0 makes the entry immediately past its freshness window.
		await setCachedRender("stats", key, "<svg>previous</svg>", 0);

		const out = await renderWithFallback({
			service: "stats",
			cacheKey: key,
			freshSeconds: 600,
			produce: async () => {
				throw new Error("upstream down");
			},
		});

		expect(out.status).toBe("stale");
		expect(out.svg).toBe("<svg>previous</svg>");
		expect(out.deadlineExceeded).toBe(false);
	});

	it("falls back to the previous render when the producer overruns its deadline", async () => {
		const key = "/api/stats?username=dave";
		await setCachedRender("stats", key, "<svg>previous</svg>", 0);

		const out = await renderWithFallback({
			service: "stats",
			cacheKey: key,
			freshSeconds: 600,
			produce: () => new Promise<string>(() => {}),
			deadlineMs: 20,
		});

		expect(out.status).toBe("stale");
		expect(out.deadlineExceeded).toBe(true);
	});

	it("releases the slot of a hung producer so later requests can retry", async () => {
		const key = "/api/stats?username=hung";
		await setCachedRender("stats", key, "<svg>previous</svg>", 0);

		const hung = await renderWithFallback({
			service: "stats",
			cacheKey: key,
			freshSeconds: 600,
			produce: () => new Promise<string>(() => {}),
			deadlineMs: 20,
		});
		expect(hung.status).toBe("stale");
		// The hung attempt must not keep its coalescing slot: otherwise every
		// later request joins it and is served the same stale body forever.
		expect(inFlightCount()).toBe(0);

		const retried = await renderWithFallback({
			service: "stats",
			cacheKey: key,
			freshSeconds: 600,
			produce: async () => "<svg>recovered</svg>",
			deadlineMs: 500,
		});
		expect(retried.status).toBe("miss");
		expect(retried.svg).toBe("<svg>recovered</svg>");
	});

	it("rethrows when the producer fails and nothing is cached", async () => {
		await expect(
			renderWithFallback({
				service: "stats",
				cacheKey: "/api/stats?username=nobody",
				freshSeconds: 600,
				produce: async () => {
					throw new Error("upstream down");
				},
			}),
		).rejects.toThrow("upstream down");
	});

	it("treats an empty render as a failure rather than caching nothing", async () => {
		const key = "/api/stats?username=erin";
		await setCachedRender("stats", key, "<svg>previous</svg>", 0);
		const out = await renderWithFallback({
			service: "stats",
			cacheKey: key,
			freshSeconds: 600,
			produce: async () => "",
		});
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

		const [a, b, c] = await Promise.all([
			renderWithFallback({
				service: "stats",
				cacheKey: key,
				freshSeconds: 600,
				produce,
			}),
			renderWithFallback({
				service: "stats",
				cacheKey: key,
				freshSeconds: 600,
				produce,
			}),
			renderWithFallback({
				service: "stats",
				cacheKey: key,
				freshSeconds: 600,
				produce,
			}),
		]);

		expect(calls).toBe(1);
		expect(produce).toHaveBeenCalledTimes(1);
		for (const out of [a, b, c]) expect(out.svg).toBe("<svg>coalesced</svg>");
		// Nothing is left behind for the next request to trip over.
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
			renderWithFallback({
				service: "stats",
				cacheKey: "/api/stats?username=a",
				freshSeconds: 600,
				produce,
			}),
			renderWithFallback({
				service: "stats",
				cacheKey: "/api/stats?username=b",
				freshSeconds: 600,
				produce,
			}),
		]);
		expect(calls).toBe(2);
	});

	it("returns producer headers only when it actually rendered", async () => {
		const key = "/api/streak?user=grace";
		const produced = await renderWithFallback({
			service: "streak",
			cacheKey: key,
			freshSeconds: 600,
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

		const fromKv = await getCachedRender("stats", key);
		expect(fromKv?.svg).toBe("<svg>kv</svg>");
		expect(kv.calls.some((c) => c[0] === "SET")).toBe(true);
		expect(kv.calls.some((c) => c[0] === "GET")).toBe(true);
	});

	it("degrades to fetching when KV is unreachable", async () => {
		vi.stubGlobal("fetch", async () => new Response("nope", { status: 500 }));
		process.env.UPSTASH_REST_URL = KV_URL;
		process.env.UPSTASH_REST_TOKEN = "token";

		const out = await renderWithFallback({
			service: "stats",
			cacheKey: "/api/stats?username=ivan",
			freshSeconds: 600,
			produce: async () => "<svg>fetched</svg>",
		});
		expect(out.status).toBe("miss");
		expect(out.svg).toBe("<svg>fetched</svg>");
	});

	it("ignores a KV entry whose payload is not a usable render", async () => {
		// The env must be set here, not inside the stub: credentials are resolved
		// before `fetch` is ever called, so a stub that sets them would never run
		// and the case would pass for the wrong reason.
		process.env.UPSTASH_REST_URL = KV_URL;
		process.env.UPSTASH_REST_TOKEN = "token";
		const bodies = [
			'{"v":1,"svg":""}', // no body
			'{"v":2,"ts":1,"fresh":1,"svg":"<svg/>"}', // unknown version
			'{"v":1,"fresh":1}', // no body at all
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
			const out = await renderWithFallback({
				service: "stats",
				cacheKey: key,
				freshSeconds: 600,
				produce: async () => "<svg>live</svg>",
			});
			expect(out.status).toBe("miss");
			expect(out.svg).toBe("<svg>live</svg>");
		} finally {
			process.env.RENDER_CACHE = "1";
		}
	});
});

describe("ttlForOutcome / markCacheStatus / defaultDeadlineMs", () => {
	it("keeps the caller's TTL for fresh bodies and shortens stale ones", () => {
		const fresh = { status: "hit" } as never;
		const stale = { status: "stale" } as never;
		expect(ttlForOutcome(fresh, 86400)).toBe(86400);
		expect(ttlForOutcome(stale, 86400)).toBe(STALE_SERVE_SECONDS);
	});

	it("records the tier on the response", () => {
		const headers: Record<string, string> = {};
		markCacheStatus({ setHeader: (k, v) => (headers[k] = v) }, "stale");
		expect(headers["X-Cache-Status"]).toBe("stale");
	});

	it("defaults the deadline below both Camo's and Vercel's budget", () => {
		const previous = process.env.RENDER_DEADLINE_MS;
		try {
			delete process.env.RENDER_DEADLINE_MS;
			expect(defaultDeadlineMs()).toBe(3500);
			process.env.RENDER_DEADLINE_MS = "1200";
			expect(defaultDeadlineMs()).toBe(1200);
			process.env.RENDER_DEADLINE_MS = "not-a-number";
			expect(defaultDeadlineMs()).toBe(3500);
		} finally {
			if (previous === undefined) delete process.env.RENDER_DEADLINE_MS;
			else process.env.RENDER_DEADLINE_MS = previous;
		}
	});
});
