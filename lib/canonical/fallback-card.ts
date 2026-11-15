import { buildStreakSvg } from "../../streak/src/svg_builder.js";

/**
 * The card the streak route falls back to.
 *
 * When the renderer cannot be loaded - the shard is missing, the import
 * fails - the route still has to answer with a renderable card, because a
 * broken image on a profile page is worse than an empty one. This is that
 * card: the same shape the streak card has, with zeroed stats.
 *
 * It used to live in two places: `streak/src/loader.ts` rendered the
 * streak-shaped card, and `lib/canonical/loader.ts` fell back to a plainer
 * one. The renderer loader that needed it moved into the route, and the two
 * copies of the fallback were merged here.
 */

/** The streak theme the fallback card is drawn with. */
const FALLBACK_THEME = {
	background: "#0f172a",
	border: "#111827",
	stroke: "#94a3b8",
	ring: "#1f2937",
	fire: "#f97316",
	currStreakNum: "#ffffff",
	sideNums: "#cbd5e1",
	currStreakLabel: "#93c5fd",
	sideLabels: "#94a3b8",
	dates: "#cbd5e1",
};

/**
 * Render the fallback card for a user.
 *
 * The id seed is derived from the username so the generated ids stay stable:
 * the same user must not produce a different card on every request.
 */
export async function renderFallbackSvg(user: string): Promise<string> {
	return buildStreakSvg({
		stats: { currentStreak: 0, longestStreak: 0 },
		theme: FALLBACK_THEME,
		title: `Streak for ${user}`,
		idSeed: String(user),
	});
}

/** The last resort: a card even the builder cannot draw. */
export function minimalFallbackSvg(user: string): string {
	const escaped = String(user || "").replace(/[&<>"'`]/g, (s) => {
		switch (s) {
			case "&":
				return "&amp;";
			case "<":
				return "&lt;";
			case ">":
				return "&gt;";
			case '"':
				return "&quot;";
			case "'":
				return "&#39;";
			default:
				return s;
		}
	});
	return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" role="img" aria-label="Streak for ${escaped}"><title>Streak for ${escaped}</title><rect width="100%" height="100%" fill="#0f172a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">Streak for ${escaped}</text></svg>`;
}

export default { renderFallbackSvg, minimalFallbackSvg };
