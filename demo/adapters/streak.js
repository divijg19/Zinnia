import { toStreakTheme } from "../../lib/themes/adapters/streak.ts";
import { generateOutput } from "../../streak/src/index.ts";

export function streakOptions(theme) {
	return {
		...Object.fromEntries(
			Object.entries(toStreakTheme(theme)).map(([key, value]) => [
				key,
				value.replace(/^#/, ""),
			]),
		),
		theme: undefined,
		locale: "en",
		date_format: "M j, Y",
		disable_animations: "true",
	};
}

export async function renderStreak(theme, fixture) {
	return (await generateOutput(fixture, streakOptions(theme))).body;
}
