// Theme names are looked up dynamically (`themes[name] || defaultTheme`) from
// user-supplied query params, so this is a plain string. The previous
// `keyof typeof import("../../themes/index.js")` aliased a path that does not
// exist and, even if it resolved, `keyof typeof` on a module yields its
// *export* names — so it collapsed to `"default" | "themes"` rather than
// theme names. Matches the `theme?: string` the card options are built with in
// `src/common/utils.ts`.
type RankIcon = "default" | "github" | "percentile";

export type CommonOptions = {
	title_color: string;
	icon_color: string;
	text_color: string;
	bg_color: string;
	theme: string;
	border_radius: number;
	border_color: string;
	locale: string;
	hide_border: boolean;
};

export type StatCardOptions = CommonOptions & {
	hide: string[];
	show_icons: boolean;
	hide_title: boolean;
	card_width: number;
	hide_rank: boolean;
	include_all_commits: boolean;
	commits_year: number;
	line_height: number | string;
	custom_title: string;
	disable_animations: boolean;
	number_format: string;
	ring_color: string;
	text_bold: boolean;
	rank_icon: RankIcon;
	show: string[];
};

export type RepoCardOptions = CommonOptions & {
	show_owner: boolean;
	description_lines_count: number;
};

export type TopLangOptions = CommonOptions & {
	hide_title: boolean;
	card_width: number;
	hide: string[];
	layout: "compact" | "normal" | "donut" | "donut-vertical" | "pie";
	custom_title: string;
	langs_count: number;
	disable_animations: boolean;
	hide_progress: boolean;
	stats_format: "percentages" | "bytes";
};

export type GistCardOptions = CommonOptions & {
	show_owner: boolean;
};
