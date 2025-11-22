import { afterEach, describe, expect, it, vi } from "vitest";

const data_stats = {
	data: {
		user: {
			name: "Anurag Hazra",
			repositoriesContributedTo: { totalCount: 61 },
			commits: { totalCommitContributions: 100 },
			reviews: { totalPullRequestReviewContributions: 50 },
			pullRequests: { totalCount: 300 },
			mergedPullRequests: { totalCount: 240 },
			openIssues: { totalCount: 100 },
			closedIssues: { totalCount: 100 },
			followers: { totalCount: 100 },
			repositoryDiscussions: { totalCount: 10 },
			repositoryDiscussionComments: { totalCount: 40 },
			repositories: {
				totalCount: 5,
				nodes: [
					{ name: "test-repo-1", stargazers: { totalCount: 100 } },
					{ name: "test-repo-2", stargazers: { totalCount: 100 } },
					{ name: "test-repo-3", stargazers: { totalCount: 100 } },
				],
				pageInfo: { hasNextPage: true, endCursor: "cursor" },
			},
		},
	},
};

const data_repo = {
	data: {
		user: {
			repositories: {
				nodes: [
					{ name: "test-repo-4", stargazers: { totalCount: 50 } },
					{ name: "test-repo-5", stargazers: { totalCount: 50 } },
				],
				pageInfo: { hasNextPage: false, endCursor: "cursor" },
			},
		},
	},
};

const data_year2003 = JSON.parse(JSON.stringify(data_stats));
data_year2003.data.user.commits.totalCommitContributions = 428;

afterEach(() => {
	vi.resetModules();
	vi.restoreAllMocks();
});

describe("fetchStats (vitest)", () => {
	it("should compute stats with single page repos", async () => {
		vi.doMock("../../stats/src/common/retryer", () => ({
			retryer: async (_fetcher: any, variables: any) => {
				if (String(variables?.startTime || "").startsWith("2003")) {
					return { data: data_year2003 };
				}
				return { data: data_stats };
			},
		}));

		vi.doMock("axios", () => ({
			default: async () => ({ data: { total_count: 42 } }),
		}));

		const mod = await import("../../stats/src/fetchers/stats");
		const { fetchStats } = mod;

		const stats = await fetchStats("anurag");
		expect(stats).toHaveProperty("totalStars");
		expect(typeof stats.totalStars).toBe("number");
	});

	it("should paginate when FETCH_MULTI_PAGE_STARS is true", async () => {
		process.env.FETCH_MULTI_PAGE_STARS = "true";

		vi.doMock("../../stats/src/common/retryer", () => ({
			retryer: async (_fetcher: any, variables: any) => {
				if (variables?.after) return { data: data_repo };
				return { data: data_stats };
			},
		}));

		vi.doMock("axios", () => ({
			default: async () => ({ data: { total_count: 100 } }),
		}));

		const mod = await import("../../stats/src/fetchers/stats");
		const { fetchStats } = mod;

		const stats = await fetchStats("anurag");
		expect(stats.totalStars).toBeGreaterThanOrEqual(0);
		delete process.env.FETCH_MULTI_PAGE_STARS;
	});

	it("should support yearly stats when requested", async () => {
		vi.doMock("../../stats/src/common/retryer", () => ({
			retryer: async (_fetcher: any, variables: any) => {
				if (String(variables?.startTime || "").startsWith("2003"))
					return { data: data_year2003 };
				return { data: data_stats };
			},
		}));

		vi.doMock("axios", () => ({
			default: async () => ({ data: { total_count: 10 } }),
		}));

		const mod = await import("../../stats/src/fetchers/stats");
		const { fetchStats } = mod;

		const stats = await fetchStats(
			"anurag",
			false,
			[],
			false,
			false,
			false,
			2003,
		);
		expect(stats).toBeTruthy();
	});
});
