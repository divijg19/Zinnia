import { describe, expect, it, vi } from "vitest";

describe("stats api index handler headers", () => {
	it("sets Vary header on responses", async () => {
		const mod = await import("../../stats/api/index.js");
		const handler = mod.default;

		const res = { setHeader: vi.fn(), send: vi.fn(), status: vi.fn() } as any;
		const req = { url: "http://localhost/api/index" } as any;

		await handler(req, res);

		expect(res.setHeader).toHaveBeenCalledWith("Vary", "Accept-Encoding");
	});
});
