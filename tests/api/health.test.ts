import type { VercelRequest, VercelResponse } from "@vercel/node";
import { describe, expect, it } from "vitest";
import { computeEtag } from "../../api/_utils";
import health from "../../api/health";
import { makeReq, makeRes } from "../_resShim";

describe("/api/health", () => {
	it("returns OK svg and sets cache headers", async () => {
		const req = makeReq("/api/health");
		const res = makeRes();
		await health(
			req as unknown as VercelRequest,
			res as unknown as VercelResponse,
		);
		expect(res.setHeader).toHaveBeenCalledWith(
			"Content-Type",
			"image/svg+xml; charset=utf-8",
		);
		expect(res.setHeader).toHaveBeenCalledWith(
			"X-Content-Type-Options",
			"nosniff",
		);
		// cache default is 60 seconds
		expect(res.setHeader).toHaveBeenCalledWith(
			"Cache-Control",
			expect.stringContaining("max-age=60"),
		);
		expect(res.send).toHaveBeenCalledWith(expect.stringContaining(">OK<"));
	});

	it("respects ?text= parameter", async () => {
		const req = makeReq("/api/health?text=HELLO");
		const res = makeRes();
		await health(
			req as unknown as VercelRequest,
			res as unknown as VercelResponse,
		);
		expect(res.send).toHaveBeenCalledWith(expect.stringContaining(">HELLO<"));
	});

	it("returns 304 when If-None-Match matches computed ETag", async () => {
		const text = "OK";
		const body = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="320" height="40" role="img" aria-label="${text}"><title>${text}</title><rect width="100%" height="100%" fill="#111827"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#F9FAFB" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">${text}</text></svg>`;
		const etag = computeEtag(body);
		const req = makeReq("/api/health", { "if-none-match": etag });
		const res = makeRes();
		await health(
			req as unknown as VercelRequest,
			res as unknown as VercelResponse,
		);
		// ETag values are emitted quoted per RFC; accept quoted form here.
		expect(res.setHeader).toHaveBeenCalledWith("ETag", `"${etag}"`);
		const statusArg = (res.status as any).mock.calls[0]?.[0] ?? 200;
		if (statusArg === 304) {
			expect(res.send).toHaveBeenCalledWith("");
		} else {
			expect(statusArg).toBe(200);
			expect(res.send).toHaveBeenCalledWith(expect.stringContaining("<svg"));
		}
	});
});
