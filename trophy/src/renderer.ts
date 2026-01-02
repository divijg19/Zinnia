// Vendored and adapted rendering logic inspired by ryo-ma's "github-profile-trophy" project.
// Original project: https://github.com/ryo-ma/github-profile-trophy
// License: MIT — see ../../LICENSE
// The implementation below is adapted for this repository and kept dependency-free.

import {
	normalizeHexToken,
	parseBackgroundToken,
} from "../../lib/theme-helpers.ts";
import { Card } from "./card.ts";
import { GithubApiService } from "./Services/GithubApiService.ts";
import type { Theme } from "./theme.ts";
import { COLORS } from "./theme.ts";

type TrophyConfig = {
	username: string;
	theme?: string;
	title?: string;
	columns?: number;
};

function _getTheme(themeName?: string): {
	bg: string;
	fg: string;
	accent: string;
} {
	const t = COLORS[themeName ?? "flat"] || COLORS.flat;
	if (!t) {
		return { bg: "#ffffff", fg: "#000000", accent: "#000000" };
	}
	return {
		bg: String(t.BACKGROUND),
		fg: String(t.TITLE),
		accent: String(t.NEXT_RANK_BAR),
	};
}

function normalizeHex(hex?: string | null): string | null {
	return normalizeHexToken(hex);
}

function _parseBackground(bgRaw?: string | null) {
	const raw = String(bgRaw ?? "").trim();
	if (!raw) return { defs: "", fill: "#ffffff" };

	// If it's a gradient-like token, delegate to shared parser
	if (raw.includes(",")) {
		const parsed = parseBackgroundToken(raw);
		if (parsed) {
			// preserve legacy id `bgGrad` for trophy snapshots/compat
			const legacyId = "bgGrad";
			let defWithLegacyId = parsed.def.replace(parsed.id, legacyId);
			// remove gradientUnits for legacy snapshot formatting
			defWithLegacyId = defWithLegacyId.replace(
				/ gradientUnits=['"][^'"]+['"]/i,
				"",
			);
			// normalize quotes to double quotes and collapse newlines/spaces for snapshot stability
			defWithLegacyId = defWithLegacyId
				.replace(/'/g, '"')
				.replace(/\n\s*/g, "");
			const defs = `<defs>${defWithLegacyId}</defs>`;
			return { defs, fill: `url(#${legacyId})` };
		}
	}

	const color = normalizeHex(raw) ?? "#ffffff";
	return { defs: "", fill: color };
}

export function renderTrophySVG(cfg: TrophyConfig): string {
	// Produce a visual placeholder using canonical Card/Trophy rendering so
	// the snapshot visually matches upstream's layout. This avoids a
	// lightweight, non-canonical grid used previously.
	const { theme: themeName, title, columns = -1 } = cfg;
	const theme = ((COLORS as Record<string, Theme>)[themeName ?? "flat"] ??
		(COLORS as Record<string, Theme>).flat) as Theme;

	const titles = (title || "").split(",").filter(Boolean);
	const ranks: string[] = [];
	const columnRaw = Number(columns);
	const column =
		Number.isFinite(columnRaw) && columnRaw === -1
			? -1
			: Number.isFinite(columnRaw) && columnRaw > 0
				? columnRaw
				: -1;
	const row = -1;
	const marginW = 0;
	const marginH = 0;
	const noBg = false;
	const noFrame = false;

	// Render using Card with a minimal placeholder user info object to avoid
	// making network calls. Fields chosen to provide reasonable visuals.
	const placeholderUser = {
		totalStargazers: 7200,
		totalCommits: 4200,
		totalFollowers: 500,
		totalIssues: 240,
		totalPullRequests: 300,
		totalRepositories: 120,
		totalReviews: 80,
		languageCount: 12,
		durationYear: 12,
		durationDays: 4500,
		ancientAccount: 1,
		joined2020: 1,
		ogAccount: 1,
		totalOrganizations: 5,
	} as any;

	const card = new Card(
		titles,
		ranks,
		column,
		row,
		110,
		marginW,
		marginH,
		noBg,
		noFrame,
	);
	return card.render(placeholderUser, theme);
}

// Convenience compatibility export used by `api/trophy`.
// Signature: renderLocalTrophy(username, token, params)
export async function renderLocalTrophy(
	username: string,
	_token: string,
	params: URLSearchParams,
) {
	const _title = params.get("title") || undefined;
	const colsRaw = Number(params.get("columns") || params.get("cols") || "-1");
	const cols =
		Number.isFinite(colsRaw) && colsRaw === -1
			? -1
			: Number.isFinite(colsRaw) && colsRaw > 0
				? colsRaw
				: -1;
	const themeName = params.get("theme") || undefined;
	const theme = ((COLORS as Record<string, Theme>)[themeName ?? "flat"] ??
		(COLORS as Record<string, Theme>).flat) as Theme;

	const titles = (params.get("title") || "").split(",").filter(Boolean);
	const ranks = (params.get("rank") || "").split(",").filter(Boolean);
	const columnRaw = Number(params.get("column") || cols || "-1");
	const column = Number.isFinite(columnRaw) ? columnRaw : cols;
	const rowRaw = Number(params.get("row") || params.get("rows") || "-1");
	const row = Number.isFinite(rowRaw) ? rowRaw : -1;
	const marginW = Number(params.get("margin-w") || "0");
	const marginH = Number(params.get("margin-h") || "0");
	const noBg = params.get("no-bg") === "true";
	const noFrame = params.get("no-frame") === "true";

	const service = new GithubApiService(_token || "");
	const userInfoOrError = await service.requestUserInfo(username);
	if (userInfoOrError instanceof Error) {
		throw userInfoOrError;
	}

	const card = new Card(
		titles,
		ranks,
		column,
		row,
		110,
		marginW,
		marginH,
		noBg,
		noFrame,
	);

	return card.render(userInfoOrError, theme);
}
