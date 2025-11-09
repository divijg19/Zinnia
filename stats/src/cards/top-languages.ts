// Canonical TypeScript implementation of the Top Languages card.
// Tests previously imported the JS version; a thin JS shim now re-exports this file.
// This file contains the full logic including all layouts (normal, compact, donut, donut-vertical, pie).
import { Card } from "../common/Card.js";
import { createProgressNode } from "../common/createProgressNode.js";
import { I18n } from "../common/I18n.js";
import {
	chunkArray,
	clampValue,
	flexLayout,
	formatBytes,
	getCardColors,
	lowercaseTrim,
	measureText,
} from "../common/utils.js";
import type { Lang, TopLangData } from "../fetchers/types.js";
import { langCardLocales } from "../translations.js";
import type { TopLangOptions } from "./types.js";

const DEFAULT_CARD_WIDTH = 300;
export const MIN_CARD_WIDTH = 280;
const DEFAULT_LANG_COLOR = "#858585";
const CARD_PADDING = 25;
const COMPACT_LAYOUT_BASE_HEIGHT = 90;
const MAXIMUM_LANGS_COUNT = 20;

const NORMAL_LAYOUT_DEFAULT_LANGS_COUNT = 5;
const COMPACT_LAYOUT_DEFAULT_LANGS_COUNT = 6;
const DONUT_LAYOUT_DEFAULT_LANGS_COUNT = 5;
const PIE_LAYOUT_DEFAULT_LANGS_COUNT = 6;
const DONUT_VERTICAL_LAYOUT_DEFAULT_LANGS_COUNT = 6;

export type Layout = TopLangOptions["layout"];

export const getLongestLang = (arr: Lang[]) =>
	arr.reduce<Lang>(
		(savedLang, lang) =>
			lang.name.length > savedLang.name.length ? lang : savedLang,
		{ name: "", size: 0, color: "" },
	);

export const degreesToRadians = (angleInDegrees: number) =>
	angleInDegrees * (Math.PI / 180.0);

export const radiansToDegrees = (angleInRadians: number) =>
	angleInRadians / (Math.PI / 180.0);

export const polarToCartesian = (
	centerX: number,
	centerY: number,
	radius: number,
	angleInDegrees: number,
) => {
	const rads = degreesToRadians(angleInDegrees);
	return {
		x: centerX + radius * Math.cos(rads),
		y: centerY + radius * Math.sin(rads),
	};
};

export const cartesianToPolar = (
	centerX: number,
	centerY: number,
	x: number,
	y: number,
) => {
	const radius = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
	let angleInDegrees = radiansToDegrees(Math.atan2(y - centerY, x - centerX));
	if (angleInDegrees < 0) {
		angleInDegrees += 360;
	}
	return { radius, angleInDegrees };
};

export const getCircleLength = (radius: number) => 2 * Math.PI * radius;

export const calculateCompactLayoutHeight = (totalLangs: number) =>
	COMPACT_LAYOUT_BASE_HEIGHT + Math.round(totalLangs / 2) * 25;

export const calculateNormalLayoutHeight = (totalLangs: number) =>
	45 + (totalLangs + 1) * 40;

export const calculateDonutLayoutHeight = (totalLangs: number) =>
	215 + Math.max(totalLangs - 5, 0) * 32;

export const calculateDonutVerticalLayoutHeight = (totalLangs: number) =>
	300 + Math.round(totalLangs / 2) * 25;

export const calculatePieLayoutHeight = (totalLangs: number) =>
	300 + Math.round(totalLangs / 2) * 25;

export const donutCenterTranslation = (totalLangs: number) =>
	-45 + Math.max(totalLangs - 5, 0) * 16;

export const trimTopLanguages = (
	topLangs: Record<string, Lang> | Lang[],
	langs_count: number = NORMAL_LAYOUT_DEFAULT_LANGS_COUNT,
	hide?: string[],
) => {
	// Support both an object map and a direct array (tests pass arrays sometimes).
	let langs: Lang[] = Array.isArray(topLangs)
		? topLangs
		: Object.values(topLangs);
	const langsToHide: Record<string, boolean> = Object.create(null);
	const langsCount = clampValue(langs_count, 1, MAXIMUM_LANGS_COUNT);

	if (hide) {
		for (const langName of hide) {
			langsToHide[lowercaseTrim(langName)] = true;
		}
	}

	langs = langs
		.sort((a, b) => b.size - a.size)
		.filter((lang) => !langsToHide[lowercaseTrim(lang.name)])
		.slice(0, langsCount);

	const totalLanguageSize = langs.reduce((acc, curr) => acc + curr.size, 0);
	return { langs, totalLanguageSize };
};

