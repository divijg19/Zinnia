import { describe, expect, it } from "vitest";
import { renderSvg } from "../src/renderer.js";
import type { ContributionDay } from "../src/types.js";

describe("renderer golden", () => {
	it("matches snapshot for sample days", () => {
		const days: ContributionDay[] = Array.from({ length: 10 }).map((_, i) => ({
			date: `2025-01-${String(i + 1).padStart(2, "0")}`,
			count: i % 4,
		}));
		const svg = renderSvg(days);
		expect(svg).toMatchSnapshot();
	});
});
