import { describe, expect, it } from "vitest";
import { Card } from "../../trophy/src/card";
import { getTrophyIcon } from "../../trophy/src/icons";
import { COLORS } from "../../trophy/src/theme";
import { RANK } from "../../trophy/src/utils";

// Golden path data for the trophy glyph, captured verbatim from
// `trophy/src/icons.ts` as it stood in d04db04 (before any of the embed work) and
// cross-checked against the rendered `public/demo/assets/aura-trophy.svg`.
//
// These are pinned byte-for-byte because nothing structural can detect their
// loss. The glyph is always four `<path>` elements in a 30x30 viewBox and always
// parses, so path counts, element counts, well-formedness and every geometry
// assertion elsewhere in this repo all pass on a deformed trophy. A past
// regression rewrote the cup's smooth-curve control point and replaced the
// stem+foot subpath with a stray line, and dropped one of the two lens
// subpaths: the icon still had four paths, so the suite stayed green while
// every trophy in every cell rendered deformed.
//
// If a change here is intentional, update the goldens from a rendered card and
// say so in the commit. Never retype path data by hand.
const CUP_PATH =
	"M3 1h10c-.495 3.467-.5 10-5 10S3.495 4.467 3 1zm0 15a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1H3zm2-1a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1H5z";
const LENS_PATH =
	"M12.5 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-3 2a3 3 0 1 1 6 0 3 3 0 0 1-6 0zm-6-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-3 2a3 3 0 1 1 6 0 3 3 0 0 1-6 0z";
const HANDLE_PATH = "M7 10h2v4H7v-4z";
const GEM_PATH = "M10 11c0 .552-.895 1-2 1s-2-.448-2-1 .895-1 2-1 2 .448 2 1z";

/** Pull the path data out of the trophy's own 30x30 `<svg>`, ignoring the background art. */
function iconPaths(svg: string): string[] {
	const block = svg.match(/<svg x="28" y="20"[^>]*>([\s\S]*?)<\/svg>/)?.[1];
	expect(block, "trophy icon <svg> not found").toBeTruthy();
	return [...(block as string).matchAll(/<path[^>]*\sd="([^"]+)"/g)].map(
		(m) => m[1] as string,
	);
}

const PLACEHOLDER_USER = {
	totalStargazers: 7200,
	totalCommits: 4200,
	totalFollowers: 15,
	totalIssues: 5,
	totalPullRequests: 300,
	totalRepositories: 120,
	totalReviews: 80,
	languageCount: 12,
	durationYear: 12,
	durationDays: 4500,
	ancientAccount: 1,
	joined2020: 1,
	ogAccount: 1,
	totalOrganizations: 5,
} as const;

describe("trophy icon geometry", () => {
	it("renders all four glyph paths byte-exactly", () => {
		expect(iconPaths(getTrophyIcon(COLORS.flat as never, RANK.S))).toEqual([
			HANDLE_PATH,
			GEM_PATH,
			LENS_PATH,
			CUP_PATH,
		]);
	});

	it("keeps the cup's stem and foot subpath", () => {
		const cup = iconPaths(getTrophyIcon(COLORS.flat as never, RANK.S)).find(
			(d) => d.startsWith("M3 1h10c"),
		);
		// The stem and foot are drawn as trailing subpaths of the cup path.
		expect(cup).toContain("zm0 15a1 1 0 0 1 1-1h8");
		expect(cup).toContain("zm2-1a1 1 0 0 1 1-1h4");
	});

	it("keeps both lens subpaths on the trophy face", () => {
		const lens = iconPaths(getTrophyIcon(COLORS.flat as never, RANK.S)).find(
			(d) => d.startsWith("M12.5 3a2 2"),
		);
		expect(lens).toBe(LENS_PATH);
		// Two circles plus two lenses, each closed by `z`.
		expect((lens as string).match(/z/g)).toHaveLength(4);
	});

	it("carries the same geometry into the assembled card", () => {
		const card = new Card([], [], -1, -1, 110, 0, 0, false, false);
		const svg = card.render(PLACEHOLDER_USER, COLORS.flat as never);
		expect(svg).toContain(CUP_PATH);
		expect(svg).toContain(LENS_PATH);
	});
});
