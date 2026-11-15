import { toStreakTheme } from "../../lib/themes/adapters/streak.js";
import type { ThemeDefinition } from "../../lib/themes/registry.js";
import { generateOutput } from "../../streak/src/index.js";
import type { Params } from "../../streak/src/types_public.js";

/** The options the demo renders a streak card with. */
export function streakOptions(theme: ThemeDefinition): Params {
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

/** Render the streak card for one theme, the way the demo shows it. */
export async function renderStreak(
	theme: ThemeDefinition,
	fixture: Parameters<typeof generateOutput>[0],
): Promise<string> {
	const out = await generateOutput(fixture, streakOptions(theme));
	return typeof out.body === "string" ? out.body : String(out.body);
}
