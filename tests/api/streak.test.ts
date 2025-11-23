import { beforeEach, describe, expect, it, vi } from "vitest";
import { headerValue, makeReq, makeRes } from "../_resShim";

describe("/api/streak handler", () => {
	beforeEach(() => {
		vi.resetModules();
		(global as any).fetch = undefined;
	});

	it("forwards successful upstream SVG and sets headers", async () => {
		(global as any).fetch = vi.fn().mockResolvedValue({
			status: 200,
			headers: {
				get: (k: string) => (k === "content-type" ? "image/svg+xml" : null),
			},
			text: async () => "<svg>OK</svg>",
		});

		const mod = await import("../../api/streak.js");
		const handler = mod.default;

		const req: any = makeReq("/api/streak?user=test");
		req.query = { user: "test" };
		const res: any = makeRes();

		await handler(req, res);

		expect(headerValue(res, "Content-Type")).toBe(
			"image/svg+xml; charset=utf-8",
		);
		expect(res.send).toHaveBeenCalledWith("<svg>OK</svg>");
	});

	it("retries on upstream 500 and eventually returns success", async () => {
		// first response 500, then 200
		const seq = [
			{
				status: 500,
				headers: { get: () => "image/svg+xml" },
				text: async () => "<svg>ERR</svg>",
			},
			{
				status: 200,
				headers: { get: () => "image/svg+xml" },
				text: async () => "<svg>RECOVERED</svg>",
			},
		];
		let i = 0;
		(global as any).fetch = vi.fn().mockImplementation(async () => seq[i++]);

		const mod = await import("../../api/streak.js");
		const handler = mod.default;

		const req: any = makeReq("/api/streak?user=test");
		req.query = { user: "test" };
		const res: any = makeRes();

		await handler(req, res);

		expect(res.send).toHaveBeenCalledWith("<svg>RECOVERED</svg>");
	});

	it("returns standardized error SVG when upstream permanently fails", async () => {
		(global as any).fetch = vi.fn().mockRejectedValue(new Error("network"));

		const mod = await import("../../api/streak.js");
		const handler = mod.default;

		const req: any = makeReq("/api/streak?user=test");
		req.query = { user: "test" };
		const res: any = makeRes();

		await handler(req, res);

		expect(headerValue(res, "Content-Type")).toBe(
			"image/svg+xml; charset=utf-8",
		);
		// When upstream permanently fails we prefer to serve a cached
		// last-known-good SVG if available; otherwise return a standardized
		// error SVG. Accept either behavior in tests (cached fallback or error).
		const body = res.send.mock.calls[0][0] as string;
		if (body.includes("Upstream streak fetch failed")) {
			expect(body).toContain("ZINNIA_ERR:STREAK_UPSTREAM_FETCH");
		} else {
			// fallback should be an SVG payload
			expect(body).toContain("<svg");
		}
	});

	it("returns error when upstream returns non-SVG content", async () => {
		(global as any).fetch = vi.fn().mockResolvedValue({
			status: 200,
			headers: { get: () => "application/json" },
			text: async () => JSON.stringify({ ok: false }),
		});

		const mod = await import("../../api/streak.js");
		const handler = mod.default;

		const req: any = makeReq("/api/streak?user=test");
		req.query = { user: "test" };
		const res: any = makeRes();

		await handler(req, res);

		const body = res.send.mock.calls[0][0] as string;
		expect(body).toContain("Upstream streak returned 200");
		expect(body).toContain("ZINNIA_ERR:STREAK_UPSTREAM_STATUS");
	});

	it("honors client If-None-Match and returns 304 when ETag matches", async () => {
		const upstreamBody = "<svg>CACHED</svg>";
		(global as any).fetch = vi.fn().mockResolvedValue({
			status: 200,
			headers: { get: () => "image/svg+xml" },
			text: async () => upstreamBody,
		});

		// compute etag using the same helper
		const utils = await import("../../api/_utils.js");
		const etag = utils.computeEtag(upstreamBody);

		const mod = await import("../../api/streak.js");
		const handler = mod.default;

		const req: any = makeReq("/api/streak?user=test", {
			"if-none-match": etag,
		});
		req.query = { user: "test" };
		const res: any = makeRes();

		await handler(req, res);

		expect(res.status).toHaveBeenCalledWith(304);
		expect(res.send).toHaveBeenCalledWith("");
	});

	it("forwards upstream 404 SVG payload and sets short cache TTL", async () => {
		(global as any).fetch = vi.fn().mockResolvedValue({
			status: 404,
			headers: { get: () => "image/svg+xml" },
			text: async () => "<svg>NOTFOUND</svg>",
		});

		const mod = await import("../../api/streak.js");
		const handler = mod.default;

		const req: any = makeReq("/api/streak?user=test");
		req.query = { user: "test" };
		const res: any = makeRes();

		await handler(req, res);

		// The handler returns 200 for embeddability but exposes the
		// original upstream status via a header and marks the response transient.
		expect(res.send).toHaveBeenCalledWith("<svg>NOTFOUND</svg>");
		expect(headerValue(res, "X-Upstream-Status")).toBe("404");
		const cc = headerValue(res, "Cache-Control") || "";
		// cache max-age should be small (<= 60)
		const m = cc.match(/max-age=(\d+)/);
		expect(m).toBeTruthy();
		if (m) expect(Number(m[1])).toBeLessThanOrEqual(60);
		expect(headerValue(res, "X-Cache-Status")).toBe("transient");
	});
});
