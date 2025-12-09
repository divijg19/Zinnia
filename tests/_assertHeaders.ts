import { expect } from "vitest";

export function assertSvgHeaders(
	headers: Record<string, string | string[] | undefined>,
) {
	const ct = (headers["Content-Type"] || headers["content-type"]) as
		| string
		| undefined;
	const xcto = (headers["X-Content-Type-Options"] ||
		headers["x-content-type-options"]) as string | undefined;
	const vary = (headers.Vary || headers.vary) as string | undefined;
	expect(ct).toContain("image/svg+xml");
	if (ct?.toLowerCase().includes("charset")) {
		expect(ct.toLowerCase()).toContain("charset=utf-8");
	}
	expect(xcto).toBe("nosniff");
	expect(vary).toContain("Accept-Encoding");
}
