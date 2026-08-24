import { describe, expect, it } from "vitest";

import { Card } from "../../trophy/src/card.ts";
import { COLORS } from "../../trophy/src/theme.ts";

const HARDENED_STACK = "Courier New, Courier, monospace";

const PLACEHOLDER_USER = {
	totalStargazers: 7200,
	totalCommits: 4200,
	// 15 → B "Many Friends"; 5 issues → C "First Issue" so every letter tier
	// (S/A/B/C) appears in the rendered card.
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

function renderCardSvg(): string {
	const card = new Card([], [], -1, -1, 110, 0, 0, false, false);
	return card.render(PLACEHOLDER_USER, COLORS.flat as never);
}

describe("trophy rank-letter font (golden)", () => {
	it("renders every rank letter with the hardened monospace stack", () => {
		const svg = renderCardSvg();

		const rankTexts = svg.match(/<text x="6" y="8"[^>]*>[^<]*<\/text>/g) ?? [];
		expect(rankTexts.length).toBeGreaterThan(0);

		for (const el of rankTexts) {
			expect(el).toContain(`font-family="${HARDENED_STACK}"`);
			expect(el).toMatch(/>[SABCU?]<\/text>/);
		}
	});

	it("covers every letter tier S/A/B/C at least once", () => {
		const svg = renderCardSvg();
		for (const letter of ["S", "A", "B", "C"]) {
			const pattern = new RegExp(
				`<text x="6" y="8" font-family="${HARDENED_STACK.replace(
					/[(),]/g,
					"\\$&",
				)}"[^>]*>${letter}</text>`,
			);
			expect(pattern.test(svg), `missing rank letter ${letter}`).toBe(true);
		}
	});
});
