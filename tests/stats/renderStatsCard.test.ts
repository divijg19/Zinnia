import { describe, expect, it } from "vitest";
import { renderStatsCard } from "../../stats/src/cards/stats";
import { CustomError } from "../../stats/src/common/error";

const stats = {
	name: "Anurag Hazra",
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
};

describe("Test renderStatsCard", () => {
	it("should render correctly", () => {
		document.body.innerHTML = renderStatsCard(stats);

		expect(document.getElementsByClassName("header")[0].textContent).toBe(
			"Anurag Hazra's GitHub Stats",
		);

		expect(
			document.body.getElementsByTagName("svg")[0].getAttribute("height"),
		).toBe("195");
		const starsEl = document.querySelector('[data-testid="stars"]');
		const commitsEl = document.querySelector('[data-testid="commits"]');
		const issuesEl = document.querySelector('[data-testid="issues"]');
		const prsEl = document.querySelector('[data-testid="prs"]');
		const contribsEl = document.querySelector('[data-testid="contribs"]');
		const cardBgEl = document.querySelector('[data-testid="card-bg"]');
		const rankCircleEl = document.querySelector('[data-testid="rank-circle"]');

		expect(starsEl).not.toBeNull();
		expect((starsEl as HTMLElement).textContent).toBe("100");
		expect(commitsEl).not.toBeNull();
		expect((commitsEl as HTMLElement).textContent).toBe("200");
		expect(issuesEl).not.toBeNull();
		expect((issuesEl as HTMLElement).textContent).toBe("300");
		expect(prsEl).not.toBeNull();
		expect((prsEl as HTMLElement).textContent).toBe("400");
		expect(contribsEl).not.toBeNull();
		expect((contribsEl as HTMLElement).textContent).toBe("500");
		expect(cardBgEl).not.toBeNull();
		expect(rankCircleEl).not.toBeNull();
	});

	it("should have proper name apostrophe", () => {
		document.body.innerHTML = renderStatsCard({ ...stats, name: "Anil Das" });
		expect(document.getElementsByClassName("header")[0].textContent).toBe(
			"Anil Das' GitHub Stats",
		);

		document.body.innerHTML = renderStatsCard({ ...stats, name: "Felix" });
		expect(document.getElementsByClassName("header")[0].textContent).toBe(
			"Felix's GitHub Stats",
		);
	});

	it("should hide individual stats", () => {
		document.body.innerHTML = renderStatsCard(stats, {
			hide: ["issues", "prs", "contribs"],
		});

		expect(
			document.body.getElementsByTagName("svg")[0].getAttribute("height"),
		).toBe("150");

		expect(document.querySelector('[data-testid="stars"]')).not.toBeNull();
		expect(document.querySelector('[data-testid="commits"]')).not.toBeNull();
		expect(document.querySelector('[data-testid="issues"]')).toBeNull();
	});

	it("should throw error if all stats and rank icon are hidden", () => {
		expect(() =>
			renderStatsCard(stats, {
				hide: ["stars", "commits", "prs", "issues", "contribs"],
				hide_rank: true,
			}),
		).toThrow(
			new CustomError(
				"Could not render stats card.",
				"Either stats or rank are required.",
			),
		);
	});
});
