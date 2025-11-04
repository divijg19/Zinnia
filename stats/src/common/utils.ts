import axios from "axios";
import toEmoji from "emoji-name-map";
import wrap from "word-wrap";
import { themes } from "../../themes/index.js";
import { SECONDARY_ERROR_MESSAGES, TRY_AGAIN_LATER } from "./error.ts";

export const ERROR_CARD_LENGTH = 576.5;

export const flexLayout = ({
	items,
	gap,
	direction,
	sizes = [],
}: {
	items: string[];
	gap: number;
	direction?: "column" | "row";
	sizes?: number[];
}) => {
	let lastSize = 0;
	return items.filter(Boolean).map((item, i) => {
		const size = sizes[i] || 0;
		let transform = `translate(${lastSize}, 0)`;
		if (direction === "column") {
			transform = `translate(0, ${lastSize})`;
		}
		lastSize += size + gap;
		return `<g transform="${transform}">${item}</g>`;
	});
};

export const createLanguageNode = (langName: string, langColor: string) => {
	return `
    <g data-testid="primary-lang">
      <circle data-testid="lang-color" cx="0" cy="-5" r="6" fill="${langColor}" />
      <text data-testid="lang-name" class="gray" x="15">${langName}</text>
    </g>
    `;
};

export const iconWithLabel = (
	icon: string,
	label: number | string,
	testid: string,
	iconSize: number,
) => {
	if (typeof label === "number" && label <= 0) {
		return "";
	}
	const iconSvg = `
      <svg
        class="icon"
        y="-12"
        viewBox="0 0 16 16"
        version="1.1"
        width="${iconSize}"
        height="${iconSize}"
      >
        ${icon}
      </svg>
    `;
	const text = `<text data-testid="${testid}" class="gray">${label}</text>`;
	return flexLayout({ items: [iconSvg, text], gap: 20 }).join("");
};

export const kFormatter = (num: number) => {
	return Math.abs(num) > 999
		? `${Math.sign(num) * parseFloat((Math.abs(num) / 1000).toFixed(1))}k`
		: Math.sign(num) * Math.abs(num);
};

export const isValidHexColor = (hexColor: string) => {
	return new RegExp(
		/^([A-Fa-f0-9]{8}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{4})$/,
	).test(hexColor);
};

export const parseBoolean = (
	value: string | boolean | undefined,
): boolean | undefined => {
	if (typeof value === "boolean") return value;
	if (typeof value === "string") {
		if (value.toLowerCase() === "true") return true;
		if (value.toLowerCase() === "false") return false;
	}
	return undefined;
};

export const parseArray = (str?: string): string[] => {
	if (!str) return [];
	return str.split(",");
};

export const clampValue = (number: number, min: number, max: number) => {
	if (Number.isNaN(parseInt(number as unknown as string, 10))) {
		return min;
	}
	return Math.max(min, Math.min(number, max));
};

export const isValidGradient = (colors: string[]) => {
	return (
		colors.length > 2 &&
		colors.slice(1).every((color) => isValidHexColor(color))
	);
};

export const fallbackColor = (
	color: string | undefined,
	fallbackColor: string | string[],
) => {
	let gradient: string[] | null = null;
	const colors = color ? color.split(",") : [];
	if (colors.length > 1 && isValidGradient(colors)) {
		gradient = colors;
	}
	return (
		(gradient ? gradient : isValidHexColor(color || "") && `#${color}`) ||
		fallbackColor
	);
};

export const request = (data: unknown, headers: Record<string, string>) => {
	return axios({
		url: "https://api.github.com/graphql",
		method: "post",
		headers,
		data,
	});
};

type CardThemeOptions = {
	title_color?: string;
	text_color?: string;
	icon_color?: string;
	bg_color?: string;
	border_color?: string;
	ring_color?: string;
	theme?: string;
	fallbackTheme?: string;
};

