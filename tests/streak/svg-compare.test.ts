import { describe, expect, it } from "vitest";
import { compareSvg } from "../../streak/src/svg-compare.ts";

describe("svg structural compare", () => {
	it("considers small numeric differences equal", async () => {
		const a =
			'<?xml version="1.0"?><svg><rect x="10" y="20" width="30.0001" height="40" /></svg>';
		const b = '<svg><rect x="10" y="20" width="30.0002" height="40" /></svg>';
		const r = await compareSvg(a, b);
		expect(r.equal).toBe(true);
	});

	it("detects missing element", async () => {
		const a = '<svg><rect x="1"/></svg>';
		const b = "<svg></svg>";
		const r = await compareSvg(a, b);
		expect(r.equal).toBe(false);
		expect(r.diffs.length).toBeGreaterThan(0);
	});

	it("normalizes bggrad ids", async () => {
		const a =
			'<svg><defs><linearGradient id="bggrad-ABC123"></linearGradient></defs><rect fill="url(#bggrad-ABC123)"/></svg>';
		const b =
			'<svg><defs><linearGradient id="bggrad-fff000"></linearGradient></defs><rect fill="url(#bggrad-fff000)"/></svg>';
		const r = await compareSvg(a, b);
		expect(r.equal).toBe(true);
	});
});
