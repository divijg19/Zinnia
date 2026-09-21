import { describe, expect, it } from "vitest";
import { WidgetFactory } from "../../demo/widgets/factory.js";

const registry = [
	{
		name: "default",
		displayName: "Default",
		widgets: {
			stats: { src: "./assets/default-stats.svg", width: 495, height: 195 },
			topLangs: {
				src: "./assets/default-topLangs.svg",
				width: 495,
				height: 195,
			},
			streak: { src: "./assets/default-streak.svg", width: 495, height: 195 },
			trophy: { src: "./assets/default-trophy.svg", width: 500, height: 125 },
			leetcode: {
				src: "./assets/default-leetcode.svg",
				width: 500,
				height: 200,
			},
		},
	},
];

describe("demo WidgetFactory", () => {
	it("creates all five widget kinds for a known theme", () => {
		const widgets = new WidgetFactory().createAll("default", registry);
		expect(widgets.map((w) => w.kind)).toEqual([
			"stats",
			"topLangs",
			"streak",
			"trophy",
			"leetcode",
		]);
		for (const widget of widgets) {
			expect(widget.render()).toContain("<img");
		}
	});

	it("returns no widgets for an unknown theme", () => {
		expect(new WidgetFactory().createAll("nope", registry)).toEqual([]);
	});
});
