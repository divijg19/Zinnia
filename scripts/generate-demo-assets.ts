import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderLeetCode } from "../demo/renderers/leetcode.js";
import { renderStats } from "../demo/renderers/stats.js";
import { renderStreak } from "../demo/renderers/streak.js";
import { renderTopLangs } from "../demo/renderers/toplangs.js";
import { renderTrophy } from "../demo/renderers/trophy.js";
import type { FetchedData } from "../leetcode/packages/core/src/types.js";
import { type ThemeDefinition, themes } from "../lib/themes/registry.ts";
import type { StatsData, TopLangData } from "../stats/src/fetchers/types.js";
import { normalizeThemeName } from "../streak/src/card_helpers.ts";
import type { Stats } from "../streak/src/stats.js";
import type { UserInfo } from "../trophy/src/user_info.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, "..");
const demoDir = resolve(rootDir, "demo");
const svgDir = resolve(demoDir, "assets");

/** The widgets the demo renders for every theme. */
const WIDGET_KINDS = [
	"stats",
	"topLangs",
	"streak",
	"trophy",
	"leetcode",
] as const;

type WidgetKind = (typeof WIDGET_KINDS)[number];

/** Where a rendered card lives, and how big it is. */
type WidgetAsset = {
	src: string;
	width: number;
	height: number;
};

/** A theme alias: two registry names that resolve to the same theme. */
type ThemeAlias = {
	theme: string;
	normalized: string;
	note: string;
};

function extractPreviewColors(def: ThemeDefinition): [string, string, string] {
	const colors = def.colors || {};

	const primary =
		colors.title?.hex || colors.icon?.hex || colors.primary?.hex || "2f80ed";
	const bg =
		(colors.background && "hex" in colors.background
			? colors.background.hex
			: undefined) || "fffefe";
	const accent =
		colors.icon?.hex || colors.primary?.hex || colors.title?.hex || "4c71f2";

	const fmt = (c: string) => (c.startsWith("#") ? c : `#${c}`);

	return [fmt(primary), fmt(bg), fmt(accent)];
}

const STATS_FIXTURE = {
	name: "demo",
	totalStars: 1234,
	totalCommits: 5678,
	totalIssues: 42,
	totalPRs: 128,
	totalPRsMerged: 96,
	mergedPRsPercentage: 75,
	totalReviews: 64,
	totalDiscussionsStarted: 10,
	totalDiscussionsAnswered: 25,
	contributedTo: 15,
	rank: { level: "A+", percentile: 12 },
};

const STREAK_FIXTURE = {
	mode: "daily",
	totalContributions: 2048,
	firstContribution: "2016-08-10",
	longestStreak: { start: "2021-12-19", end: "2022-03-14", length: 86 },
	currentStreak: { start: "2026-09-01", end: "2026-09-16", length: 16 },
	excludedDays: [],
};

// Showcase fixture engineered so the demo trophy card exercises every
// visible rank tier plus one secret trophy in a compact 3x3 grid:
// Stars=15 -> B, Commits=4500 -> SSS, Followers=450 -> SS,
// Reviews=150 -> AAA, Repos=35 -> AA, Issues=25 -> A, PRs=5 -> C,
// Experience (durationDays=42) -> S, plus the MultipleLang secret via
// languageCount=12. AllSuperRank is intentionally absent: it requires
// every base rank to start with S, which is mutually exclusive with a
// B/C spectrum.
const TROPHY_FIXTURE = {
	totalStargazers: 15,
	totalCommits: 4500,
	totalFollowers: 450,
	totalIssues: 25,
	totalPullRequests: 5,
	totalRepositories: 35,
	totalReviews: 150,
	languageCount: 12,
	durationYear: 3,
	durationDays: 42,
	ancientAccount: 0,
	ogAccount: 0,
	joined2020: 0,
	totalOrganizations: 2,
};

const LEETCODE_FIXTURE = {
	profile: {
		username: "demouser",
		realname: "Demo User",
		about: "About",
		avatar: "https://example.com/avatar.png",
		skills: ["arrays"],
		country: "IN",
	},
	problem: {
		easy: { solved: 500, total: 809 },
		medium: { solved: 600, total: 677 },
		hard: { solved: 134, total: 764 },
		ranking: 12345,
	},
	submissions: [],
	contest: undefined,
};

// Six languages with varied sizes exercise the donut/progress layouts,
// language colors, and theme color application in the top-languages card.
const TOPLANGS_FIXTURE = {
	TypeScript: { name: "TypeScript", color: "#3178c6", size: 45000 },
	JavaScript: { name: "JavaScript", color: "#f1e05a", size: 30000 },
	Python: { name: "Python", color: "#3572A5", size: 15000 },
	Rust: { name: "Rust", color: "#dea584", size: 8000 },
	Go: { name: "Go", color: "#00ADD8", size: 4000 },
	Shell: { name: "Shell", color: "#89e051", size: 1000 },
};

