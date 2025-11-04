// @ts-nocheck
// @ts-check

import { excludeRepositories } from "../common/envs.js";
import { CustomError, MissingParamError } from "../common/error.js";
import { retryer } from "../common/retryer.js";
import { logger, request, wrapTextMultiline } from "../common/utils.js";

/**
 * @typedef {import("axios").AxiosRequestHeaders} AxiosRequestHeaders Axios request headers.
 * @typedef {import("axios").AxiosResponse} AxiosResponse Axios response.
 */

/**
 * Top languages fetcher object.
 *
 * @param {AxiosRequestHeaders} variables Fetcher variables.
 * @param {string} token GitHub token.
 * @returns {Promise<AxiosResponse>} Languages fetcher response.
 */
const fetcher = (variables, token) => {
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
		{
			Authorization: `token ${token}`,
		},
	);
};

/**
 * @typedef {import("./types").TopLangData} TopLangData Top languages data.
 */

/**
 * Fetch top languages for a given username.
 *
 * @param {string} username GitHub username.
 * @param {string[]} exclude_repo List of repositories to exclude.
 * @param {number} size_weight Weightage to be given to size.
 * @param {number} count_weight Weightage to be given to count.
 * @returns {Promise<TopLangData>} Top languages data.
 */
const fetchTopLanguages = async (
	username,
	exclude_repo = [],
	size_weight = 1,
	count_weight = 0,
) => {
	if (!username) {
		throw new MissingParamError(["username"]);
	}

	// cast fetcher to the expected FetcherFunction shape to satisfy callers
	const res = await retryer(/** @type {any} */ (fetcher), { login: username });

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
	/** @type {{[name: string]: boolean}} */
	const repoToHide = Object.create(null);
	/** @type {string[]} */
	const allExcludedRepos = [...exclude_repo, ...excludeRepositories];

	// populate repoToHide map for quick lookup
	if (allExcludedRepos) {
		allExcludedRepos.forEach((repoName) => {
			repoToHide[repoName] = true;
		});
	}

	// filter out repositories to be hidden
	/** @type {{size: number}[]} */
	repoNodes = /** @type {{name: string, size: number}[]} */ (repoNodes)
		.filter(
			/** @type {(node: {name: string}) => boolean} */ (
				(node) => !repoToHide[node.name]
			),
		)
		.sort(
			/** @type {(a: {size: number}, b: {size: number}) => number} */ (
				(a, b) => b.size - a.size
			),
		);

	repoNodes = /** @type {{languages: {edges: any[]}}[]} */ (repoNodes)
		.filter(
			/** @type {(node: {languages: {edges: any[]}}) => boolean} */ (
				(node) => node.languages.edges.length > 0
			),
		)
		// flatten the list of language nodes
		.reduce(
			/** @type {(acc: any[], curr: {languages: {edges: any[]}}) => any[]} */ (
				(acc, curr) => curr.languages.edges.concat(acc)
			),
			[],
		)
		/** @type {{[lang: string]: any}} */
		.reduce(
			/** @type {(acc: {[lang: string]: any}, prev: any) => {[lang: string]: any}} */ (
				(acc, prev) => {
					// get the size of the language (bytes)
					const langName = prev.node.name;
					const langColor = prev.node.color;
					const langSize = prev.size;

					if (acc[langName]) {
						acc[langName].size += langSize;
						acc[langName].count += 1;
					} else {
						acc[langName] = {
							name: langName,
							color: langColor,
							size: langSize,
							count: 1,
						};
					}
					return acc;
				}
			),
			{},
		);

	Object.keys(repoNodes).forEach((name) => {
		// comparison index calculation
		repoNodes[name].size =
			repoNodes[name].size ** size_weight *
			repoNodes[name].count ** count_weight;
	});

	const topLangs = Object.keys(repoNodes)
		.sort(
			/** @type {(a: string, b: string) => number} */ (
				(a, b) => repoNodes[b].size - repoNodes[a].size
			),
		)
		/** @type {{[lang: string]: any}} */
		.reduce(
			/** @type {(result: {[lang: string]: any}, key: string) => {[lang: string]: any}} */ (
				(result, key) => {
					result[key] = repoNodes[key];
					return result;
				}
			),
			{},
		);

	return topLangs;
};

export { fetchTopLanguages };
export default fetchTopLanguages;
