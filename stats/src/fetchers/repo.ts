import { MissingParamError } from "../common/error.js";
import { retryer } from "../common/retryer.js";
import { request } from "../common/utils.js";
import type { RepositoryData } from "./types.js";

type Variables = { login: string; repo: string };

type RepoShape = {
	name: string;
	nameWithOwner?: string;
	isPrivate?: boolean;
	isArchived?: boolean;
	isTemplate?: boolean;
	stargazers?: { totalCount?: number } | null;
	description?: string | null;
	primaryLanguage?: { color?: string; id?: string; name?: string } | null;
	forkCount?: number | null;
};

type GraphQLAxiosResponse = {
	data: {
		data?: {
			user?: { repository?: RepoShape | null };
			organization?: { repository?: RepoShape | null };
		};
		errors?: Array<{ type?: string; message?: string }>;
	};
	statusText: string;
	response?: { data?: { message?: string } };
};

const fetcher = (variables: Variables, token?: string) => {
	const query = `
			fragment RepoInfo on Repository {
				name
				nameWithOwner
				isPrivate
				isArchived
				isTemplate
				stargazers {
					totalCount
				}
				description
				primaryLanguage {
					color
					id
					name
				}
				forkCount
			}
			query getRepo($login: String!, $repo: String!) {
				user(login: $login) {
					repository(name: $repo) {
						...RepoInfo
					}
				}
				organization(login: $login) {
					repository(name: $repo) {
						...RepoInfo
					}
				}
			}
		`;
	return request(
		{ query, variables },
		token ? { Authorization: `token ${token}` } : {},
	) as Promise<GraphQLAxiosResponse>;
};

const urlExample = "/api/pin?username=USERNAME&amp;repo=REPO_NAME";

export const fetchRepo = async (
	username: string,
	reponame: string,
): Promise<RepositoryData> => {
	if (!username && !reponame) {
		throw new MissingParamError(["username", "repo"], urlExample);
	}
	if (!username) {
		throw new MissingParamError(["username"], urlExample);
	}
	if (!reponame) {
		throw new MissingParamError(["repo"], urlExample);
	}

	const res = (await retryer(fetcher, {
		login: username,
		repo: reponame,
	} as Variables)) as GraphQLAxiosResponse;

	if (res.data?.errors && res.data.errors.length > 0) {
		throw new Error(res.data.errors[0]?.message || "Unknown error");
	}

	const dataObj = res.data.data ?? {};

	if (!dataObj.user && !dataObj.organization) {
		throw new Error("Not found");
	}

	const isUser = dataObj.organization === null && Boolean(dataObj.user);
	const isOrg = dataObj.user === null && Boolean(dataObj.organization);

	if (isUser) {
		const repoObj = dataObj.user?.repository;
		if (!repoObj || repoObj.isPrivate) {
			throw new Error("User Repository Not found");
		}
		return {
			...(repoObj as unknown as RepositoryData),
			starCount: repoObj.stargazers?.totalCount ?? 0,
		} as RepositoryData;
	}

	if (isOrg) {
		const repoObj = dataObj.organization?.repository;
		if (!repoObj || repoObj.isPrivate) {
			throw new Error("Organization Repository Not found");
		}
		return {
			...(repoObj as unknown as RepositoryData),
			starCount: repoObj.stargazers?.totalCount ?? 0,
		} as RepositoryData;
	}

	throw new Error("Unexpected behavior");
};
