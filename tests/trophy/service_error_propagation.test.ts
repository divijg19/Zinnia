import { describe, expect, it, vi } from "vitest";

const requestMocks = vi.hoisted(() => ({
	requestGithubData: vi.fn(),
}));

vi.mock("../../trophy/src/Services/request", () => ({
	requestGithubData: requestMocks.requestGithubData,
}));

const { EServiceKindError, ServiceError } = await import(
	"../../trophy/src/Types/index.ts"
);
const { GithubApiService } = await import(
	"../../trophy/src/Services/GithubApiService"
);
const { UserInfo } = await import("../../trophy/src/user_info.ts");

const VALID_ACTIVITY = {
	createdAt: "2020-01-01T00:00:00Z",
	contributionsCollection: {
		totalCommitContributions: 10,
		restrictedContributionsCount: 0,
		totalPullRequestReviewContributions: 2,
	},
	organizations: { totalCount: 1 },
	followers: { totalCount: 4 },
};
const VALID_ISSUE = {
	openIssues: { totalCount: 1 },
	closedIssues: { totalCount: 2 },
};
const VALID_PR = { pullRequests: { totalCount: 3 } };
const VALID_REPO = {
	repositories: {
		totalCount: 1,
		nodes: [
			{
				languages: { nodes: [{ name: "TypeScript" }] },
				stargazers: { totalCount: 7 },
			},
		],
	},
};

function mockQueries(overrides?: { activity?: () => unknown }): void {
	requestMocks.requestGithubData.mockImplementation(async (query: string) => {
		if (/contributionsCollection/.test(query)) {
			if (overrides?.activity) return overrides.activity();
			return VALID_ACTIVITY;
		}
		if (/openIssues/.test(query)) return VALID_ISSUE;
		if (/pullRequests/.test(query)) return VALID_PR;
		if (/repositories/.test(query)) return VALID_REPO;
		throw new Error(`unmapped query in test mock`);
	});
}

describe("GithubApiService.requestUserInfo ServiceError propagation", () => {
	it("returns the ServiceError (kind preserved) instead of throwing TypeError", async () => {
		mockQueries({
			activity: () => {
				// Mirrors production shape: requestGithubData throws a
				// ServiceError, executeQuery catches it and resolves with it.
				throw new ServiceError(
					"API rate limit exceeded",
					EServiceKindError.RATE_LIMIT,
				);
			},
		});

		const service = new GithubApiService("");
		const result = await service.requestUserInfo("someuser");

		expect(result).toBeInstanceOf(ServiceError);
		expect((result as InstanceType<typeof ServiceError>).cause).toBe(
			EServiceKindError.RATE_LIMIT,
		);
	});

	it("constructs UserInfo when every query succeeds (control)", async () => {
		mockQueries();

		const service = new GithubApiService("");
		const result = await service.requestUserInfo("someuser");

		expect(result).toBeInstanceOf(UserInfo);
	});
});
