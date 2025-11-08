import { Card } from "../common/Card.ts";
import { CustomError } from "../common/error.ts";
import { I18n } from "../common/I18n.js";
import { icons, rankIcon } from "../common/icons.js";
import {
	clampValue,
	flexLayout,
	getCardColors,
	kFormatter,
	measureText,
} from "../common/utils.ts";
import type { StatsData } from "../fetchers/types";
import { statCardLocales } from "../translations.js";
import type { StatCardOptions } from "./types";

const CARD_MIN_WIDTH = 287;
const CARD_DEFAULT_WIDTH = 287;
const RANK_CARD_MIN_WIDTH = 420;
const RANK_CARD_DEFAULT_WIDTH = 450;
const RANK_ONLY_CARD_MIN_WIDTH = 290;
const RANK_ONLY_CARD_DEFAULT_WIDTH = 290;

type StatItem = {
	icon: string;
	label: string;
	value: number | string;
	id: string;
	unitSymbol?: string;
};

const createTextNode = ({
	icon,
	label,
	value,
	id,
	unitSymbol,
	index,
	showIcons,
	shiftValuePos,
	bold,
	number_format,
}: {
	icon: string;
	label: string;
	value: number | string;
	id: string;
	unitSymbol?: string;
	index: number;
	showIcons: boolean;
	shiftValuePos: number;
	bold: boolean;
	number_format: string;
}) => {
	const kValue =
		number_format.toLowerCase() === "long" ? value : kFormatter(Number(value));
	const staggerDelay = (index + 3) * 150;

	const labelOffset = showIcons ? `x="25"` : "";
	const iconSvg = showIcons
		? `
        <svg data-testid="icon" class="icon" viewBox="0 0 16 16" version="1.1" width="16" height="16">
            ${icon}
        </svg>
    `
		: "";
	return `
        <g class="stagger" style="animation-delay: ${staggerDelay}ms" transform="translate(25, 0)">
            ${iconSvg}
            <text class="stat ${
							bold ? " bold" : "not_bold"
						}" ${labelOffset} y="12.5">${label}:</text>
            <text
                class="stat ${bold ? " bold" : "not_bold"}"
                x="${(showIcons ? 140 : 120) + shiftValuePos}"
                y="12.5"
                data-testid="${id}"
            >${kValue}${unitSymbol ? ` ${unitSymbol}` : ""}</text>
        </g>
    `;
};

const calculateCircleProgress = (value: number) => {
	const radius = 40;
	const c = Math.PI * (radius * 2);

	if (value < 0) value = 0;
	if (value > 100) value = 100;

	return ((100 - value) / 100) * c;
};

const getProgressAnimation = ({ progress }: { progress: number }) => {
	return `
        @keyframes rankAnimation {
            from {
                stroke-dashoffset: ${calculateCircleProgress(0)};
            }
            to {
                stroke-dashoffset: ${calculateCircleProgress(progress)};
            }
        }
    `;
};

const getStyles = ({
	textColor,
	iconColor,
	ringColor,
	show_icons,
	progress,
}: {
	textColor: string;
	iconColor: string;
	ringColor: string;
	show_icons: boolean;
	progress: number;
}) => {
	return `
        .stat {
            font: 600 14px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif; fill: ${textColor};
        }
        @supports(-moz-appearance: auto) {
            .stat { font-size:12px; }
        }
        .stagger { opacity: 0; animation: fadeInAnimation 0.3s ease-in-out forwards; }
        .rank-text { font: 800 24px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${textColor}; animation: scaleInAnimation 0.3s ease-in-out forwards; }
        .rank-percentile-header { font-size: 14px; }
        .rank-percentile-text { font-size: 16px; }
        .not_bold { font-weight: 400 }
        .bold { font-weight: 700 }
        .icon { fill: ${iconColor}; display: ${show_icons ? "block" : "none"}; }
        .rank-circle-rim { stroke: ${ringColor}; fill: none; stroke-width: 6; opacity: 0.2; }
        .rank-circle { stroke: ${ringColor}; stroke-dasharray: 250; fill: none; stroke-width: 6; stroke-linecap: round; opacity: 0.8; transform-origin: -10px 8px; transform: rotate(-90deg); animation: rankAnimation 1s forwards ease-in-out; }
        ${process.env.NODE_ENV === "test" ? "" : getProgressAnimation({ progress })}
    `;
};

