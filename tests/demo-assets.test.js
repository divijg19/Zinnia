import { expect, test } from "vitest";
import { renderStreak } from "../demo/adapters/streak.js";
import { toStreakTheme } from "../lib/themes/adapters/streak.ts";
import { themes } from "../lib/themes/registry.ts";

const streak = {
	mode: "daily",
	totalContributions: 2048,
	firstContribution: "2016-08-10",
	longestStreak: { start: "2021-12-19", end: "2022-03-14", length: 86 },
	currentStreak: { start: "2026-09-01", end: "2026-09-16", length: 16 },
	excludedDays: [],
};

test("Streak preserves both exact Catppuccin registry definitions", async () => {
	for (const [name, color] of [
		["catppuccin_mocha", "#94e2d5"],
		["catppuccin-mocha", "#151515"],
	]) {
		expect(toStreakTheme(themes[name]).currStreakNum).toBe(color);
		const svg = await renderStreak(themes[name], streak);
		expect(svg).toContain(`fill='${color}'`);
		expect(svg).not.toContain(
			name === "catppuccin-mocha" ? "#94e2d5" : "#151515",
		);
	}
});
