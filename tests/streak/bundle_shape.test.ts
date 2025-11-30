import { expect, it } from "vitest";

it("streak/dist bundle exports expected public API", async () => {
	const mod = await import("../../streak/dist/index.js");
	const expected = [
		"generateOutput",
		"renderForUser",
		"getCache",
		"generateCard",
		"fetchContributions",
		"getContributionStats",
		"getWeeklyContributionStats",
	];
	const modRecord = mod as unknown as Record<string, unknown>;
	for (const k of expected) {
		expect(modRecord[k]).not.toBeUndefined();
	}
});
