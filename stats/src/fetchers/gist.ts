import { MissingParamError } from "../common/error.ts";
import { retryer } from "../common/retryer.js";
import { request } from "../common/utils.ts";

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

const fetcher = async (variables: unknown, token: string) => {
	return await request(
		{ query: QUERY, variables },
		{ Authorization: `token ${token}` },
	);
};

type GistFile = { name: string; language?: { name: string }; size: number };

const calculatePrimaryLanguage = (files: GistFile[]) => {
	const languages: Record<string, number> = {};
	for (const file of files) {
		if (file.language) {
			const name = file.language.name;
			languages[name] = (languages[name] || 0) + file.size;
		}
	}
	const keys = Object.keys(languages);
	let primaryLanguage = keys[0] ?? "";
	for (const language of keys) {
		if (languages[language] > (languages[primaryLanguage] || 0)) {
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
	const res = (await retryer(fetcher, { gistName: id })) as Record<
		string,
		unknown
	>;
	const dataRoot =
		(res.data as Record<string, unknown> | undefined) ?? undefined;
	if (dataRoot && (dataRoot as any).errors) {
		const dr: any = dataRoot;
		throw new Error(dr.errors[0].message as string);
	}
	const viewerGist = (dataRoot as any)?.data?.viewer?.gist;
	if (!viewerGist) {
		throw new Error("Gist not found");
	}
	const data = viewerGist;
	return {
		name: data.files[Object.keys(data.files)[0]].name,
		nameWithOwner: `${data.owner.login}/${data.files[Object.keys(data.files)[0]].name}`,
		description: data.description,
		language: calculatePrimaryLanguage(data.files),
		starsCount: data.stargazerCount,
		forksCount: data.forks.totalCount,
	};
};

export default fetchGist;
