import { describe, expect, it } from "vitest";
import { renderSvg } from "../src/renderer.js";
import type { ContributionDay } from "../src/types.js";

describe("renderer PoC", () => {
	it("renders a total count in the title", () => {
		const days: ContributionDay[] = [
			{ date: "2025-01-01", count: 1 },
			{ date: "2025-01-02", count: 2 },
		];
		const svg = renderSvg(days);
		expect(svg).toContain("GitHub contributions: 3");
	});
});
