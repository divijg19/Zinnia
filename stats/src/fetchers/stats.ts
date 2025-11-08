import axios from "axios";
import * as dotenv from "dotenv";
import githubUsernameRegex from "github-username-regex";
import { calculateRank } from "../calculateRank.ts";
import { excludeRepositories } from "../common/envs.ts";
import { CustomError, MissingParamError } from "../common/error.ts";
import { retryer } from "../common/retryer.ts";
import { logger, request, wrapTextMultiline } from "../common/utils.ts";
import type { StatsData } from "./types";

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
	const query = (variables as any).after
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
	let stats: any;
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
		const res = await retryer(fetcher, variables as any);
		if ((res as any).data?.errors) {
			return res;
		}

		const repoNodes = (res as any).data.data.user.repositories.nodes;
		if (stats) {
			stats.data.data.user.repositories.nodes.push(...repoNodes);
		} else {
			stats = res;
		}

		const repoNodesWithStars = repoNodes.filter(
			(node: any) => node.stargazers.totalCount !== 0,
		);
		hasNextPage =
			process.env.FETCH_MULTI_PAGE_STARS === "true" &&
			repoNodes.length === repoNodesWithStars.length &&
			(res as any).data.data.user.repositories.pageInfo.hasNextPage;
		endCursor = (res as any).data.data.user.repositories.pageInfo.endCursor;
	}

	return stats;
};

const totalCommitsFetcher = async (username: string): Promise<number> => {
	if (!githubUsernameRegex.test(username)) {
		logger.log("Invalid username provided.");
		throw new Error("Invalid username provided.");
	}

	const fetchTotalCommits = (variables: any, token?: string) => {
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

	let res: any;
	try {
		res = await retryer(fetchTotalCommits, { login: username });
	} catch (err) {
		logger.log(err);
		throw new Error(String(err));
	}

	const totalCount = (res as any).data.total_count;
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

	if ((res as any).data?.errors) {
		logger.error((res as any).data.errors);
		if ((res as any).data.errors[0].type === "NOT_FOUND") {
			throw new CustomError(
				(res as any).data.errors[0].message || "Could not fetch user.",
				CustomError.USER_NOT_FOUND,
			);
		}
		if ((res as any).data.errors[0].message) {
			const errorMessage = (res as any).data.errors[0].message as
				| string
				| undefined;
			throw new CustomError(
				wrapTextMultiline(errorMessage || "Unknown error", 90, 1)[0] ||
					"Unknown error",
				(res as any).statusText,
			);
		}
		throw new CustomError(
			"Something went wrong while trying to retrieve the stats data using the GraphQL API.",
			CustomError.GRAPHQL_ERROR,
		);
	}

	const user = (res as any).data.data.user;

	stats.name = user.name || user.login;

	if (include_all_commits) {
		stats.totalCommits = await totalCommitsFetcher(username);
	} else {
		stats.totalCommits = user.commits.totalCommitContributions;
	}

	stats.totalPRs = user.pullRequests.totalCount;
	if (include_merged_pull_requests) {
		stats.totalPRsMerged = user.mergedPullRequests.totalCount;
		stats.mergedPRsPercentage =
			(user.mergedPullRequests.totalCount / user.pullRequests.totalCount) *
				100 || 0;
	}
	stats.totalReviews = user.reviews.totalPullRequestReviewContributions;
	stats.totalIssues = user.openIssues.totalCount + user.closedIssues.totalCount;
	if (include_discussions) {
		stats.totalDiscussionsStarted = user.repositoryDiscussions.totalCount;
	}
	if (include_discussions_answers) {
		stats.totalDiscussionsAnswered =
			user.repositoryDiscussionComments.totalCount;
	}
	stats.contributedTo = user.repositoriesContributedTo.totalCount;

	const allExcludedRepos = [...exclude_repo, ...excludeRepositories];
	const repoToHide = new Set(allExcludedRepos);

	stats.totalStars = user.repositories.nodes
		.filter((data: any) => !repoToHide.has(data.name))
		.reduce((prev: number, curr: any) => prev + curr.stargazers.totalCount, 0);

	stats.rank = calculateRank({
		all_commits: include_all_commits,
		commits: stats.totalCommits,
		prs: stats.totalPRs,
		reviews: stats.totalReviews,
		issues: stats.totalIssues,
		repos: user.repositories.totalCount,
		stars: stats.totalStars,
		followers: user.followers.totalCount,
	});

	return stats;
};

export { fetchStats };
