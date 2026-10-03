import { describe, expect, it, vi } from "vitest";
import {
	setCacheHeaders,
	setFallbackCacheHeaders,
	setShortCacheHeaders,
	setSvgHeaders,
} from "../../lib/canonical/http_cache.js";

function makeRes() {
	const headers: Record<string, string> = {};
	return {
		headers,
		setHeader: (k: string, v: string) => {
			headers[k] = v;
		},
	};
}

/**
 * The cache policy is what stops a TTL expiry from blanking a README embed.
 * GitHub Camo fetches an origin image with a 10s budget and caches whatever
 * `max-age` it is given; if the origin answers "revalidate now" and then takes
 * longer than Camo will wait, the embed renders blank and only a refresh helps.
 * These assertions pin that reasoning to the headers we actually emit.
 */
describe("cache header policy", () => {
	it("allows a shared cache to serve stale while it refreshes", () => {
		const res = makeRes();
		setCacheHeaders(res, 86400);
		const cc = res.headers["Cache-Control"] as string;
		expect(cc).toContain("max-age=86400");
		expect(cc).toContain("s-maxage=86400");
		expect(cc).toContain("stale-while-revalidate=86400");
		expect(cc).toContain("stale-if-error=86400");
		// `must-revalidate` forbids serving stale, which cancels both directives
		// above and puts every expiry back on the cold path.
		expect(cc).not.toContain("must-revalidate");
	});

	it("keeps fresh responses cacheable by Camo and browsers", () => {
		const res = makeRes();
		setCacheHeaders(res, 60);
		const cc = res.headers["Cache-Control"] as string;
		expect(cc).toContain("public");
		expect(/max-age=60\b/.test(cc)).toBe(true);
	});

	it("caps a fallback body at an hour so it cannot be pinned in Camo", () => {
		const res = makeRes();
		setFallbackCacheHeaders(res, 604800);
		const cc = res.headers["Cache-Control"] as string;
		expect(cc).toContain("max-age=3600");
		expect(cc).not.toContain("604800");
	});

	it("still allows a fallback to be cached at all", () => {
		const res = makeRes();
		setFallbackCacheHeaders(res, 1);
		const cc = res.headers["Cache-Control"] as string;
		expect(cc).toContain("max-age=60");
		expect(res.headers["X-Cache-Status"]).toBe("fallback");
	});

	it("marks error responses transient", () => {
		const res = makeRes();
		setShortCacheHeaders(res, 60);
		expect(res.headers["Cache-Control"]).toContain("max-age=60");
		expect(res.headers["X-Cache-Status"]).toBe("transient");
	});

	it("labels every card response as SVG for Camo's media-type allowlist", () => {
		const res = makeRes();
		setSvgHeaders(res);
		expect(res.headers["Content-Type"]).toBe("image/svg+xml; charset=utf-8");
		expect(res.headers["X-Content-Type-Options"]).toBe("nosniff");
	});
});

describe("resolveCacheSeconds", () => {
	it("prefers ?cache= then env then the service fallback", async () => {
		const { resolveCacheSeconds } = await import(
			"../../lib/canonical/http_cache.js"
		);
		const url = new URL("https://x/api/stats?cache=120");
		expect(resolveCacheSeconds(url, ["SOME_CACHE_SECONDS"], 86400)).toBe(120);
		expect(
			resolveCacheSeconds(
				new URL("https://x/a"),
				["SOME_CACHE_SECONDS"],
				86400,
			),
		).toBe(86400);
	});

	it("clamps to the platform ceiling", async () => {
		const { resolveCacheSeconds } = await import(
			"../../lib/canonical/http_cache.js"
		);
		const url = new URL("https://x/api/stats?cache=99999999");
		expect(resolveCacheSeconds(url, [], 86400)).toBe(604800);
	});

	it("falls back to the base for an unparseable value rather than pinning 0", async () => {
		const { resolveCacheSeconds } = await import(
			"../../lib/canonical/http_cache.js"
		);
		const url = new URL("https://x/api/stats?cache=soon");
		expect(resolveCacheSeconds(url, [], 86400)).toBe(86400);
	});
});

describe("sendSuccessSvg", () => {
	it("answers 200 with the full body and a body-derived ETag", async () => {
		const { sendSuccessSvg } = await import(
			"../../lib/canonical/http_cache.js"
		);
		const res = {
			headers: {} as Record<string, string> & { ETag?: string },
			statusCode: 0,
			body: "",
			setHeader(k: string, v: string) {
				this.headers[k] = v;
			},
			status(code: number) {
				this.statusCode = code;
				return this;
			},
			send(payload: string) {
				this.body = payload;
				return this;
			},
		};
		sendSuccessSvg(res as never, "<svg>hi</svg>", 86400);
		expect(res.statusCode).toBe(200);
		expect(res.body).toBe("<svg>hi</svg>");
		expect(res.headers.ETag).toMatch(/^"[0-9a-f]+"$/);
		expect(res.headers["Cache-Control"]).toContain("max-age=86400");
	});
});

describe("module surface", () => {
	it("exports one definition of each header helper", async () => {
		const mod = await import("../../lib/canonical/http_cache.js");
		for (const name of [
			"setCacheHeaders",
			"setSvgHeaders",
			"setShortCacheHeaders",
			"setFallbackCacheHeaders",
			"sendSuccessSvg",
			"sendShortSvg",
			"sendFallbackSvg",
			"resolveCacheSeconds",
		]) {
			expect(typeof mod[name as keyof typeof mod]).toBe("function");
		}
		expect(vi.isMockFunction(mod.setCacheHeaders)).toBe(false);
	});
});
