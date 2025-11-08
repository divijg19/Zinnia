import { excludeRepositories } from "../common/envs.ts";
import { CustomError, MissingParamError } from "../common/error.ts";
import { retryer } from "../common/retryer.ts";
import { logger, request, wrapTextMultiline } from "../common/utils.ts";
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
		const firstError = res.data.errors[0];
		if (firstError?.type === "NOT_FOUND") {
			throw new CustomError(
				firstError.message || "Could not fetch user.",
				CustomError.USER_NOT_FOUND,
			);
		}
		if (firstError?.message) {
			const errorMessage = firstError.message;
			throw new CustomError(
				wrapTextMultiline(errorMessage || "Unknown error", 90, 1)[0] ||
					"Unknown error",
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
		const existingLang = acc[prev.node.name];

		if (existingLang && prev.node.name === existingLang.name) {
			langSize = prev.size + existingLang.size;
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
		const lang = acc[name];
		if (lang) {
			lang.size = lang.size ** size_weight * lang.count ** count_weight;
		}
	});

	const topLangsObj: LangAccumulator = Object.keys(acc)
		.sort((a, b) => {
			const langA = acc[a];
			const langB = acc[b];
			if (!langA || !langB) return 0;
			return langB.size - langA.size;
		})
		.reduce((result: LangAccumulator, key) => {
			const lang = acc[key];
			if (lang) {
				result[key] = lang;
			}
			return result;
		}, {} as LangAccumulator);

	return topLangsObj as TopLangData;
};
