import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderLeetCode } from "../demo/adapters/leetcode.js";
import { renderStats } from "../demo/adapters/stats.js";
import { renderStreak } from "../demo/adapters/streak.js";
import { renderTopLangs } from "../demo/adapters/toplangs.js";
import { renderTrophy } from "../demo/adapters/trophy.js";
import { themes } from "../lib/themes/registry.ts";
import { normalizeThemeName } from "../streak/src/card_helpers.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, "..");
const demoDir = resolve(rootDir, "demo");
const svgDir = resolve(demoDir, "assets");

function extractPreviewColors(def) {
	const colors = def.colors || {};

	const primary =
		colors.title?.hex || colors.icon?.hex || colors.primary?.hex || "2f80ed";
	const bg = colors.background?.hex || "fffefe";
	const accent =
		colors.icon?.hex || colors.primary?.hex || colors.title?.hex || "4c71f2";

	const fmt = (c) => (c.startsWith("#") ? c : `#${c}`);

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

const RENDERERS = {
	stats: renderStats,
	topLangs: renderTopLangs,
	streak: renderStreak,
	trophy: renderTrophy,
	leetcode: renderLeetCode,
};

function assertValidSvg(svg, kind, name) {
	if (typeof svg !== "string" || !svg.includes("<svg")) {
		throw new Error(`${kind} render for ${name} produced no SVG`);
	}
	if (svg.includes("NaN") || svg.includes("undefined")) {
		throw new Error(`${kind} render for ${name} contains invalid tokens`);
	}
}

const mockData = {
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

const themeRegistry = [];
const assets = {};
const aliases = [];

// Detect streak name collisions in registry order with the same
// normalization the runtime uses, so the recorded winner always matches
// runtime first-wins resolution (streak/src/themes.ts).
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
		assets[name] = {};
		for (const [kind, render] of Object.entries(RENDERERS)) {
			const svg = await render(def, mockData[kind]);
			assertValidSvg(svg, kind, name);
			const file = `${name}-${kind}.svg`;
			writeFileSync(join(svgDir, file), svg);
			const widthMatch = svg.match(/<svg[^>]*\bwidth="(\d+)"/);
			const heightMatch = svg.match(/<svg[^>]*\bheight="(\d+)"/);
			assets[name][kind] = {
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
			widgets: assets[name],
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
	const expectedKinds = Object.keys(RENDERERS);
	for (const [name] of entries) {
		for (const kind of expectedKinds) {
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

writeFileSync(join(demoDir, "mock-data.json"), JSON.stringify(mockData));

console.log(`Generated demo assets in ${demoDir}:`);
console.log(`  - theme-registry.json (${themeRegistry.length} themes)`);
console.log(`  - mock-data.json`);
console.log(`  - SVG assets in demo/assets/`);
