import { MissingParamError } from "../common/error.js";
import { retryer } from "../common/retryer.js";
import { request } from "../common/utils.js";

const QUERY = `
query gistInfo($gistName: String!) {
    viewer {
        gist(name: $gistName) {
            description
            owner {
                login
            }
            stargazerCount
            forks {
                totalCount
            }
            files {
                name
                language {
                    name
                }
                size
            }
        }
    }
}
`;

type GistShape = {
	description?: string | null;
	owner?: { login?: string } | null;
	stargazerCount?: number | null;
	forks?: { totalCount?: number } | null;
	files: Record<string, GistFile>;
};

type GraphQLAxiosResponse = {
	data: {
		data?: { viewer?: { gist?: GistShape } };
		errors?: Array<{ type?: string; message?: string }>;
	};
	statusText: string;
	response?: { data?: { message?: string } };
};

const fetcher = (variables: Record<string, unknown>, token?: string) => {
	const headers: Record<string, string> = token
		? { Authorization: `token ${token}` }
		: {};
	return request(
		{ query: QUERY, variables },
		headers,
	) as Promise<GraphQLAxiosResponse>;
};

type GistFile = {
	name: string;
	language?: { name?: string | null } | null;
	size: number;
};

const calculatePrimaryLanguage = (
	files: Record<string, GistFile> | undefined,
): string | null => {
	if (!files) return null;
	const languages: Record<string, number> = {};
	for (const file of Object.values(files)) {
		if (file.language?.name) {
			const name = file.language.name;
			languages[name] = (languages[name] || 0) + (file.size || 0);
		}
	}
	const keys = Object.keys(languages);
	if (keys.length === 0) return null;
	let primaryLanguage = keys[0] as string;
	for (const language of keys) {
		const langSize = languages[language] ?? 0;
		const primaryLangSize = languages[primaryLanguage] ?? 0;
		if (langSize > primaryLangSize) {
			primaryLanguage = language;
		}
	}
	return primaryLanguage;
};

export type GistData = {
	name: string;
	nameWithOwner: string;
	description: string | null;
	language: string | null;
	starsCount: number;
	forksCount: number;
};

export const fetchGist = async (id: string): Promise<GistData> => {
	if (!id) {
		throw new MissingParamError(["id"], "/api/gist?id=GIST_ID");
	}

	const res = (await retryer(fetcher, { gistName: id } as Record<
		string,
		unknown
	>)) as GraphQLAxiosResponse;

	if (res.data?.errors && res.data.errors.length > 0) {
		throw new Error(res.data.errors[0]?.message || "Unknown error");
	}

	const gist = res.data?.data?.viewer?.gist;
	if (!gist) {
		throw new Error("Gist not found");
	}

	const fileKeys = Object.keys(gist.files || {});
	const firstFileKey = fileKeys[0];
	if (!firstFileKey) {
		throw new Error("Gist has no files");
	}
	const firstFile = gist.files[firstFileKey] as GistFile;

	return {
		name: firstFile.name,
		nameWithOwner: `${gist.owner?.login ?? ""}/${firstFile.name}`,
		description: gist.description ?? null,
		language: calculatePrimaryLanguage(gist.files),
		starsCount: gist.stargazerCount ?? 0,
		forksCount: gist.forks?.totalCount ?? 0,
	};
};
