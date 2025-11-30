import { describe, expect, it, vi } from "vitest";

describe("stats api gist handler headers", () => {
	it("sets Vary header on responses", async () => {
		const mod = await import("../../stats/api/gist.js");
		const handler = mod.default;

		const res = {
			setHeader: vi.fn(),
			send: vi.fn(),
			status: vi.fn(),
		} as unknown as Record<string, unknown>;
		const req = { url: "http://localhost/api/gist" } as unknown as Record<
			string,
			unknown
		>;

		await handler(req, res);

		expect(res.setHeader).toHaveBeenCalledWith("Vary", "Accept-Encoding");
	});
});
