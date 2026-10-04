import { describe, expect, it } from "vitest";
import {
	asWebCache,
	pickForwardedHeaders,
} from "../../lib/canonical/http_cache";
import { ALLOWED_THEMES } from "../../lib/params";
import { themes } from "../../lib/themes/registry";

/**
 * The card route used to hand the Generator `null` for its cache and `{}` for
 * its headers.
 *
 * `null` disabled the Generator's own KV data cache, so every single embed view
 * re-queried LeetCode's GraphQL endpoint. `{}` sent that query with no headers,
 * which is what drew a rate limit from shared egress addresses - and a rate
 * limit is what produced the fabricated card described in
 * `tests/leetcode/fetch_failure.test.ts`. `leetcode/api/index.ts` took the
 * caller's headers as a parameter for precisely this reason.
 */

describe("upstream header forwarding", () => {
	it("forwards the headers an upstream API actually needs", () => {
		const forwarded = pickForwardedHeaders({
			referer: "https://example.test/readme",
			"user-agent": "Mozilla/5.0",
		});
		expect(forwarded).toEqual({
			referer: "https://example.test/readme",
			"user-agent": "Mozilla/5.0",
		});
	});

	it("never forwards cookies", () => {
		// A direct hit on the card URL carries the viewer's own session cookies.
		// The LeetCode query reads public profile data and needs no auth, so
		// forwarding them would hand a credential to a third party for nothing.
		const forwarded = pickForwardedHeaders({
			referer: "https://github.com/analeis",
			cookie: "github_session=secret; _octo=abc",
		});
		expect(forwarded).not.toHaveProperty("cookie");
		expect(Object.keys(forwarded)).toEqual(["referer"]);
	});

	it("tolerates missing, empty and non-string headers", () => {
		expect(pickForwardedHeaders(undefined)).toEqual({});
		expect(pickForwardedHeaders({})).toEqual({});
		expect(pickForwardedHeaders({ referer: "" })).toEqual({});
		expect(
			pickForwardedHeaders({ "user-agent": ["a", "b"] as unknown as string }),
		).toEqual({});
	});
});

describe("theme allowlist covers the registry", () => {
	it("agrees with the registry exactly", () => {
		expect(ALLOWED_THEMES.size).toBe(Object.keys(themes).length);
	});
});

describe("asWebCache bridges the adapter to the Cache interface", () => {
	function fakeAdapter() {
		const store = new Map<string, { value: string; ttl?: number }>();
		return {
			store,
			get: async (key: string) => store.get(key)?.value ?? null,
			set: async (key: string, value: string, ttl?: number) => {
				store.set(key, { value, ttl });
			},
		};
	}

	it("exposes the two methods the LeetCode core calls", () => {
		// `card.ts`, `exts/font.ts` and `exts/remote-style.ts` all call
		// `cache.match()` and `cache.put()`. Handing the core the bare
		// `{get,set}` adapter made every request throw
		// `this.cache.match is not a function`.
		const cache = asWebCache(fakeAdapter());
		expect(typeof cache.match).toBe("function");
		expect(typeof cache.put).toBe("function");
	});

	it("reports a miss as undefined, like Cache.match does", async () => {
		const cache = asWebCache(fakeAdapter());
		expect(await cache.match("absent")).toBeUndefined();
	});

	it("round-trips a stored body as a Response", async () => {
		const adapter = fakeAdapter();
		const cache = asWebCache(adapter);
		await cache.put(
			"key",
			new Response('{"a":1}', {
				headers: { "cache-control": "max-age=300" },
			}),
		);
		const hit = await cache.match("key");
		expect(hit).toBeInstanceOf(Response);
		expect(await hit?.json()).toEqual({ a: 1 });
	});

	it("forwards the TTL from cache-control so entries can expire", async () => {
		// `get()` only enforces expiry when the stored ttl is a finite number, so
		// a write that dropped it would never expire.
		const adapter = fakeAdapter();
		const cache = asWebCache(adapter);
		await cache.put(
			"key",
			new Response("x", { headers: { "cache-control": "max-age=300" } }),
		);
		expect(adapter.store.get("key")?.ttl).toBe(300);
	});

	it("leaves the TTL unset when the response declares none", async () => {
		const adapter = fakeAdapter();
		const cache = asWebCache(adapter);
		await cache.put("key", new Response("x"));
		expect(adapter.store.get("key")?.ttl).toBeUndefined();
	});
});