export const getCardColors = ({
	title_color,
	text_color,
	icon_color,
	bg_color,
	border_color,
	ring_color,
	theme,
	fallbackTheme = "default",
}: CardThemeOptions) => {
	const themesMap = themes as Record<string, Record<string, string>>;
	const defaultTheme = themesMap[fallbackTheme];
	const selectedTheme = themesMap[theme || ""] || defaultTheme;
	const defaultBorderColor =
		selectedTheme.border_color || defaultTheme.border_color;
	const titleColor = fallbackColor(
		title_color || selectedTheme.title_color,
		`#${defaultTheme.title_color}`,
	);
	const ringColor = fallbackColor(
		ring_color || selectedTheme.ring_color,
		titleColor,
	);
	const iconColor = fallbackColor(
		icon_color || selectedTheme.icon_color,
		`#${defaultTheme.icon_color}`,
	);
	const textColor = fallbackColor(
		text_color || selectedTheme.text_color,
		`#${defaultTheme.text_color}`,
	);
	const bgColor = fallbackColor(
		bg_color || selectedTheme.bg_color,
		`#${defaultTheme.bg_color}`,
	);
	const borderColor = fallbackColor(
		border_color || defaultBorderColor,
		`#${defaultBorderColor}`,
	);
	if (
		typeof titleColor !== "string" ||
		typeof textColor !== "string" ||
		typeof ringColor !== "string" ||
		typeof iconColor !== "string" ||
		typeof borderColor !== "string"
	) {
		throw new Error(
			"Unexpected behavior, all colors except background should be string.",
		);
	}
	return { titleColor, iconColor, textColor, bgColor, borderColor, ringColor };
};

export const encodeHTML = (str: string) => {
	return str
		.replace(/[\u00A0-\u9999<>&](?!#)/gim, (i) => {
			return `&#${i.charCodeAt(0)};`;
		})
		.split("\u0008")
		.join("");
};

const UPSTREAM_API_ERRORS = [
	TRY_AGAIN_LATER,
	SECONDARY_ERROR_MESSAGES.MAX_RETRY,
];

export const renderError = ({
	message,
	secondaryMessage = "",
	renderOptions = {},
}: {
	message: string;
	secondaryMessage?: string;
	renderOptions?: Partial<CardThemeOptions & { show_repo_link?: boolean }>;
}) => {
	const {
		title_color,
		text_color,
		bg_color,
		border_color,
		theme = "default",
		show_repo_link = true,
	} = renderOptions as Partial<CardThemeOptions & { show_repo_link?: boolean }>;
	const { titleColor, textColor, bgColor, borderColor } = getCardColors({
		title_color,
		text_color,
		icon_color: "",
		bg_color,
		border_color,
		ring_color: "",
		theme,
	});
	return `
    <svg width="${ERROR_CARD_LENGTH}"  height="120" viewBox="0 0 ${ERROR_CARD_LENGTH} 120" fill="${bgColor}" xmlns="http://www.w3.org/2000/svg">
    <style>
    .text { font: 600 16px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${titleColor} }
    .small { font: 600 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${textColor} }
    .gray { fill: #858585 }
    </style>
    <rect x="0.5" y="0.5" width="${ERROR_CARD_LENGTH - 1}" height="99%" rx="4.5" fill="${bgColor}" stroke="${borderColor}"/>
    <text x="25" y="45" class="text">Something went wrong!${UPSTREAM_API_ERRORS.includes(secondaryMessage) || !show_repo_link ? "" : " file an issue at https://tiny.one/readme-stats"}</text>
    <text data-testid="message" x="25" y="55" class="text small">
      <tspan x="25" dy="18">${encodeHTML(message)}</tspan>
      <tspan x="25" dy="18" class="gray">${secondaryMessage}</tspan>
    </text>
    </svg>
  `;
};

