import { excludeRepositories } from "../common/envs.js";
import { CustomError, MissingParamError } from "../common/error.js";
import { retryer } from "../common/retryer.js";
import { logger, request, wrapTextMultiline } from "../common/utils.js";
import type { TopLangData } from "./types.js";

type Variables = { login: string };

type Edge = { size: number; node: { name: string; color?: string | null } };
type RepoNodeShape = {
	name: string;
	languages: { edges: Edge[] };
	size?: number;
};
type LangAccumulator = Record<
	string,
	{ name: string; color: string; size: number; count: number }
>;

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

	let repoNodes =
		(res.data.data.user.repositories.nodes as RepoNodeShape[] | undefined) ??
		[];
	const repoToHide: Record<string, boolean> = {};
	const allExcludedRepos = [...exclude_repo, ...excludeRepositories];

	if (allExcludedRepos) {
		allExcludedRepos.forEach((repoName) => {
			repoToHide[repoName] = true;
		});
	}

	repoNodes = repoNodes
		// sort by a synthetic size if present; default 0 to be safe in strict mode
		.sort(
			(a: RepoNodeShape, b: RepoNodeShape) => (b?.size ?? 0) - (a?.size ?? 0),
		)
		.filter((repo: RepoNodeShape) => !repoToHide[repo.name]);

	let repoCount = 0;

	const flattened: Edge[] = repoNodes
		.filter((node) => (node.languages?.edges ?? []).length > 0)
		.reduce(
			(accum: Edge[], curr: RepoNodeShape) =>
				accum.concat(curr.languages.edges ?? []),
			[] as Edge[],
		);

	const acc: LangAccumulator = {};
	flattened.forEach((edge) => {
		let langSize = edge.size ?? 0;
		const existingLang = acc[edge.node.name];

		if (existingLang && edge.node.name === existingLang.name) {
			langSize = edge.size + existingLang.size;
			repoCount += 1;
		} else {
			repoCount = 1;
		}

		acc[edge.node.name] = {
			name: edge.node.name,
			color: edge.node.color ?? "",
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
