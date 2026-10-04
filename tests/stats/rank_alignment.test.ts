import { describe, expect, it } from "vitest";
import { renderStatsCard } from "../../stats/src/cards/stats";
import { RANK_RING_CENTER } from "../../stats/src/common/icons";

/**
 * The rank glyph must sit at the centre of the ring that surrounds it.
 *
 * `rankIcon` and the rank ring in `stats.ts` each used their own hardcoded
 * origin and they disagreed: the ring was drawn at `(-10, 8)` while every glyph
 * variant was centred at `(-5, 3)`. The letter, the GitHub mark and the
 * percentile text all rendered 5px right of the ring and 5px above it (8px for
 * the two-line percentile variant). Nothing failed, because a 5px offset is not
 * an error condition to any assertion - only to the eye.
 *
 * Both sides now derive from `RANK_RING_CENTER`; this pins the relationship so
 * the two cannot drift apart again.
 */

const MODEL = {
	name: "Test",
	totalStars: 100,
	totalCommits: 200,
	totalIssues: 300,
	totalPRs: 400,
	totalPRsMerged: 320,
	mergedPRsPercentage: 80,
	totalReviews: 50,
	totalDiscussionsStarted: 10,
	totalDiscussionsAnswered: 50,
	contributedTo: 500,
	rank: { level: "A+", percentile: 40 },
} as const;

function rankGroup(icon: string): string {
	const svg = renderStatsCard(
		MODEL as never,
		{
			show_icons: true,
			rank_icon: icon,
		} as never,
	);
	const start = svg.indexOf('<g data-testid="rank-circle"');
	expect(start, "rank-circle group not rendered").toBeGreaterThan(-1);
	return svg.slice(start, start + 800);
}

function ringCentre(group: string): { x: number; y: number } {
	const m = /<circle class="rank-circle-rim" cx="(-?\d+)" cy="(-?\d+)"/.exec(
		group,
	);
	expect(m, "rank ring not rendered").toBeTruthy();
	return { x: Number(m?.[1]), y: Number(m?.[2]) };
}

/** Geometric centre of every glyph inside `.rank-text`. */
function glyphCentres(group: string): { x: number; y: number }[] {
	const text = [...group.matchAll(/<text x="(-?\d+)" y="(-?\d+)"/g)].map(
		(m) => ({
			x: Number(m[1]),
			y: Number(m[2]),
		}),
	);
	if (text.length > 0) return text;
	const svg = /<svg x="(-?\d+)" y="(-?\d+)" height="(\d+)"/.exec(group);
	if (!svg) return [];
	const size = Number(svg[3]);
	return [{ x: Number(svg[1]) + size / 2, y: Number(svg[2]) + size / 2 }];
}

const VARIANTS = ["default", "github", "percentile"] as const;

describe("stats rank glyph alignment", () => {
	it("renders the ring at the shared centre", () => {
		expect(ringCentre(rankGroup("default"))).toEqual(RANK_RING_CENTER);
	});

	it.each(VARIANTS)("centres the %s glyph on the ring", (variant) => {
		const group = rankGroup(variant);
		const ring = ringCentre(group);
		const centres = glyphCentres(group);
		expect(centres.length).toBeGreaterThan(0);
		for (const c of centres) {
			expect(c.x).toBe(ring.x);
		}
		// A single glyph centres on the ring; the two-line percentile variant
		// stacks either side of it, so its own midpoint must land there.
		const first = centres[0] as { x: number; y: number };
		const last = centres[centres.length - 1] as { x: number; y: number };
		const midY = centres.length === 1 ? first.y : (first.y + last.y) / 2;
		expect(midY).toBe(ring.y);
	});
});
