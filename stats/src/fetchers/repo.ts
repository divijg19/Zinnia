import { MissingParamError } from "../common/error.js";
import { retryer } from "../common/retryer.js";
import { request } from "../common/utils.js";
import type { RepositoryData } from "./types";

type Variables = { login: string; repo: string };

const fetcher = (variables: Variables, token?: string) => {
	return request(
		{
			query: `
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
    `,
			variables,
		},
		token ? { Authorization: `token ${token}` } : undefined,
	);
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

	const res = await retryer(fetcher, { login: username, repo: reponame });

	const data = res.data.data;

	if (!data.user && !data.organization) {
		throw new Error("Not found");
	}

	const isUser = data.organization === null && data.user;
	const isOrg = data.user === null && data.organization;

	if (isUser) {
		if (!data.user.repository || data.user.repository.isPrivate) {
			throw new Error("User Repository Not found");
		}
		return {
			...data.user.repository,
			starCount: data.user.repository.stargazers.totalCount,
		} as RepositoryData;
	}

	if (isOrg) {
		if (
			!data.organization.repository ||
			data.organization.repository.isPrivate
		) {
			throw new Error("Organization Repository Not found");
		}
		return {
			...data.organization.repository,
			starCount: data.organization.repository.stargazers.totalCount,
		} as RepositoryData;
	}

	throw new Error("Unexpected behavior");
};

export default fetchRepo;
