import { describe, expect, test } from "vitest";
import { generateCard, generateErrorCard } from "../../streak/src/card.js";
import { generateOutput } from "../../streak/src/index.js";
import type { Stats } from "../../streak/src/stats.js";
import type { Params } from "../../streak/src/types_public.js";

describe("rendering helpers and output", () => {
	const testParams: Partial<Params> = {
		background: "000000",
		border: "111111",
		stroke: "222222",
		ring: "333333",
		fire: "444444",
		currStreakNum: "555555",
		sideNums: "666666",
		currStreakLabel: "777777",
		sideLabels: "888888",
		dates: "999999",
		excludeDaysLabel: "aaaaaa",
	};

	const testStats: Stats = {
		mode: "daily",
		totalContributions: 2048,
		firstContribution: "2016-08-10",
		longestStreak: { start: "2016-12-19", end: "2016-03-14", length: 86 },
		currentStreak: { start: "2019-03-28", end: "2019-04-12", length: 16 },
		excludedDays: [],
	};

	test("normal card render contains expected numbers and short_numbers works", () => {
		let render = generateCard(testStats, testParams);
		// base number formatting
		expect(render).toMatch(/2,048/);
		// enable short numbers
		const p2 = { ...testParams, short_numbers: "true" };
		render = generateCard(testStats, p2);
		expect(render).toMatch(/2K/);
	});

	test("error card render contains message", () => {
		const r = generateErrorCard("An unknown error occurred", testParams);
		expect(r).toContain("An unknown error occurred");
	});

	test("date_format parameter is applied", () => {
		const params: Partial<Params> = { ...testParams, date_format: "[Y-]m-d" };
		const stats: Stats = { ...testStats } as Stats;
		stats.currentStreak.end = `${new Date().getUTCFullYear()}-04-12`;
		const render = generateCard(stats, params);
		expect(render).toContain("2016-08-10 - Present");
		expect(render).toContain("2019-03-28 - 04-12");
	});

	test("locale=ja uses date_format from translations and japanese phrases", () => {
		const params = { ...testParams, locale: "ja" };
		const render = generateCard(testStats, params);
		expect(render).toMatch(/総ｺﾝﾄﾘﾋﾞｭｰｼｮﾝ数/);
		expect(render).toMatch(/2016\.8\.10/);
		expect(render).toMatch(/現在のストリーク/);
	});

	test("border radius option affects svg rect rx", () => {
		const params = { ...testParams, border_radius: "16" };
		const render = generateCard(testStats, params);
		expect(render).toContain("rx='16'");
		expect(render).toContain("fill='#000000'");
	});

	test("disable_animations removes animation and opacity:0", async () => {
		const params = { ...testParams, disable_animations: "true" };
		const res = await generateOutput(testStats, params);
		const body = typeof res.body === "string" ? res.body : res.body.toString();
		expect(body).not.toContain("opacity: 0;");
		expect(body).toContain("opacity: 1;");
		expect(body).toContain("font-size: 28px;");
	});

	test("alpha hex conversion and stroke opacity present", async () => {
		// transparent -> #0000
		const p1 = { ...testParams, background: "transparent" };
		let body: string;
		{
			const res1 = await generateOutput(testStats, p1);
			body =
				typeof res1.body === "string"
					? res1.body
					: (res1.body as Buffer).toString();
		}
		expect(body).toContain("fill='#000000' fill-opacity='0'");

		// ff000080 -> converted color and opacity
		const p2 = { ...testParams, background: "ff000080" };
		{
			const res2 = await generateOutput(testStats, p2);
			body =
				typeof res2.body === "string"
					? res2.body
					: (res2.body as Buffer).toString();
		}
		expect(body).toContain("fill='#ff0000' fill-opacity='");

		// stroke opacity
		const p3 = { ...testParams, border: "00ff0080" };
		{
			const res3 = await generateOutput(testStats, p3);
			body =
				typeof res3.body === "string"
					? res3.body
					: (res3.body as Buffer).toString();
		}
		expect(body).toContain("stroke='#00ff00' stroke-opacity='");
	});

	test("gradient background generates gradient defs", async () => {
		const p = { ...testParams, background: "45,f00,e11" };
		const body = (await generateOutput(testStats, p)).body as string;
		expect(body).toContain("fill='url(#");
		expect(body).toContain("linearGradient");
		expect(body).toContain("stop-color='#f00'");
		expect(body).toContain("stop-color='#e11'");
	});
});
