import { generateCard } from "../../streak/src/card.js";
import type { Stats } from "../../streak/src/types_public";

describe("card radial gradient parsing", () => {
	test("embeds a radialGradient and url(#bggrad-) for radial tokens", () => {
		const stats: Stats = {
			mode: "daily",
			totalContributions: 0,
			firstContribution: "2020-01-01",
			longestStreak: { start: "2020-01-01", end: "2020-01-01", length: 0 },
			currentStreak: { start: "2020-01-01", end: "2020-01-01", length: 0 },
		};
		const svg = generateCard(stats, { background: "radial,#fff,#000" });
		expect(svg).toMatch(/<radialGradient[^>]*id='bggrad-[0-9a-f]+'/);
		expect(svg).toMatch(/url\(#bggrad-[0-9a-f]+\)/);
	});

	test("generates deterministic gradient ids for identical radial backgrounds and differs for different ones", () => {
		const stats: Stats = {
			mode: "daily",
			totalContributions: 0,
			firstContribution: "2020-01-01",
			longestStreak: { start: "2020-01-01", end: "2020-01-01", length: 0 },
			currentStreak: { start: "2020-01-01", end: "2020-01-01", length: 0 },
		};
		const a = generateCard(stats, { background: "radial,#123456,#abcdef" });
		const b = generateCard(stats, { background: "radial,#123456,#abcdef" });
		const c = generateCard(stats, { background: "radial,#123456,#000000" });
		const ida = a.match(/url\(#(bggrad-[0-9a-f]+)\)/)?.[1];
		const idb = b.match(/url\(#(bggrad-[0-9a-f]+)\)/)?.[1];
		const idc = c.match(/url\(#(bggrad-[0-9a-f]+)\)/)?.[1];
		expect(ida).toBe(idb);
		expect(ida).not.toBe(idc);
	});
});
