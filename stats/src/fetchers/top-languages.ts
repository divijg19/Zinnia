import { excludeRepositories } from "../common/envs.js";
import { CustomError, MissingParamError } from "../common/error.js";
import { retryer } from "../common/retryer.js";
import { logger, request, wrapTextMultiline } from "../common/utils.js";
import type { TopLangData } from "./types";

type Variables = { login: string };

const fetcher = (variables: Variables, token?: string) => {
	return request(
		{
			query: `
      query userInfo($login: String!) {
        user(login: $login) {
          # fetch only owner repos & not forks
          repositories(ownerAffiliations: OWNER, isFork: false, first: 100) {
            nodes {
              name
              languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
                edges {
                  size
                  node {
                    color
                    name
                  }
                }
              }
            }
          }
        }
      }
      `,
			variables,
		},
		token ? { Authorization: `token ${token}` } : {},
	);
};

export const fetchTopLanguages = async (
	username: string,
	exclude_repo: string[] = [],
	size_weight = 1,
	count_weight = 0,
): Promise<TopLangData> => {
	if (!username) {
		throw new MissingParamError(["username"]);
	}

	const res = await retryer(fetcher, { login: username });

	if (res.data.errors) {
		logger.error(res.data.errors);
		if (res.data.errors[0].type === "NOT_FOUND") {
			throw new CustomError(
				res.data.errors[0].message || "Could not fetch user.",
				CustomError.USER_NOT_FOUND,
			);
		}
		if (res.data.errors[0].message) {
			throw new CustomError(
				wrapTextMultiline(res.data.errors[0].message, 90, 1)[0],
				res.statusText,
			);
		}
		throw new CustomError(
			"Something went wrong while trying to retrieve the language data using the GraphQL API.",
			CustomError.GRAPHQL_ERROR,
		);
	}

	let repoNodes = res.data.data.user.repositories.nodes;
	const repoToHide: Record<string, boolean> = {};
	const allExcludedRepos = [...exclude_repo, ...excludeRepositories];

	if (allExcludedRepos) {
		allExcludedRepos.forEach((repoName) => {
			repoToHide[repoName] = true;
		});
	}

	repoNodes = repoNodes
		// sort by a synthetic size if present; default 0 to be safe in strict mode
		.sort((a: any, b: any) => (b?.size ?? 0) - (a?.size ?? 0))
		.filter((name: any) => !repoToHide[name.name]);

	let repoCount = 0;

	type Edge = { size: number; node: { name: string; color: string } };
	type LangAccumulator = Record<
		string,
		{ name: string; color: string; size: number; count: number }
	>;

	const flattened: Edge[] = repoNodes
		.filter((node: any) => node.languages.edges.length > 0)
		.reduce(
			(acc: Edge[], curr: any) => acc.concat(curr.languages.edges as Edge[]),
			[],
		);

	const acc: LangAccumulator = {};
	flattened.forEach((prev) => {
		let langSize = prev.size;

		if (acc[prev.node.name] && prev.node.name === acc[prev.node.name].name) {
			langSize = prev.size + acc[prev.node.name].size;
			repoCount += 1;
		} else {
			repoCount = 1;
		}

		acc[prev.node.name] = {
			name: prev.node.name,
			color: prev.node.color,
			size: langSize,
			count: repoCount,
		};
	});

	Object.keys(acc).forEach((name) => {
		acc[name].size =
			acc[name].size ** size_weight * acc[name].count ** count_weight;
	});

	const topLangsObj: LangAccumulator = Object.keys(acc)
		.sort((a, b) => acc[b].size - acc[a].size)
		.reduce((result: LangAccumulator, key) => {
			result[key] = acc[key];
			return result;
		}, {} as LangAccumulator);

	return topLangsObj as TopLangData;
};

export default fetchTopLanguages;
