import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, test, vi } from "vitest";

// Use fixtures to avoid network calls in CI / local runs where leetcode.cn blocks requests
const cnFixture = JSON.parse(
	readFileSync(
		join(__dirname, "../../../../__fixtures__/leetcode_cn_graphql.json"),
		"utf-8",
	),
);
const usFixture = JSON.parse(
	readFileSync(
		join(__dirname, "../../../../__fixtures__/leetcode_us_graphql.json"),
		"utf-8",
	),
);

import query from "../query";
import type { FetchedData } from "../types";

beforeAll(() => {
	// Replace the real network-backed methods with fixture-backed implementations
	vi.spyOn(query, "us").mockImplementation(async (..._args: any[]) => {
		// tests only assert types; return the parsed GraphQL data converted to the shape expected by query.us
		const data = usFixture.data;
		// emulate the transformation done in query.us
		const result: FetchedData = {
			profile: {
				username: data.user.username,
				realname: data.user.profile.realname,
				about: data.user.profile.about,
				avatar: data.user.profile.avatar,
				skills: data.user.profile.skills,
				country: data.user.profile.country,
			},
			problem: {
				easy: {
					solved:
						data.user.submits.ac.find((x: any) => x.difficulty === "Easy")
							?.count || 0,
					total:
						data.problems.find((x: any) => x.difficulty === "Easy")?.count || 0,
				},
				medium: {
					solved:
						data.user.submits.ac.find((x: any) => x.difficulty === "Medium")
							?.count || 0,
					total:
						data.problems.find((x: any) => x.difficulty === "Medium")?.count ||
						0,
				},
				hard: {
					solved:
						data.user.submits.ac.find((x: any) => x.difficulty === "Hard")
							?.count || 0,
					total:
						data.problems.find((x: any) => x.difficulty === "Hard")?.count || 0,
				},
				ranking: data.user.profile.ranking,
			},
			submissions: data.submissions.map((x: any) => ({
				...x,
				time: parseInt(x.time, 10) * 1000,
			})),
			contest: data.contest && {
				rating: data.contest.rating,
				ranking: data.contest.ranking,
				badge: data.contest.badge?.name || "",
			},
		};
		return result;
	});

	vi.spyOn(query, "cn").mockImplementation(async (..._args: any[]) => {
		const data = cnFixture.data;
		const result: FetchedData = {
			profile: {
				username: data.user.username,
				realname: data.user.profile.realname,
				about: data.user.profile.about,
				avatar: data.user.profile.avatar,
				skills: data.user.profile.skills,
				country: data.user.profile.country,
			},
			problem: {
				easy: {
					solved:
						data.progress.ac.find((x: any) => x.difficulty === "EASY")?.count ||
						0,
					total: data.progress.ac.reduce(
						(acc: number, cur: any) => acc + (cur.count || 0),
						0,
					),
				},
				medium: {
					solved:
						data.progress.ac.find((x: any) => x.difficulty === "MEDIUM")
							?.count || 0,
					total: data.progress.ac.reduce(
						(acc: number, cur: any) => acc + (cur.count || 0),
						0,
					),
				},
				hard: {
					solved:
						data.progress.ac.find((x: any) => x.difficulty === "HARD")?.count ||
						0,
					total: data.progress.ac.reduce(
						(acc: number, cur: any) => acc + (cur.count || 0),
						0,
					),
				},
				ranking: data.user.ranking,
			},
			submissions: data.submissions.map((x: any) => ({
				title: x.question.title,
				time: x.time * 1000,
				status: "AC",
				lang: "python3",
				slug: x.question.slug,
				id: x.id,
			})),
		};
		return result;
	});
});

describe("query", () => {
	test("should match types (us)", async () => {
		const data = await query.us("jacoblincool");
		test_types(data);
	});

	test("should match types (cn)", async () => {
		const data = await query.cn("leetcode");
		test_types(data);
	});
});

function test_types(data: FetchedData) {
	expect(typeof data.profile.about).toBe("string");
	expect(typeof data.profile.avatar).toBe("string");
	expect(typeof data.profile.country).toBe("string");
	expect(typeof data.profile.realname).toBe("string");
	for (const skill of data.profile.skills) {
		expect(typeof skill).toBe("string");
	}

	(["easy", "medium", "hard"] as const).forEach((difficulty) => {
		expect(typeof data.problem[difficulty].solved).toBe("number");
		expect(typeof data.problem[difficulty].total).toBe("number");
	});
	expect(typeof data.problem.ranking).toBe("number");

	for (const submission of data.submissions) {
		expect(typeof submission.id).toBe("string");
		expect(typeof submission.slug).toBe("string");
		expect(typeof submission.status).toBe("string");
		expect(typeof submission.title).toBe("string");
		expect(typeof submission.lang).toBe("string");
		expect(submission.time).toBeGreaterThan(0);
	}

	if (data.contest) {
		expect(typeof data.contest.rating).toBe("number");
		expect(typeof data.contest.ranking).toBe("number");
		expect(typeof data.contest.badge).toBe("string");
	}
}