const getDisplayValue = (size: number, percentages: number, format: string) =>
	format === "bytes" ? formatBytes(size) : `${percentages.toFixed(2)}%`;

const createProgressTextNode = ({
	width,
	color,
	name,
	size,
	totalSize,
	statsFormat,
	index,
}: {
	width: number;
	color: string;
	name: string;
	size: number;
	totalSize: number;
	statsFormat: string;
	index: number;
}) => {
	const staggerDelay = (index + 3) * 150;
	const paddingRight = 95;
	const progressTextX = width - paddingRight + 10;
	const progressWidth = width - paddingRight;

	const progress = (size / totalSize) * 100;
	const displayValue = getDisplayValue(size, progress, statsFormat);

	return `
		<g class="stagger" style="animation-delay: ${staggerDelay}ms">
			<text data-testid="lang-name" x="2" y="15" class="lang-name">${name}</text>
			<text x="${progressTextX}" y="34" class="lang-name">${displayValue}</text>
			${createProgressNode({
				x: 0,
				y: 25,
				color,
				width: progressWidth,
				progress,
				progressBarBackgroundColor: "#ddd",
				delay: staggerDelay + 300,
			})}
		</g>
	`;
};

const createCompactLangNode = ({
	lang,
	totalSize,
	hideProgress,
	statsFormat = "percentages",
	index,
}: {
	lang: Lang;
	totalSize: number;
	hideProgress?: boolean;
	statsFormat?: string;
	index: number;
}) => {
	const percentages = (lang.size / totalSize) * 100;
	const displayValue = getDisplayValue(lang.size, percentages, statsFormat);

	const staggerDelay = (index + 3) * 150;
	const color = lang.color || "#858585";

	return `
		<g class="stagger" style="animation-delay: ${staggerDelay}ms">
			<circle cx="5" cy="6" r="5" fill="${color}" />
			<text data-testid="lang-name" x="15" y="10" class='lang-name'>
				${lang.name} ${hideProgress ? "" : displayValue}
			</text>
		</g>
	`;
};

const createLanguageTextNode = ({
	langs,
	totalSize,
	hideProgress,
	statsFormat,
}: {
	langs: Lang[];
	totalSize: number;
	hideProgress?: boolean;
	statsFormat?: string;
}) => {
	const longestLang = getLongestLang(langs);
	const chunked = chunkArray(langs, langs.length / 2);
	const layouts = chunked.map((array) => {
		const items = array.map((lang, index) =>
			createCompactLangNode({
				lang,
				totalSize,
				hideProgress,
				statsFormat,
				index,
			}),
		);
		return flexLayout({
			items,
			gap: 25,
			direction: "column",
		}).join("");
	});

	const percent = ((longestLang.size / totalSize) * 100).toFixed(2);
	const minGap = 150;
	const maxGap = 20 + measureText(`${longestLang.name} ${percent}%`, 11);
	return flexLayout({
		items: layouts,
		gap: maxGap < minGap ? minGap : maxGap,
	}).join("");
};

const createDonutLanguagesNode = ({
	langs,
	totalSize,
	statsFormat,
}: {
	langs: Lang[];
	totalSize: number;
	statsFormat: string;
}) => {
	return flexLayout({
		items: langs.map((lang, index) => {
			return createCompactLangNode({
				lang,
				totalSize,
				hideProgress: false,
				statsFormat,
				index,
			});
		}),
		gap: 32,
		direction: "column",
	}).join("");
};

const renderNormalLayout = (
	langs: Lang[],
	width: number,
	totalLanguageSize: number,
	statsFormat: string,
) => {
	return flexLayout({
		items: langs.map((lang, index) => {
			return createProgressTextNode({
				width,
				name: lang.name,
				color: lang.color || DEFAULT_LANG_COLOR,
				size: lang.size,
				totalSize: totalLanguageSize,
				statsFormat,
				index,
			});
		}),
		gap: 40,
		direction: "column",
	}).join("");
};

