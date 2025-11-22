import { describe, expect, it } from "vitest";
import { calculateRank } from "../../stats/src/calculateRank";

describe("calculateRank (vitest)", () => {
	it("new user gets C rank", () => {
		const res = calculateRank({
			all_commits: false,
			commits: 0,
			prs: 0,
			issues: 0,
			reviews: 0,
			repos: 0,
			stars: 0,
			followers: 0,
		});
		expect(res.level).toBe("C");
		expect(res.percentile).toBeCloseTo(100, 12);
	});

	it("beginner user gets B- rank", () => {
		const res = calculateRank({
			all_commits: false,
			commits: 125,
			prs: 25,
			issues: 10,
			reviews: 5,
			repos: 0,
			stars: 25,
			followers: 5,
		});
		expect(res.level).toBe("B-");
		expect(res.percentile).toBeCloseTo(65.02918514848255, 12);
	});

	it("median user gets B+ rank", () => {
		const res = calculateRank({
			all_commits: false,
			commits: 250,
			prs: 50,
			issues: 25,
			reviews: 10,
			repos: 0,
			stars: 50,
			followers: 10,
		});
		expect(res.level).toBe("B+");
		expect(res.percentile).toBeCloseTo(46.09375, 12);
	});

	it("advanced user gets A rank", () => {
		const res = calculateRank({
			all_commits: false,
			commits: 500,
			prs: 100,
			issues: 50,
			reviews: 20,
			repos: 0,
			stars: 200,
			followers: 40,
		});
		expect(res.level).toBe("A");
		expect(res.percentile).toBeCloseTo(20.841471354166664, 12);
	});

	it("expert user gets A+ rank", () => {
		const res = calculateRank({
			all_commits: false,
			commits: 1000,
			prs: 200,
			issues: 100,
			reviews: 40,
			repos: 0,
			stars: 800,
			followers: 160,
		});
		expect(res.level).toBe("A+");
		expect(res.percentile).toBeCloseTo(5.575988339442828, 12);
	});

	it("sindresorhus gets S rank", () => {
		const res = calculateRank({
			all_commits: false,
			commits: 1300,
			prs: 1500,
			issues: 4500,
			reviews: 1000,
			repos: 0,
			stars: 600000,
			followers: 50000,
		});
		expect(res.level).toBe("S");
		expect(res.percentile).toBeCloseTo(0.4578556547153667, 12);
	});
});
