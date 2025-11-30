import axios from "axios";

type SimpleAxiosResponse<T> = { data: T } & Record<string, unknown>;

import * as dotenv from "dotenv";
import githubUsernameRegex from "github-username-regex";
import { calculateRank } from "../calculateRank.js";
import { excludeRepositories } from "../common/envs.js";
import { CustomError, MissingParamError } from "../common/error.js";
import { retryer } from "../common/retryer.js";
import { logger, request, wrapTextMultiline } from "../common/utils.js";
import type { StatsData } from "./types.js";

// GraphQL response shapes used by the fetchers. We intentionally keep these
// minimal and focused on the fields we consume to avoid over-typing the
// GitHub schema while gaining type-safety for common access patterns.
type RepoNode = {
	name: string;
	stargazers: { totalCount: number };
};

type PageInfo = {
	hasNextPage: boolean;
	endCursor: string | null;
};

type Repositories = {
	totalCount: number;
	nodes: RepoNode[];
	pageInfo: PageInfo;
};

type UserWithRepos = {
	name?: string | null;
	login: string;
	commits?: { totalCommitContributions: number };
	reviews?: { totalPullRequestReviewContributions: number };
	repositoriesContributedTo?: { totalCount: number };
	pullRequests?: { totalCount: number };
	mergedPullRequests?: { totalCount: number };
	openIssues?: { totalCount: number };
	closedIssues?: { totalCount: number };
	followers?: { totalCount: number };
	repositoryDiscussions?: { totalCount: number };
	repositoryDiscussionComments?: { totalCount: number };
	repositories: Repositories;
};

type GraphQLAxiosResponse = {
	data?: {
		data?: { user?: UserWithRepos };
		errors?: Array<{ type?: string; message?: string }>;
	};
	statusText?: string;
};

dotenv.config();

const GRAPHQL_REPOS_FIELD = `
  repositories(first: 100, ownerAffiliations: OWNER, orderBy: {direction: DESC, field: STARGAZERS}, after: $after) {
    totalCount
    nodes {
      name
      stargazers {
        totalCount
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
`;

const GRAPHQL_REPOS_QUERY = `
  query userInfo($login: String!, $after: String) {
    user(login: $login) {
      ${GRAPHQL_REPOS_FIELD}
    }
  }
`;

const GRAPHQL_STATS_QUERY = `
  query userInfo($login: String!, $after: String, $includeMergedPullRequests: Boolean!, $includeDiscussions: Boolean!, $includeDiscussionsAnswers: Boolean!, $startTime: DateTime = null) {
    user(login: $login) {
      name
      login
      commits: contributionsCollection (from: $startTime) {
        totalCommitContributions,
      }
      reviews: contributionsCollection {
        totalPullRequestReviewContributions
      }
      repositoriesContributedTo(first: 1, contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]) {
        totalCount
      }
      pullRequests(first: 1) {
        totalCount
      }
      mergedPullRequests: pullRequests(states: MERGED) @include(if: $includeMergedPullRequests) {
        totalCount
      }
      openIssues: issues(states: OPEN) {
        totalCount
      }
      closedIssues: issues(states: CLOSED) {
        totalCount
      }
      followers {
        totalCount
      }
      repositoryDiscussions @include(if: $includeDiscussions) {
        totalCount
      }
      repositoryDiscussionComments(onlyAnswers: true) @include(if: $includeDiscussionsAnswers) {
        totalCount
      }
      ${GRAPHQL_REPOS_FIELD}
    }
  }
`;

const fetcher = (variables: Record<string, unknown>, token?: string) => {
	const query = (variables as Record<string, unknown>).after
		? GRAPHQL_REPOS_QUERY
		: GRAPHQL_STATS_QUERY;
	const headers: Record<string, string> = token
		? { Authorization: `bearer ${token}` }
		: {};
	return request({ query, variables }, headers);
};

const statsFetcher = async ({
	username,
	includeMergedPullRequests,
	includeDiscussions,
	includeDiscussionsAnswers,
	startTime,
}: {
	username: string;
	includeMergedPullRequests: boolean;
	includeDiscussions: boolean;
	includeDiscussionsAnswers: boolean;
	startTime?: string;
}) => {
	let aggregated: GraphQLAxiosResponse | null = null;
	let hasNextPage = true;
	let endCursor: string | null = null;

	while (hasNextPage) {
		const variables = {
			login: username,
			first: 100,
			after: endCursor,
			includeMergedPullRequests,
			includeDiscussions,
			includeDiscussionsAnswers,
			startTime,
		} as Record<string, unknown>;

		const res = (await retryer(
			fetcher,
			variables as Record<string, unknown>,
		)) as GraphQLAxiosResponse;

		if (res.data?.errors) {
			return res;
		}

		const user = res.data?.data?.user;
		if (!user || !user.repositories) {
			// Nothing to aggregate; return what we have (likely an empty or error response)
			return res;
		}

		const repoNodes = user.repositories.nodes ?? [];

		if (aggregated) {
			// Append nodes to previously-aggregated response
			const prevNodes = aggregated.data?.data?.user?.repositories?.nodes ?? [];
			// mutate aggregated in-place to preserve original shape expected by callers
			if (aggregated.data?.data?.user?.repositories) {
				aggregated.data.data.user.repositories.nodes =
					prevNodes.concat(repoNodes);
				// update pageInfo based on latest response
				aggregated.data.data.user.repositories.pageInfo =
					user.repositories.pageInfo;
			}
		} else {
			aggregated = res;
		}

		const repoNodesWithStars = repoNodes.filter(
			(node) => node.stargazers.totalCount !== 0,
		);

		hasNextPage =
			process.env.FETCH_MULTI_PAGE_STARS === "true" &&
			repoNodes.length === repoNodesWithStars.length &&
			Boolean(user.repositories.pageInfo?.hasNextPage);

		endCursor = user.repositories.pageInfo?.endCursor ?? null;
	}

	return aggregated;
};

