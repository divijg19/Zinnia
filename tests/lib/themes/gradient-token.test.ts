import { describe, expect, it } from "vitest";
import { parseBackgroundToken } from "../../../lib/theme-helpers";

describe("parseBackgroundToken", () => {
	it("returns null for non-gradient input", () => {
		expect(parseBackgroundToken(undefined)).toBeNull();
		expect(parseBackgroundToken(null)).toBeNull();
		expect(parseBackgroundToken("")).toBeNull();
		expect(parseBackgroundToken("fffefe")).toBeNull();
		expect(parseBackgroundToken("transparent")).toBeNull();
	});

	it("parses linear angle,hex,hex tokens", () => {
		const parsed = parseBackgroundToken("45,520806,021D4A");
		expect(parsed).not.toBeNull();
		expect(parsed?.id).toMatch(/^bggrad-[0-9a-f]{8}$/);
		expect(parsed?.def).toContain("<linearGradient");
		expect(parsed?.def).toContain(`id='${parsed?.id}'`);
		expect(parsed?.def).toContain("rotate(45)");
		expect(parsed?.def).toContain("#520806");
		expect(parsed?.def).toContain("#021D4A");
	});

	it("parses radial tokens", () => {
		const parsed = parseBackgroundToken("radial,520806,021D4A");
		expect(parsed).not.toBeNull();
		expect(parsed?.def).toContain("<radialGradient");
		expect(parsed?.def).toContain(`id='${parsed?.id}'`);
	});

	it("accepts a deg suffix on the angle", () => {
		const parsed = parseBackgroundToken("45deg,520806,021D4A");
		expect(parsed?.def).toContain("rotate(45)");
	});

	it("is deterministic for the same input", () => {
		const first = parseBackgroundToken("45,520806,021D4A");
		const second = parseBackgroundToken("45,520806,021D4A");
		expect(first?.id).toBe(second?.id);
		expect(first?.def).toBe(second?.def);
	});

	it("discriminates different inputs", () => {
		const a = parseBackgroundToken("45,520806,021D4A");
		const b = parseBackgroundToken("90,520806,021D4A");
		expect(a?.id).not.toBe(b?.id);
	});
});
