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

export function assertSvgHeadersOnRes(res: any) {
	const headers: Record<string, string | undefined> = {};
	try {
		if (res && res._headers instanceof Map) {
			for (const [k, v] of res._headers) headers[k] = String(v);
		} else if (typeof res.getHeader === "function") {
			// Node-like response
			const names = [
				"Content-Type",
				"X-Content-Type-Options",
				"Vary",
				"Access-Control-Allow-Origin",
			];
			for (const n of names) {
				const val = res.getHeader(n);
				if (val != null) headers[n] = String(val);
			}
		} else if (
			typeof res.setHeader === "function" &&
			(res.setHeader as any).mock
		) {
			// Jest/Vitest spy: collect calls
			const calls = (res.setHeader as any).mock.calls as Array<
				[string, unknown]
			>;
			for (const c of calls) {
				const k = String(c[0]);
				const v = c[1] == null ? undefined : String(c[1]);
				headers[k] = v;
			}
		}
	} catch {}
	assertSvgHeaders(headers);
}