const getTotalCommitsYearLabel = (
	include_all_commits: boolean,
	commits_year: number | undefined,
	i18n: I18n,
) =>
	include_all_commits
		? ""
		: commits_year
			? ` (${commits_year})`
			: ` (${i18n.t("statcard.lastyear")})`;

export function renderStatsCard(
	stats: StatsData,
	options: Partial<StatCardOptions> = {},
): string {
	const {
		name,
		totalStars,
		totalCommits,
		totalIssues,
		totalPRs,
		totalPRsMerged,
		mergedPRsPercentage,
		totalReviews,
		totalDiscussionsStarted,
		totalDiscussionsAnswered,
		contributedTo,
		rank,
	} = stats;

	const {
		hide = [],
		show_icons = false,
		hide_title = false,
		hide_border = false,
		card_width,
		hide_rank = false,
		include_all_commits = false,
		commits_year,
		line_height = 25,
		title_color,
		ring_color,
		icon_color,
		text_color,
		text_bold = true,
		bg_color,
		theme = "default",
		custom_title,
		border_radius,
		border_color,
		number_format = "short",
		locale,
		disable_animations = false,
		rank_icon = "default",
		show = [],
	} = options;

	const lheight = parseInt(String(line_height), 10);

	const {
		titleColor,
		iconColor,
		textColor,
		bgColor,
		borderColor,
		ringColor: resolvedRingColor,
	} = getCardColors({
		title_color,
		text_color,
		icon_color,
		bg_color,
		border_color,
		ring_color,
		theme,
	});
	const apostrophe = /s$/i.test(name.trim()) ? "" : "s";
	const i18n = new I18n({
		locale,
		translations: statCardLocales({ name, apostrophe }),
	});

	const STATS: Record<string, StatItem> = {};

	STATS.stars = {
		icon: icons.star,
		label: i18n.t("statcard.totalstars"),
		value: totalStars,
		id: "stars",
	};
	STATS.commits = {
		icon: icons.commits,
		label: `${i18n.t("statcard.commits")}${getTotalCommitsYearLabel(include_all_commits, commits_year as number | undefined, i18n)}`,
		value: totalCommits,
		id: "commits",
	};
	STATS.prs = {
		icon: icons.prs,
		label: i18n.t("statcard.prs"),
		value: totalPRs,
		id: "prs",
	};

	if (show.includes("prs_merged")) {
		STATS.prs_merged = {
			icon: icons.prs_merged,
			label: i18n.t("statcard.prs-merged"),
			value: totalPRsMerged,
			id: "prs_merged",
		};
	}

	if (show.includes("prs_merged_percentage")) {
		STATS.prs_merged_percentage = {
			icon: icons.prs_merged_percentage,
			label: i18n.t("statcard.prs-merged-percentage"),
			value: mergedPRsPercentage.toFixed(2),
			id: "prs_merged_percentage",
			unitSymbol: "%",
		};
	}

	if (show.includes("reviews")) {
		STATS.reviews = {
			icon: icons.reviews,
			label: i18n.t("statcard.reviews"),
			value: totalReviews,
			id: "reviews",
		};
	}

	STATS.issues = {
		icon: icons.issues,
		label: i18n.t("statcard.issues"),
		value: totalIssues,
		id: "issues",
	};

	if (show.includes("discussions_started")) {
		STATS.discussions_started = {
			icon: icons.discussions_started,
			label: i18n.t("statcard.discussions-started"),
			value: totalDiscussionsStarted,
			id: "discussions_started",
		};
	}
	if (show.includes("discussions_answered")) {
		STATS.discussions_answered = {
			icon: icons.discussions_answered,
			label: i18n.t("statcard.discussions-answered"),
			value: totalDiscussionsAnswered,
			id: "discussions_answered",
		};
	}

	STATS.contribs = {
		icon: icons.contribs,
		label: i18n.t("statcard.contribs"),
		value: contributedTo,
		id: "contribs",
	};

	const longLocales = [
		"bg",
		"de",
		"es",
		"fil",
		"fr",
		"id",
		"ml",
		"my",
		"nl",
		"pl",
		"pt-br",
		"pt-pt",
		"ru",
		"sr",
		"sr-latn",
		"sw",
		"ta",
		"uk-ua",
		"uz",
		"zh-tw",
	];
	const isLongLocale = locale ? longLocales.includes(locale) : false;

	const statItems = Object.keys(STATS)
		.filter((key) => !hide.includes(key))
		.map((key, index) => {
			const stat = STATS[key];
			if (!stat) {
				throw new Error(`Invalid stat key: ${key}`);
			}
			return createTextNode({
				icon: stat.icon,
				label: stat.label,
				value: stat.value,
				id: stat.id,
				unitSymbol: stat.unitSymbol,
				index,
				showIcons: show_icons,
				shiftValuePos: 79.01 + (isLongLocale ? 50 : 0),
				bold: text_bold,
				number_format,
			});
		});

	if (statItems.length === 0 && hide_rank) {
		throw new CustomError(
			"Could not render stats card.",
			"Either stats or rank are required.",
		);
	}

	const height = Math.max(
		45 + (statItems.length + 1) * lheight,
		hide_rank ? 0 : statItems.length ? 150 : 180,
	);

	const progress = 100 - rank.percentile;
	const cssStyles = getStyles({
		ringColor: resolvedRingColor || ring_color || "",
		textColor,
		iconColor,
		show_icons,
		progress,
	});

	const calculateTextWidth = () =>
		measureText(
			custom_title
				? custom_title
				: statItems.length
					? i18n.t("statcard.title")
					: i18n.t("statcard.ranktitle"),
		);

	const iconWidth = show_icons && statItems.length ? 16 + /* padding */ 1 : 0;
	const minCardWidth =
		(hide_rank
			? clampValue(50 + calculateTextWidth() * 2, CARD_MIN_WIDTH, Infinity)
			: statItems.length
				? RANK_CARD_MIN_WIDTH
				: RANK_ONLY_CARD_MIN_WIDTH) + iconWidth;
	const defaultCardWidth =
		(hide_rank
			? CARD_DEFAULT_WIDTH
			: statItems.length
				? RANK_CARD_DEFAULT_WIDTH
				: RANK_ONLY_CARD_DEFAULT_WIDTH) + iconWidth;
	let width = card_width
		? Number.isNaN(Number(card_width))
			? defaultCardWidth
			: Number(card_width)
		: defaultCardWidth;
	if (width < minCardWidth) width = minCardWidth;

	const card = new Card({
		customTitle: custom_title,
		defaultTitle: statItems.length
			? i18n.t("statcard.title")
			: i18n.t("statcard.ranktitle"),
		width,
		height,
		border_radius,
		colors: { titleColor, textColor, iconColor, bgColor, borderColor },
	});

	card.setHideBorder(hide_border);
	card.setHideTitle(hide_title);
	card.setCSS(cssStyles);

	if (disable_animations) card.disableAnimations();

	const calculateRankXTranslation = () => {
		if (statItems.length) {
			const minXTranslation = RANK_CARD_MIN_WIDTH + iconWidth - 70;
			if (width > RANK_CARD_DEFAULT_WIDTH) {
				const xMaxExpansion = minXTranslation + (450 - minCardWidth) / 2;
				return xMaxExpansion + width - RANK_CARD_DEFAULT_WIDTH;
			} else {
				return minXTranslation + (width - minCardWidth) / 2;
			}
		} else {
			return width / 2 + 20 - 10;
		}
	};

	type RankIconName = "default" | "github" | "percentile";
	const rankIconName = (rank_icon as unknown as RankIconName) ?? "default";
	const rankCircle = hide_rank
		? ""
		: `<g data-testid="rank-circle" transform="translate(${calculateRankXTranslation()}, ${height / 2 - 50})">
                        <circle class="rank-circle-rim" cx="-10" cy="8" r="40" />
                        <circle class="rank-circle" cx="-10" cy="8" r="40" />
                        <g class="rank-text">
                            ${rankIcon(rankIconName, rank?.level, rank?.percentile)}
                        </g>
                    </g>`;

	const labels = Object.keys(STATS)
		.filter((key) => !hide.includes(key))
		.map((key) => {
			const stat = STATS[key];
			if (!stat) {
				throw new Error(`Invalid stat key: ${key}`);
			}
			if (key === "commits") {
				return `${i18n.t("statcard.commits")} ${getTotalCommitsYearLabel(include_all_commits, commits_year as number | undefined, i18n)} : ${stat.value}`;
			}
			return `${stat.label}: ${stat.value}`;
		})
		.join(", ");

	card.setAccessibilityLabel({
		title: `${card.title}, Rank: ${rank.level}`,
		desc: labels,
	});

	return card.render(`
        ${rankCircle}
        <svg x="0" y="0">
            ${flexLayout({ items: statItems, gap: lheight, direction: "column" }).join("")}
        </svg>
    `);
}
