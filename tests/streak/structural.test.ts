import { describe, expect, test } from "vitest";
import { generateOutput } from "../../streak/src/index.js";
import type { Stats } from "../../streak/src/stats.js";
import type { Params } from "../../streak/src/types_public.js";

describe("structural streak output", () => {
	const testStats: Stats = {
		mode: "daily",
		totalContributions: 2048,
		firstContribution: "2016-08-10",
		longestStreak: { start: "2016-12-19", end: "2016-03-14", length: 86 },
		currentStreak: { start: "2019-03-28", end: "2019-04-12", length: 16 },
		excludedDays: [],
	};

	test("gradient background produces linearGradient and url(#bggrad-)", async () => {
		const params = { background: "45,f00,e11" } as Params;
		const out = await generateOutput(testStats, params);
		const body = typeof out.body === "string" ? out.body : out.body.toString();
		expect(body).toMatch(/linearGradient/);
		expect(body).toMatch(/stop-color=['"]#f00['"]?/);
		expect(body).toMatch(/stop-color=['"]#e11['"]?/);
		expect(body).toMatch(/url\(#bggrad-[0-9a-f]{8}\)/);
	});

	test("transparent background converts to #0000 with opacity", async () => {
		const p: Params = { background: "transparent" };
		const out = await generateOutput(testStats, p);
		const body = typeof out.body === "string" ? out.body : out.body.toString();
		expect(body).toMatch(/fill=['"]#000000['"]/);
		expect(body).toMatch(/fill-opacity=['"][0-9.]+['"]/);
	});

	test("locale=ja yields Japanese translations", async () => {
		const out = await generateOutput(testStats, { locale: "ja" });
		const body = typeof out.body === "string" ? out.body : out.body.toString();
		expect(body).toMatch(/総ｺﾝﾄﾘﾋﾞｭｰｼｮﾝ数/);
	});
});