export const wrapTextMultiline = (text: string, width = 59, maxLines = 3) => {
	const fullWidthComma = "";
	const encoded = encodeHTML(text);
	const isChinese = encoded.includes(fullWidthComma);
	let wrapped: string[] = [];
	if (isChinese) {
		wrapped = encoded.split(fullWidthComma);
	} else {
		wrapped = wrap(encoded, { width }).split("\n");
	}
	const lines = wrapped.map((line) => line.trim()).slice(0, maxLines);
	if (wrapped.length > maxLines) {
		lines[maxLines - 1] += "...";
	}
	return lines.filter(Boolean);
};

export const noop = () => {};
export const logger =
	process.env.NODE_ENV === "test" ? { log: noop, error: noop } : console;

export const measureText = (str: string, fontSize = 10) => {
	const widths = [
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0.2796875, 0.2765625, 0.3546875, 0.5546875, 0.5546875,
		0.8890625, 0.665625, 0.190625, 0.3328125, 0.3328125, 0.3890625, 0.5828125,
		0.2765625, 0.3328125, 0.2765625, 0.3015625, 0.5546875, 0.5546875, 0.5546875,
		0.5546875, 0.5546875, 0.5546875, 0.5546875, 0.5546875, 0.5546875, 0.5546875,
		0.2765625, 0.2765625, 0.584375, 0.5828125, 0.584375, 0.5546875, 1.0140625,
		0.665625, 0.665625, 0.721875, 0.721875, 0.665625, 0.609375, 0.7765625,
		0.721875, 0.2765625, 0.5, 0.665625, 0.5546875, 0.8328125, 0.721875,
		0.7765625, 0.665625, 0.7765625, 0.721875, 0.665625, 0.609375, 0.721875,
		0.665625, 0.94375, 0.665625, 0.665625, 0.609375, 0.2765625, 0.3546875,
		0.2765625, 0.4765625, 0.5546875, 0.3328125, 0.5546875, 0.5546875, 0.5,
		0.5546875, 0.5546875, 0.2765625, 0.5546875, 0.5546875, 0.221875, 0.240625,
		0.5, 0.221875, 0.8328125, 0.5546875, 0.5546875, 0.5546875, 0.5546875,
		0.3328125, 0.5, 0.2765625, 0.5546875, 0.5, 0.721875, 0.5, 0.5, 0.5,
		0.3546875, 0.259375, 0.353125, 0.5890625,
	];
	const avg = 0.5279276315789471;
	return (
		str
			.split("")
			.map((c) =>
				c.charCodeAt(0) < widths.length ? widths[c.charCodeAt(0)] : avg,
			)
			.reduce((cur, acc) => acc + cur) * fontSize
	);
};

export const lowercaseTrim = (name: string) => name.toLowerCase().trim();

export const chunkArray = <T>(arr: T[], perChunk: number): T[][] => {
	return arr.reduce((resultArray: T[][], item, index) => {
		const chunkIndex = Math.floor(index / perChunk);
		if (!resultArray[chunkIndex]) resultArray[chunkIndex] = [];
		resultArray[chunkIndex].push(item);
		return resultArray;
	}, [] as T[][]);
};

export const parseEmojis = (str: string) => {
	if (!str) throw new Error("[parseEmoji]: str argument not provided");
	const emojiMap = toEmoji as unknown as {
		get(key: string): string | undefined;
	};
	return str.replace(/:\w+:/gm, (emoji) => {
		return emojiMap.get(emoji) || "";
	});
};

export const dateDiff = (d1: Date | string, d2: Date | string) => {
	const date1 = new Date(d1);
	const date2 = new Date(d2);
	const diff = date1.getTime() - date2.getTime();
	return Math.round(diff / (1000 * 60));
};

export const formatBytes = (bytes: number) => {
	if (bytes < 0) throw new Error("Bytes must be a non-negative number");
	if (bytes === 0) return "0 B";
	const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB"];
	const base = 1024;
	const i = Math.floor(Math.log(bytes) / Math.log(base));
	if (i >= sizes.length)
		throw new Error("Bytes is too large to convert to a human-readable string");
	return `${(bytes / base ** i).toFixed(1)} ${sizes[i]}`;
};

export default {
	ERROR_CARDLength: ERROR_CARD_LENGTH,
};