const renderCompactLayout = (
	langs: Lang[],
	width: number,
	totalLanguageSize: number,
	hideProgress?: boolean,
	statsFormat: string = "percentages",
) => {
	const paddingRight = 50;
	const offsetWidth = width - paddingRight;
	let progressOffset = 0;
	const compactProgressBar = langs
		.map((lang) => {
			const percentage = parseFloat(
				((lang.size / totalLanguageSize) * offsetWidth).toFixed(2),
			);

			const progress = percentage < 10 ? percentage + 10 : percentage;

			const output = `
				<rect
					mask="url(#rect-mask)"
					data-testid="lang-progress"
					x="${progressOffset}"
					y="0"
					width="${progress}"
					height="8"
					fill="${lang.color || "#858585"}"
				/>
			`;
			progressOffset += percentage;
			return output;
		})
		.join("");

	return `
	${
		hideProgress
			? ""
			: `
			<mask id="rect-mask">
					<rect x="0" y="0" width="${offsetWidth}" height="8" fill="white" rx="5"/>
				</mask>
				${compactProgressBar}
			`
	}
		<g transform="translate(0, ${hideProgress ? "0" : "25"})">
			${createLanguageTextNode({
				langs,
				totalSize: totalLanguageSize,
				hideProgress,
				statsFormat,
			})}
		</g>
	`;
};

const renderDonutVerticalLayout = (
	langs: Lang[],
	totalLanguageSize: number,
	statsFormat: string,
) => {
	const radius = 80;
	const totalCircleLength = getCircleLength(radius);
	const circles: string[] = [];
	let offset = 0;
	let startDelayCoefficient = 1;
	for (const lang of langs) {
		const percentage = (lang.size / totalLanguageSize) * 100;
		const delay = startDelayCoefficient * 100;
		const partLength = (percentage / 100) * totalCircleLength;
		circles.push(`
      <g class="stagger" style="animation-delay: ${delay}ms">
        <circle 
          cx="150" cy="100" r="${radius}" fill="transparent"
          stroke="${lang.color}" stroke-width="25" stroke-dasharray="${totalCircleLength}"
          stroke-dashoffset="${offset}" size="${percentage}" data-testid="lang-donut" />
      </g>`);
		offset += partLength;
		startDelayCoefficient += 1;
	}
	return `
    <svg data-testid="lang-items">
      <g transform="translate(0, 0)"><svg data-testid="donut">${circles.join("")}</svg></g>
      <g transform="translate(0, 220)"><svg data-testid="lang-names" x="${CARD_PADDING}">${createLanguageTextNode(
				{
					langs,
					totalSize: totalLanguageSize,
					hideProgress: false,
					statsFormat,
				},
			)}</svg></g>
    </svg>`;
};

const renderPieLayout = (
	langs: Lang[],
	totalLanguageSize: number,
	statsFormat: string,
) => {
	const radius = 90;
	const centerX = 150;
	const centerY = 100;
	let startAngle = 0;
	let startDelayCoefficient = 1;
	const paths: string[] = [];
	for (const lang of langs) {
		if (langs.length === 1) {
			paths.push(
				`<circle cx="${centerX}" cy="${centerY}" r="${radius}" stroke="none" fill="${lang.color}" data-testid="lang-pie" size="100"/>`,
			);
			break;
		}
		const langSizePart = lang.size / totalLanguageSize;
		const percentage = langSizePart * 100;
		const angle = langSizePart * 360;
		const endAngle = startAngle + angle;
		const startPoint = polarToCartesian(centerX, centerY, radius, startAngle);
		const endPoint = polarToCartesian(centerX, centerY, radius, endAngle);
		const largeArcFlag = angle > 180 ? 1 : 0;
		const delay = startDelayCoefficient * 100;
		paths.push(`<g class="stagger" style="animation-delay: ${delay}ms">
			<path data-testid="lang-pie" size="${percentage}" d="M ${centerX} ${centerY} L ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endPoint.x} ${endPoint.y} Z" fill="${lang.color}" />
		</g>`);
		startAngle = endAngle;
		startDelayCoefficient += 1;
	}
	return `
		<svg data-testid="lang-items">
			<g transform="translate(0, 0)"><svg data-testid="pie">${paths.join("")}</svg></g>
			<g transform="translate(0, 220)"><svg data-testid="lang-names" x="${CARD_PADDING}">${createLanguageTextNode(
				{
					langs,
					totalSize: totalLanguageSize,
					hideProgress: false,
					statsFormat,
				},
			)}</svg></g>
		</svg>`;
};

