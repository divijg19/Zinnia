// Lightweight, dependency-free SVG builder with deterministic IDs
import crypto from "node:crypto";

export type Theme = {
	background: string;
	border: string;
	stroke: string;
	ring: string;
	fire: string;
	currStreakNum: string;
	sideNums: string;
	currStreakLabel: string;
	sideLabels: string;
	dates: string;
	excludeDaysLabel?: string;
};

export type SvgInput = {
	width?: number;
	height?: number;
	title?: string;
	stats: {
		currentStreak: number;
		longestStreak: number;
		totalContributions?: number;
	};
	theme: Theme;
	localeStrings?: { current?: string; longest?: string };
	idSeed?: string;
	rtl?: boolean;
};

function stableHash(input: string, length = 10): string {
	try {
		return crypto
			.createHash("sha1")
			.update(input)
			.digest("hex")
			.slice(0, length);
	} catch {
		let h = 5381;
		for (let i = 0; i < input.length; i++) h = (h * 33) ^ input.charCodeAt(i);
		return (h >>> 0).toString(16).slice(0, length);
	}
}

function round(n: number, decimals = 3): number {
	const p = 10 ** decimals;
	return Math.round(n * p) / p;
}

function escapeXml(s: string) {
	return s.replace(/[&<>"']/g, (c) => {
		switch (c) {
			case "&":
				return "&amp;";
			case "<":
				return "&lt;";
			case ">":
				return "&gt;";
			case '"':
				return "&quot;";
			case "'":
				return "&apos;";
			default:
				return c;
		}
	});
}

export function buildStreakSvg(input: SvgInput): string {
	const width = input.width ?? 600;
	const height = input.height ?? 120;
	const seed =
		input.idSeed ?? `${input.stats.currentStreak}:${input.stats.longestStreak}`;
	const bgId = `bggrad-${stableHash(`${seed}-bg`)}`;
	const title = escapeXml(input.title ?? "GitHub Streak Stats");
	const dirAttr = input.rtl ? ' direction="rtl" dir="rtl"' : "";
	const anchor = input.rtl ? "end" : "start";

	const currLabel = escapeXml(input.localeStrings?.current ?? "Current Streak");
	const longLabel = escapeXml(input.localeStrings?.longest ?? "Longest Streak");
	const currVal = String(input.stats.currentStreak);
	const longVal = String(input.stats.longestStreak);

	// Basic layout numbers (rounded to keep outputs stable)
	const _pad = 16;
	const leftX = 24;
	const rightX = round(width / 2 + 8, 3);

	return `<?xml version="1.0" encoding="utf-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" role="img" aria-label="${title}"${dirAttr}>\n  <title>${title}</title>\n  <defs>\n    <linearGradient id="${bgId}" x1="0" x2="0" y1="0" y2="1">\n      <stop offset="0%" stop-color="${input.theme.background}" stop-opacity="1"/>\n      <stop offset="100%" stop-color="${input.theme.ring}" stop-opacity="1"/>\n    </linearGradient>\n  </defs>\n  <rect rx="8" width="100%" height="100%" fill="url(#${bgId})" stroke="${input.theme.border}" stroke-width="1"/>\n  <g transform="translate(${leftX},24)" font-family="Noto Sans, 'Segoe UI', Roboto, system-ui" font-size="20" fill="${input.theme.currStreakNum}">\n    <text x="0" y="0" text-anchor="${anchor}" dominant-baseline="hanging" font-size="14" fill="${input.theme.sideLabels}">${currLabel}</text>\n    <text x="0" y="22" text-anchor="${anchor}" font-size="36" fill="${input.theme.currStreakNum}">${currVal}</text>\n  </g>\n  <g transform="translate(${rightX},24)" font-family="Noto Sans, 'Segoe UI', Roboto, system-ui" font-size="20" fill="${input.theme.sideNums}">\n    <text x="0" y="0" text-anchor="${anchor}" dominant-baseline="hanging" font-size="14" fill="${input.theme.sideLabels}">${longLabel}</text>\n    <text x="0" y="22" text-anchor="${anchor}" font-size="36" fill="${input.theme.sideNums}">${longVal}</text>\n  </g>\n</svg>`;
}

export { escapeXml, round as roundNumber };
