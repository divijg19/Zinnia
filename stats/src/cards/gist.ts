import type { GistData } from "../fetchers/types";
import { renderGistCard as renderGistCardJs } from "./gist.js";
import type { GistCardOptions } from "./types";

type RenderGistCardFn = (
	gist: GistData,
	options?: Partial<GistCardOptions>,
) => string;

export function renderGistCard(
	gist: GistData,
	options?: Partial<GistCardOptions>,
): string {
	const fn = renderGistCardJs as unknown as RenderGistCardFn;
	return fn(gist, options);
}

export default renderGistCard;
