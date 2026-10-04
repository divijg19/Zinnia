import { describe, expect, it } from "vitest";
import {
	ALLOWED_THEMES,
	pickForwardedHeaders,
} from "../../lib/canonical/http_cache";
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
			cookie: "LEETCODE_SESSION=abc",
		});
		expect(forwarded).toEqual({
			referer: "https://example.test/readme",
			"user-agent": "Mozilla/5.0",
			cookie: "LEETCODE_SESSION=abc",
		});
	});

	it("does not forward hop-by-hop or routing headers", () => {
		const forwarded = pickForwardedHeaders({
			referer: "https://example.test",
			host: "evil.test",
			"content-length": "0",
			connection: "close",
			"x-forwarded-for": "1.2.3.4",
		});
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
