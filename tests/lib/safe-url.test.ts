import { describe, expect, it } from "vitest";
import { safeUrl } from "../../lib/params.js";

function req(url?: string) {
	return {
		headers: { host: "example.com", "x-forwarded-proto": "https" },
		url,
	} as unknown as Parameters<typeof safeUrl>[0];
}

describe("safeUrl", () => {
	it("builds absolute URLs from request parts", () => {
		const url = safeUrl(req("/api/stats?username=a"), "/api/stats");
		expect(url.hostname).toBe("example.com");
		expect(url.protocol).toBe("https:");
		expect(url.searchParams.get("username")).toBe("a");
	});

	it("passes through absolute URLs", () => {
		const url = safeUrl(req("https://other.test/api/x?y=1"), "/api/stats");
		expect(url.hostname).toBe("other.test");
	});

	it("falls back on missing or malformed input", () => {
		expect(safeUrl(req(undefined), "/api/stats").pathname).toBe("/api/stats");
		expect(safeUrl(req("http://["), "/api/stats").pathname).toBe("/api/stats");
	});

	it("defaults host and protocol", () => {
		const url = safeUrl(
			{ headers: {}, url: "/api/x" } as unknown as Parameters<
				typeof safeUrl
			>[0],
			"/api/x",
		);
		expect(url.hostname).toBe("localhost");
		expect(url.protocol).toBe("http:");
	});
});
