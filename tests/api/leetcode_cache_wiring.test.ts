import type { VercelRequest, VercelResponse } from "@vercel/node";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The seam between the card route and the LeetCode core.
 *
 * `tests/api/leetcode_parity.test.ts` swaps the whole core out for a
 * `FakeGenerator`, so the route's real `produce()` never runs. That left the one
 * argument nothing covered: the cache object handed to `new Generator`.
 *
 * The bare `getCacheAdapterForService` result is `{ get, set }`, but the core
 * takes a Web `Cache` and calls `match()`/`put()` in three places - user data in
 * `card.ts`, plus `exts/font.ts` and `exts/remote-style.ts`. Passing the adapter
 * straight through made `this.cache?.match(...)` throw
 * `TypeError: this.cache.match is not a function` on every single request, which
 * the fetch error path converted into an error card for the whole route. Every
 * other test passed `null` or nothing, so `?.match` short-circuited and the
 * mismatch was invisible.
 *
 * This test asserts the contract at the boundary rather than the behaviour
 * behind it, so it stays fast and needs no `dist` bundle.
 */

const THEMELED_SVG = '<svg data-testid="real-card">radical applied</svg>';

let receivedCache: unknown;
let receivedHeaders: unknown;

class ContractCheckingGenerator {
	constructor(cache?: unknown, headers?: unknown) {
		receivedCache = cache;
		receivedHeaders = headers;
	}
	generate() {
		return Promise.resolve(THEMELED_SVG);
	}
}

function makeRes() {
	const res = {
		setHeader: vi.fn(),
		getHeader: vi.fn(),
		end: vi.fn(),
		status: vi.fn().mockReturnThis(),
		send: vi.fn(),
		writeHead: vi.fn().mockReturnThis(),
	};
	return res;
}

function makeReq(url: string, headers: Record<string, string> = {}) {
	return { url, method: "GET", headers } as unknown as VercelRequest;
}

async function callRoute(url: string, headers: Record<string, string> = {}) {
	vi.resetModules();
	vi.doMock("../../lib/loader/index.js", () => ({
		resolveCompiledHandler: () => "/fake/leetcode-core.js",
		importByPath: async () => ({
			Generator: ContractCheckingGenerator,
			FontExtension: () => ({}),
			AnimationExtension: () => ({}),
			ThemeExtension: () => ({}),
			HeatmapExtension: () => ({}),
			ActivityExtension: () => ({}),
			ContestExtension: () => ({}),
		}),
		pickHandlerFromModule: () => null,
		invokePossibleRequestHandler: async () => null,
	}));
	const leetcode = (await import("../../api/leetcode.js")).default;
	const res = makeRes();
	await leetcode(
		makeReq(url, headers) as unknown as VercelRequest,
		res as unknown as VercelResponse,
	);
	return res;
}

describe("leetcode route hands the core a Cache-shaped object", () => {
	beforeEach(() => {
		receivedCache = null;
		receivedHeaders = null;
	});

	it("serves the rendered card rather than an error card", async () => {
		const res = await callRoute("/api/leetcode?username=lcuser&theme=radical");
		expect(res.send).toHaveBeenCalledWith(THEMELED_SVG);
	});

	it("gives the core callable match() and put()", async () => {
		await callRoute("/api/leetcode?username=lcuser");
		expect(receivedCache).toBeTruthy();
		const cache = receivedCache as { match?: unknown; put?: unknown };
		// The exact failure this guards: `this.cache.match is not a function`.
		expect(typeof cache.match).toBe("function");
		expect(typeof cache.put).toBe("function");
	});

	it("gives the core a cache that reports misses without throwing", async () => {
		await callRoute("/api/leetcode?username=lcuser");
		const cache = receivedCache as {
			match: (key: string) => Promise<Response | undefined>;
		};
		// A filesystem/KV-backed store with no KV configured still has to answer
		// a miss rather than reject.
		await expect(cache.match("no-such-key")).resolves.toBeUndefined();
	});

	it("forwards only allowlisted headers", async () => {
		await callRoute("/api/leetcode?username=lcuser", {
			referer: "https://github.com/analeis",
			"user-agent": "camo",
			cookie: "github_session=secret",
			host: "evil.test",
		});
		expect(receivedHeaders).toEqual({
			referer: "https://github.com/analeis",
			"user-agent": "camo",
		});
	});
});
