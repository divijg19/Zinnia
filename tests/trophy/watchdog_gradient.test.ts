import { describe, expect, it } from "vitest";
import { renderTrophySVG } from "../../trophy/src/renderer";

describe("trophy watchdog gradient", () => {
	it("emits a linearGradient and uses url(#bgGrad) when theme=watchdog", () => {
		const svg = renderTrophySVG({
			username: "bob",
			theme: "watchdog",
			columns: 3,
		});
		expect(svg).toContain("<linearGradient");
		expect(svg).toContain('id="bgGrad"');
		expect(svg).toContain("url(#bgGrad)");
	});
});