const totalCommitsFetcher = async (username: string): Promise<number> => {
	if (!githubUsernameRegex.test(username)) {
		logger.log("Invalid username provided.");
		throw new Error("Invalid username provided.");
	}

	const fetchTotalCommits = (
		variables: Record<string, unknown>,
		token?: string,
	) => {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
			Accept: "application/vnd.github.cloak-preview",
		};
		if (token) headers.Authorization = `token ${token}`;
		return axios({
			method: "get",
			url: `https://api.github.com/search/commits?q=author:${variables.login}`,
			headers,
		});
	};

	let res: SimpleAxiosResponse<{ total_count: number }>;
	try {
		res = (await retryer(fetchTotalCommits, {
			login: username,
		} as unknown as Record<
			string,
			unknown
		>)) as unknown as SimpleAxiosResponse<{ total_count: number }>;
	} catch (err) {
		logger.log(err);
		throw new Error(String(err));
	}

	const totalCount = res?.data?.total_count;
	if (!totalCount || Number.isNaN(totalCount)) {
		throw new CustomError(
			"Could not fetch total commits.",
			CustomError.GITHUB_REST_API_ERROR,
		);
	}
	return totalCount;
};

const fetchStats = async (
	username: string,
	include_all_commits = false,
	exclude_repo: string[] = [],
	include_merged_pull_requests = false,
	include_discussions = false,
	include_discussions_answers = false,
	commits_year?: number,
): Promise<StatsData> => {
	if (!username) {
		throw new MissingParamError(["username"]);
	}

	const stats: StatsData = {
		name: "",
		totalPRs: 0,
		totalPRsMerged: 0,
		mergedPRsPercentage: 0,
		totalReviews: 0,
		totalCommits: 0,
		totalIssues: 0,
		totalStars: 0,
		totalDiscussionsStarted: 0,
		totalDiscussionsAnswered: 0,
		contributedTo: 0,
		rank: { level: "C", percentile: 100 },
	} as StatsData;

	const res = await statsFetcher({
		username,
		includeMergedPullRequests: include_merged_pull_requests,
		includeDiscussions: include_discussions,
		includeDiscussionsAnswers: include_discussions_answers,
		startTime: commits_year ? `${commits_year}-01-01T00:00:00Z` : undefined,
	});

	if (res?.data?.errors) {
		logger.error(res.data.errors);
		const firstErr = res.data.errors[0];
		if (firstErr?.type === "NOT_FOUND") {
			throw new CustomError(
				firstErr.message || "Could not fetch user.",
				CustomError.USER_NOT_FOUND,
			);
		}
		if (firstErr?.message) {
			const errorMessage = firstErr.message as string | undefined;
			throw new CustomError(
				wrapTextMultiline(errorMessage || "Unknown error", 90, 1)[0] ||
					"Unknown error",
				String(res.statusText ?? ""),
			);
		}
		throw new CustomError(
			"Something went wrong while trying to retrieve the stats data using the GraphQL API.",
			CustomError.GRAPHQL_ERROR,
		);
	}

	const user = res?.data?.data?.user as UserWithRepos | undefined;

	if (!user) {
		throw new CustomError(
			"Could not fetch user data.",
			CustomError.USER_NOT_FOUND,
		);
	}

	// Use safe accessors with sensible defaults for missing fields.
	stats.name = user.name ?? user.login ?? "";

	if (include_all_commits) {
		stats.totalCommits = await totalCommitsFetcher(username);
	} else {
		stats.totalCommits = user.commits?.totalCommitContributions ?? 0;
	}

	stats.totalPRs = user.pullRequests?.totalCount ?? 0;
	if (include_merged_pull_requests) {
		stats.totalPRsMerged = user.mergedPullRequests?.totalCount ?? 0;
		stats.mergedPRsPercentage =
			((user.mergedPullRequests?.totalCount ?? 0) /
				(user.pullRequests?.totalCount ?? 1)) *
				100 || 0;
	}
	stats.totalReviews = user.reviews?.totalPullRequestReviewContributions ?? 0;
	stats.totalIssues =
		(user.openIssues?.totalCount ?? 0) + (user.closedIssues?.totalCount ?? 0);
	if (include_discussions) {
		stats.totalDiscussionsStarted = user.repositoryDiscussions?.totalCount ?? 0;
	}
	if (include_discussions_answers) {
		stats.totalDiscussionsAnswered =
			user.repositoryDiscussionComments?.totalCount ?? 0;
	}
	stats.contributedTo = user.repositoriesContributedTo?.totalCount ?? 0;

	const allExcludedRepos = [...exclude_repo, ...excludeRepositories];
	const repoToHide = new Set(allExcludedRepos);

	stats.totalStars = (user.repositories?.nodes ?? [])
		.filter((data: RepoNode) => !repoToHide.has(data.name))
		.reduce(
			(prev: number, curr: RepoNode) =>
				prev + (curr.stargazers?.totalCount ?? 0),
			0,
		);

	stats.rank = calculateRank({
		all_commits: include_all_commits,
		commits: stats.totalCommits,
		prs: stats.totalPRs,
		reviews: stats.totalReviews,
		issues: stats.totalIssues,
		repos: user.repositories?.totalCount ?? 0,
		stars: stats.totalStars,
		followers: user.followers?.totalCount ?? 0,
	});

	return stats;
};

export { fetchStats };