// Donut layout helpers (distinct from donut-vertical)
type DonutPath = { d: string; percent: number };
const createDonutPaths = (
	cx: number,
	cy: number,
	radius: number,
	percentages: number[],
): DonutPath[] => {
	const pathsArr: DonutPath[] = [];
	let startAngle = 0;
	let endAngle = 0;
	const totalPercent = percentages.reduce((acc, curr) => acc + curr, 0);
	for (let i = 0; i < percentages.length; i++) {
		const percentage = percentages[i];
		if (percentage === undefined) continue;
		const percent = parseFloat(((percentage / totalPercent) * 100).toFixed(2));
		endAngle = 3.6 * percent + startAngle;
		const startPoint = polarToCartesian(cx, cy, radius, endAngle - 90);
		const endPoint = polarToCartesian(cx, cy, radius, startAngle - 90);
		const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
		const sx = Number(startPoint.x.toFixed(6));
		const sy = Number(startPoint.y.toFixed(6));
		const ex = Number(endPoint.x.toFixed(6));
		const ey = Number(endPoint.y.toFixed(6));
		pathsArr.push({
			percent,
			d: `M ${sx} ${sy} A ${Number(radius.toFixed(6))} ${Number(radius.toFixed(6))} 0 ${largeArc} 0 ${ex} ${ey} ${sx}`,
		});
		startAngle = endAngle;
	}
	return pathsArr;
};

const renderDonutLayout = (
	langs: Lang[],
	width: number,
	totalLanguageSize: number,
	statsFormat: string,
) => {
	const centerX = width / 3;
	const centerY = width / 3;
	const radius = centerX - 60;
	const strokeWidth = 12;
	const colors = langs.map((l) => l.color);
	const langsPercents = langs.map((lang) =>
		parseFloat(((lang.size / totalLanguageSize) * 100).toFixed(2)),
	);
	const langPaths = createDonutPaths(centerX, centerY, radius, langsPercents);
	const donutPaths =
		langs.length === 1
			? `<circle cx="${centerX}" cy="${centerY}" r="${radius}" stroke="${colors[0]}" fill="none" stroke-width="${strokeWidth}" data-testid="lang-donut" size="100"/>`
			: langPaths
					.map((section, index) => {
						const staggerDelay = (index + 3) * 100;
						const delay = staggerDelay + 300;
						return `<g class="stagger" style="animation-delay: ${delay}ms">
							<path data-testid="lang-donut" size="${section.percent}" d="${section.d}" stroke="${colors[index]}" fill="none" stroke-width="${strokeWidth}"></path>
						</g>`;
					})
					.join("");
	const donut = `<svg width="${width}" height="${width}">${donutPaths}</svg>`;
	return `<g transform="translate(0, 0)">
		<g transform="translate(0, 0)">${createDonutLanguagesNode({
			langs,
			totalSize: totalLanguageSize,
			statsFormat,
		})}</g>
		<g transform="translate(125, ${donutCenterTranslation(langs.length)})">${donut}</g>
	</g>`;
};

type NoLangNodeProps = { color: string; text: string; layout?: Layout };
const noLanguagesDataNode = ({ color, text, layout }: NoLangNodeProps) => `
  <text x="${layout === "pie" || layout === "donut-vertical" ? CARD_PADDING : 0}" y="11" class="stat bold" fill="${color}">${text}</text>
`;

export const getDefaultLanguagesCountByLayout = ({
	layout,
	hide_progress,
}: {
	layout?: Layout;
	hide_progress?: boolean;
}) => {
	if (layout === "compact" || hide_progress === true) {
		return COMPACT_LAYOUT_DEFAULT_LANGS_COUNT;
	} else if (layout === "donut") {
		return DONUT_LAYOUT_DEFAULT_LANGS_COUNT;
	} else if (layout === "donut-vertical") {
		return DONUT_VERTICAL_LAYOUT_DEFAULT_LANGS_COUNT;
	} else if (layout === "pie") {
		return PIE_LAYOUT_DEFAULT_LANGS_COUNT;
	} else {
		return NORMAL_LAYOUT_DEFAULT_LANGS_COUNT;
	}
};

