import type { TopLangData } from "../fetchers/types";
import { renderTopLanguagesCard as renderTopLanguagesCardJs } from "./top-languages.js";
import type { TopLangOptions } from "./types";

type RenderTopLangFn = (
	langs: TopLangData,
	options?: Partial<TopLangOptions>,
) => string;

export function renderTopLanguagesCard(
	langs: TopLangData,
	options?: Partial<TopLangOptions>,
): string {
	const fn = renderTopLanguagesCardJs as unknown as RenderTopLangFn;
	return fn(langs, options);
}

export default renderTopLanguagesCard;
