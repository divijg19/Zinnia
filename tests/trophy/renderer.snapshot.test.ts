import { describe, expect, it } from "vitest";
import { renderTrophySVG } from "../../trophy/src/renderer";

describe("renderTrophySVG snapshot", () => {
	it("renders onedark scaffold consistently", () => {
		const svg = renderTrophySVG({
			username: "alice",
			theme: "onedark",
			title: "Alice's Trophies",
			columns: 3,
		});
		expect(svg).toMatchSnapshot();
	});

	it("renders watchdog scaffold consistently", () => {
		const svg = renderTrophySVG({
			username: "bob",
			theme: "watchdog",
			title: "Bob's Trophies",
			columns: 3,
		});
		expect(svg).toMatchSnapshot();
	});
});