/** The fixture each card renders from. */
type MockData = {
	stats: StatsData;
	topLangs: TopLangData;
	streak: Stats;
	trophy: UserInfo;
	leetcode: FetchedData;
};

/**
 * Render one card for one theme.
 *
 * A switch rather than a map of renderers: each card takes its own fixture
 * type, and a map would have to erase that to hold them all.
 */
async function renderCard(
	kind: WidgetKind,
	theme: ThemeDefinition,
	data: MockData,
): Promise<string> {
	switch (kind) {
		case "stats":
			return renderStats(theme, data.stats);
		case "topLangs":
			return renderTopLangs(theme, data.topLangs);
		case "streak":
			return renderStreak(theme, data.streak);
		case "trophy":
			return renderTrophy(theme, data.trophy);
		case "leetcode":
			return renderLeetCode(theme, data.leetcode);
	}
}

function assertValidSvg(
	svg: unknown,
	kind: string,
	name: string,
): asserts svg is string {
	if (typeof svg !== "string" || !svg.includes("<svg")) {
		throw new Error(`${kind} render for ${name} produced no SVG`);
	}
	if (svg.includes("NaN") || svg.includes("undefined")) {
		throw new Error(`${kind} render for ${name} contains invalid tokens`);
	}
}

const mockData: MockData = {
	stats: STATS_FIXTURE,
	topLangs: TOPLANGS_FIXTURE,
	streak: STREAK_FIXTURE,
	trophy: TROPHY_FIXTURE,
	leetcode: LEETCODE_FIXTURE,
};

const originalFetch = globalThis.fetch;
globalThis.fetch = () => {
	throw new Error("Network access is forbidden during demo asset generation");
};

const themeRegistry: Record<string, unknown>[] = [];
const assets: Record<string, Partial<Record<WidgetKind, WidgetAsset>>> = {};
const aliases: ThemeAlias[] = [];

// Detect streak name collisions in registry order with the same
// normalization the runtime uses, so the recorded winner always matches
// runtime first-wins resolution (lib/themes/adapters/streak.ts).
{
	const seenStreak = new Set();
	for (const name of Object.keys(themes)) {
		const normalized = normalizeThemeName(name);
		const streakKey = `streak:${normalized}`;
		if (seenStreak.has(streakKey)) {
			aliases.push({
				theme: name,
				normalized,
				note: "streak lookup normalizes _ to -, so this theme resolves to the earlier-registered theme at runtime",
			});
		} else {
			seenStreak.add(streakKey);
		}
	}
}

try {
	mkdirSync(svgDir, { recursive: true });

	const entries = Object.entries(themes).sort(([a], [b]) => a.localeCompare(b));

	for (const [name, def] of entries) {
		const widgets: Partial<Record<WidgetKind, WidgetAsset>> = {};
		assets[name] = widgets;
		for (const kind of WIDGET_KINDS) {
			const svg = await renderCard(kind, def, mockData);
			assertValidSvg(svg, kind, name);
			const file = `${name}-${kind}.svg`;
			writeFileSync(join(svgDir, file), svg);
			const widthMatch = svg.match(/<svg[^>]*\bwidth="(\d+)"/);
			const heightMatch = svg.match(/<svg[^>]*\bheight="(\d+)"/);
			widgets[kind] = {
				src: `./assets/${file}`,
				width: Number(widthMatch?.[1] ?? 495),
				height: Number(heightMatch?.[1] ?? 195),
			};
		}

		themeRegistry.push({
			name,
			displayName: def.displayName || name,
			previewColors: extractPreviewColors(def),
			colors: def.colors,
			...(def.streak && { streak: def.streak }),
			...(def.trophy && { trophy: def.trophy }),
			...(def.leetcode && { leetcode: def.leetcode }),
			widgets,
		});
	}

	if (aliases.length > 0) {
		console.warn("Theme name alias collisions (normalized names collide):");
		for (const a of aliases) {
			console.warn(`  - ${a.theme} (${a.normalized}): ${a.note}`);
		}
	}

	// Completeness gate: every theme must render every widget kind, so a
	// silently missing card can never reach the demo tabs.
	for (const [name] of entries) {
		for (const kind of WIDGET_KINDS) {
			const asset = assets[name]?.[kind];
			if (!asset?.src) {
				throw new Error(`missing ${kind} asset for theme '${name}'`);
			}
		}
	}
} finally {
	globalThis.fetch = originalFetch;
}

writeFileSync(
	join(demoDir, "theme-registry.json"),
	JSON.stringify({ themes: themeRegistry, aliases }, null, 2),
);

console.log(`Generated demo assets in ${demoDir}:`);
console.log(`  - theme-registry.json (${themeRegistry.length} themes)`);
console.log(`  - SVG assets in demo/assets/`);
