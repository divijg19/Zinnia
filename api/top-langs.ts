import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createCardHandler } from "../lib/card-handler.js";
import { parseArray, parseBoolean, parseNumber } from "../lib/params.js";
import { renderTopLanguages } from "../stats/src/cards/top-languages.js";
import { fetchTopLanguages } from "../stats/src/fetchers/top-languages.js";

type Layout =
	| "compact"
	| "normal"
	| "donut"
	| "donut-vertical"
	| "pie"
	| undefined;
type StatsFormat = "percentages" | "bytes" | undefined;

const cardHandler = createCardHandler({
	service: "top-langs",
	fallbackPath: "/api/top-langs",
	rateLimitCode: "TOP_LANGS_RATE_LIMIT",
	internalCode: "TOP_LANGS_INTERNAL",
	cacheEnvKeys: ["TOP_LANGS_CACHE_SECONDS", "CACHE_SECONDS"],
	cacheFallbackSeconds: 86400,
	fetchData: async (username, url) => {
		const exclude_repo = parseArray(
			url.searchParams.get("exclude_repo") ?? undefined,
		);
		const size_weight = parseNumber(
			url.searchParams.get("size_weight") ?? undefined,
		);
		const count_weight = parseNumber(
			url.searchParams.get("count_weight") ?? undefined,
		);
		return fetchTopLanguages(
			username,
			exclude_repo,
			typeof size_weight === "number" ? size_weight : 1,
			typeof count_weight === "number" ? count_weight : 0,
		);
	},
	prepareRender: (url, diag) => {
		const layoutRaw = url.searchParams.get("layout") ?? undefined;
		const layout: Layout =
			layoutRaw === "compact" ||
			layoutRaw === "normal" ||
			layoutRaw === "donut" ||
			layoutRaw === "donut-vertical" ||
			layoutRaw === "pie"
				? layoutRaw
				: undefined;
		(diag.params as Record<string, unknown>).layout = layout ?? "normal";
		const statsFormatRaw = url.searchParams.get("stats_format") ?? undefined;
		const stats_format: StatsFormat =
			statsFormatRaw === "percentages" || statsFormatRaw === "bytes"
				? statsFormatRaw
				: undefined;
		return { layout, stats_format };
	},
	renderSvg: (data, url, prepared) => {
		const { layout, stats_format } = (prepared ?? {}) as {
			layout: Layout;
			stats_format: StatsFormat;
		};
		return renderTopLanguages(
			data as Parameters<typeof renderTopLanguages>[0],
			{
				hide: parseArray(url.searchParams.get("hide") ?? undefined),
				hide_progress: parseBoolean(
					url.searchParams.get("hide_progress") ?? undefined,
				),
				hide_title: parseBoolean(
					url.searchParams.get("hide_title") ?? undefined,
				),
				hide_border: parseBoolean(
					url.searchParams.get("hide_border") ?? undefined,
				),
				custom_title: url.searchParams.get("custom_title") ?? undefined,
				// Top-langs renderer uses a narrow theme union; accept any user-provided theme.
				theme: (url.searchParams.get("theme") ?? "default") as any,
				layout,
				locale: url.searchParams.get("locale") ?? undefined,
				langs_count: parseNumber(
					url.searchParams.get("langs_count") ?? undefined,
				),
				card_width: parseNumber(
					url.searchParams.get("card_width") ?? undefined,
				),
				border_radius: parseNumber(
					url.searchParams.get("border_radius") ?? undefined,
				),
				title_color: url.searchParams.get("title_color") ?? undefined,
				text_color: url.searchParams.get("text_color") ?? undefined,
				bg_color: url.searchParams.get("bg_color") ?? undefined,
				border_color: url.searchParams.get("border_color") ?? undefined,
				stats_format,
				disable_animations: parseBoolean(
					url.searchParams.get("disable_animations") ?? undefined,
				),
			},
		);
	},
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
	return cardHandler(req, res);
}
