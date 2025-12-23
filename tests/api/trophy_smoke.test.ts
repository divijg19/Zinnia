import { describe, expect, it } from "vitest";

import { renderTrophySVG } from "../../trophy/src/renderer";

describe("Trophy renderer smoke", () => {
	it("renders a basic SVG for ryo-ma", () => {
		const svg = renderTrophySVG({
			username: "ryo-ma",
			theme: "flat",
			title: undefined,
			columns: 4,
		});
		expect(typeof svg).toBe("string");
		expect(svg).toContain("<svg");
		expect(svg.length).toBeGreaterThan(20);
	});
});