export function renderTopLanguages(
	topLangs: TopLangData,
	options: Partial<TopLangOptions> = {},
): string {
	const {
		hide_title = false,
		hide_border = false,
		card_width,
		title_color,
		text_color,
		bg_color,
		hide,
		hide_progress,
		theme,
		layout,
		custom_title,
		locale,
		langs_count = getDefaultLanguagesCountByLayout({ layout, hide_progress }),
		border_radius,
		border_color,
		disable_animations,
		stats_format = "percentages",
	} = options;

	const i18n = new I18n({ locale, translations: langCardLocales });
	const { langs, totalLanguageSize } = trimTopLanguages(
		topLangs as any,
		langs_count,
		hide,
	);

	let width = card_width
		? Number.isNaN(card_width)
			? DEFAULT_CARD_WIDTH
			: card_width < MIN_CARD_WIDTH
				? MIN_CARD_WIDTH
				: card_width
		: DEFAULT_CARD_WIDTH;
	let height = calculateNormalLayoutHeight(langs.length);

	const colors = getCardColors({
		title_color,
		text_color,
		bg_color,
		border_color,
		theme,
	});
	let finalLayout = "";
	if (langs.length === 0) {
		height = COMPACT_LAYOUT_BASE_HEIGHT;
		finalLayout = noLanguagesDataNode({
			color: colors.textColor,
			text: i18n.t("langcard.nodata"),
			layout,
		});
	} else if (layout === "pie") {
		height = calculatePieLayoutHeight(langs.length);
		finalLayout = renderPieLayout(langs, totalLanguageSize, stats_format);
	} else if (layout === "donut-vertical") {
		height = calculateDonutVerticalLayoutHeight(langs.length);
		finalLayout = renderDonutVerticalLayout(
			langs,
			totalLanguageSize,
			stats_format,
		);
	} else if (layout === "compact" || hide_progress === true) {
		height =
			calculateCompactLayoutHeight(langs.length) + (hide_progress ? -25 : 0);
		finalLayout = renderCompactLayout(
			langs,
			width,
			totalLanguageSize,
			hide_progress,
			stats_format,
		);
	} else if (layout === "donut") {
		height = calculateDonutLayoutHeight(langs.length);
		width = width + 50; // padding for donut chart
		finalLayout = renderDonutLayout(
			langs,
			width,
			totalLanguageSize,
			stats_format,
		);
	} else {
		finalLayout = renderNormalLayout(
			langs,
			width,
			totalLanguageSize,
			stats_format,
		);
	}

	const card = new Card({
		customTitle: custom_title,
		defaultTitle: i18n.t("langcard.title"),
		width,
		height,
		border_radius,
		colors,
	});

	if (disable_animations) card.disableAnimations();
	card.setHideBorder(hide_border);
	card.setHideTitle(hide_title);
	card.setCSS(`
		@keyframes slideInAnimation { from { width:0; } to { width:calc(100%-100px);} }
		@keyframes growWidthAnimation { from { width:0; } to { width:100%; } }
		.stat { font: 600 14px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif; fill: ${colors.textColor}; }
		@supports(-moz-appearance: auto){ .stat{ font-size:12px; } }
		.bold { font-weight:700 }
		.lang-name { font: 400 11px "Segoe UI", Ubuntu, Sans-Serif; fill: ${colors.textColor}; }
		.stagger { opacity:0; animation: fadeInAnimation 0.3s ease-in-out forwards; }
		#rect-mask rect { animation: slideInAnimation 1s ease-in-out forwards; }
		.lang-progress { animation: growWidthAnimation 0.6s ease-in-out forwards; }
	`);

	if (layout === "pie" || layout === "donut-vertical")
		return card.render(finalLayout);
	return card.render(
		`<svg data-testid="lang-items" x="${CARD_PADDING}">${finalLayout}</svg>`,
	);
}
export const renderTopLanguagesCard = renderTopLanguages;
// MIN_CARD_WIDTH already exported above.
export { createDonutPaths, renderDonutLayout };
