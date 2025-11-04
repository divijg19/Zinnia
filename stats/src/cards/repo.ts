import type { RepositoryData } from "../fetchers/types";
import { renderRepoCard as renderRepoCardJs } from "./repo.js";
import type { RepoCardOptions } from "./types";

type RenderRepoFn = (
	repo: RepositoryData,
	options?: Partial<RepoCardOptions>,
) => string;

export function renderRepoCard(
	repo: RepositoryData,
	options?: Partial<RepoCardOptions>,
): string {
	const fn = renderRepoCardJs as unknown as RenderRepoFn;
	return fn(repo, options);
}

export default renderRepoCard;
