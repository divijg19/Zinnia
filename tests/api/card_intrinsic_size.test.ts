import { describe, expect, it } from "vitest";
import { statusCardSvg } from "../../lib/status-svg";
import { renderStatsCard } from "../../stats/src/cards/stats";
import { renderTopLanguages } from "../../stats/src/cards/top-languages";

/**
 * An SVG without intrinsic `width`/`height` falls back to a 300x150 box in
 * every browser, so a README embed renders at the wrong size or as a squashed
 * strip - a failure that looks like a styling bug in the card rather than a
 * missing attribute. Camo serves the SVG verbatim, so it cannot patch this up.
 */
function rootAttrs(svg: string): Record<string, string> {
	const attrs = /<svg\b([^>]*)>/.exec(svg)?.[1];
	if (!attrs) throw new Error("no <svg> root element");
	const out: Record<string, string> = {};
	for (const m of attrs.matchAll(/([A-Za-z-]+)=["']([^"']*)["']/g)) {
		out[m[1] as string] = m[2] as string;
	}
	return out;
}

const STATS_MODEL = {
	name: "Alice",
	totalStars: 1,
	totalCommits: 2,
	totalIssues: 3,
	totalPRs: 4,
	totalPRsMerged: 0,
	mergedPRsPercentage: 0,
	totalReviews: 0,
	totalDiscussionsStarted: 0,
	totalDiscussionsAnswered: 0,
	contributedTo: 0,
	rank: { level: "C", percentile: 50 },
};

const LANGS = {
	// Keyed by language name, as the fetcher and renderer exchange it.
	HTML: { name: "HTML", color: "#e34c26", size: 200 },
	javascript: { name: "javascript", color: "#f1e05a", size: 200 },
	css: { name: "css", color: "#563d7c", size: 100 },
};

describe("cards carry intrinsic dimensions", () => {
	it.each([
		[
			"stats",
			renderStatsCard(STATS_MODEL, { hide_title: false, show_icons: true }),
		],
		[
			"top-langs",
			renderTopLanguages(LANGS, { layout: "compact", hide_title: false }),
		],
		["error card", statusCardSvg("boom")],
	])("%s declares width, height and viewBox on the root", (_name, svg) => {
		const attrs = rootAttrs(svg);
		expect(Number(attrs.width)).toBeGreaterThan(0);
		expect(Number(attrs.height)).toBeGreaterThan(0);
		expect(attrs.viewBox).toMatch(/^0 0 \d+(\.\d+)? \d+(\.\d+)?$/);
	});

	it("keeps a viewBox for every layout so an embed can resize it", () => {
		for (const layout of ["compact", "normal", "donut", "pie"] as const) {
			const attrs = rootAttrs(
				renderTopLanguages(LANGS, { layout, hide_title: false }),
			);
			expect(attrs.viewBox, `layout=${layout}`).toBeTruthy();
			expect(Number(attrs.width)).toBeGreaterThan(0);
		}
	});
});
