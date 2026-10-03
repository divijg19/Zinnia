import { describe, expect, it } from "vitest";
// Import the core from source, as `leetcode/test/generator.test.ts` does. The
// `dist/` bundle is a build artifact: the lint job type-checks before any build
// runs, so reaching into it fails CI even though it works after `bun run build`.
import {
	AnimationExtension,
	Generator,
	ThemeExtension,
} from "../../leetcode/packages/core/src/index";
import { renderStatsCard } from "../../stats/src/cards/stats";
import { renderTopLanguages } from "../../stats/src/cards/top-languages";
import type { Theme } from "../../trophy/src/theme";
import { COLORS } from "../../trophy/src/theme";
import { RANK } from "../../trophy/src/utils";

/**
 * Invariants every generated card must satisfy.
 *
 * These exist because of a real production failure: the LeetCode card shipped a
 * stylesheet with one more `}` than `{`. The stray brace landed immediately
 * before the watchdog theme's `:root` block, so a CSS parser failed there and
 * discarded the palette - the card rendered as a white rectangle with most of its
 * content invisible. Everything here is cheap to check and would have caught it.
 */

/** `true` when every `<style>` block's braces balance and never go negative. */
function styleBlocksBalanced(svg: string): boolean {
	return styleBlocks(svg).every((block) => {
		let depth = 0;
		for (const ch of block) {
			if (ch === "{") depth += 1;
			else if (ch === "}") {
				depth -= 1;
				if (depth < 0) return false;
			}
		}
		return depth === 0;
	});
}

function styleBlocks(svg: string): string[] {
	return [...svg.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(
		(m) => m[1] as string,
	);
}

/**
 * `opacity: 0` declarations that are *not* keyframe frames.
 *
 * A base `opacity: 0` means the element is invisible unless something else
 * reveals it - which is how a card ends up blank wherever animations do not run.
 */
function baseHiddenDeclarations(svg: string): string[] {
	return styleBlocks(svg).flatMap((block) => {
		const withoutKeyframes = block.replace(
			/@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\}\s*)*[^{}]*\}/g,
			"",
		);
		return [...withoutKeyframes.matchAll(/([^{}]*)\{opacity:\s*0\s*[;}]/g)].map(
			(m) => (m[1] as string).trim(),
		);
	});
}

/** Fill modes that pin an element to its animated end state. */
function forwardsFillModes(svg: string): string[] {
	return styleBlocks(svg).flatMap((block) =>
		[...block.matchAll(/animation:[^;}]*forwards/g)].map((m) => m[0] as string),
	);
}

const STATS_MODEL = {
	name: "Alice",
	totalStars: 1,
	totalCommits: 2,
	totalIssues: 3,
	totalPRs: 4,
	totalPRsMerged: 0,
	mergedPRsPercentage: 0,
	totalReviews: 0,
	totalDiscussionsStarted: 0,
	totalDiscussionsAnswered: 0,
	contributedTo: 0,
	rank: { level: "A", percentile: 12 },
};

const LANGS = {
	HTML: { name: "HTML", color: "#e34c26", size: 200 },
	javascript: { name: "javascript", color: "#f1e05a", size: 200 },
	css: { name: "css", color: "#563d7c", size: 100 },
};

async function renderLeetcodeCard(): Promise<string> {
	const original = globalThis.fetch;
	globalThis.fetch = (async () => ({
		ok: true,
		json: async () => ({
			data: {
				matchedUser: {
					username: "alice",
					profile: {
						ranking: 1,
						reputation: 1,
						solutions: {
							numSolved: 3,
							easySolved: 1,
							mediumSolved: 1,
							hardSolved: 1,
						},
					},
				},
				user: {
					username: "alice",
					submitStats: {
						acSubmissionNum: [
							{ difficulty: "All", count: 3, submissions: 3 },
							{ difficulty: "Easy", count: 1, submissions: 1 },
							{ difficulty: "Medium", count: 1, submissions: 1 },
							{ difficulty: "Hard", count: 1, submissions: 1 },
						],
					},
				},
			},
		}),
	})) as unknown as typeof fetch;
	try {
		const gen = new Generator(null as never, {});
		gen.verbose = false;
		return await gen.generate({
			username: "alice",
			site: "us",
			width: 500,
			height: 200,
			css: [],
			extensions: [ThemeExtension, AnimationExtension],
			font: "baloo_2",
			animation: true,
			theme: { light: "light", dark: "dark" },
			cache: 60,
		} as never);
	} finally {
		globalThis.fetch = original;
	}
}

describe("generated cards keep their stylesheet well-formed", () => {
	it("stats: balanced, nothing hidden by default, no forwards fill", () => {
		const svg = renderStatsCard(
			STATS_MODEL as never,
			{
				hide_title: false,
				show_icons: true,
			} as never,
		);
		expect(styleBlocksBalanced(svg)).toBe(true);
		expect(baseHiddenDeclarations(svg)).toEqual([]);
		expect(forwardsFillModes(svg)).toEqual([]);
	});

	it("top-langs: balanced, nothing hidden by default, no forwards fill", () => {
		const svg = renderTopLanguages(
			LANGS as never,
			{
				layout: "compact",
				hide_title: false,
			} as never,
		);
		expect(styleBlocksBalanced(svg)).toBe(true);
		expect(baseHiddenDeclarations(svg)).toEqual([]);
		expect(forwardsFillModes(svg)).toEqual([]);
	});

	it("leetcode: balanced, nothing hidden by default, no forwards fill", async () => {
		const svg = await renderLeetcodeCard();
		expect(styleBlocksBalanced(svg)).toBe(true);
		expect(baseHiddenDeclarations(svg)).toEqual([]);
		expect(forwardsFillModes(svg)).toEqual([]);
		expect(svg).not.toContain("NaN");
	});

	it("regression: the animation stylesheet has no stray closing brace", () => {
		// The defect was one extra `}` at the end of the reduced-motion block,
		// which landed directly on top of the theme's `:root` rules.
		const css = animationCss({ solved: 3, total: 9 });
		let depth = 0;
		for (const ch of css) {
			if (ch === "{") depth += 1;
			else if (ch === "}") {
				depth -= 1;
				expect(depth, "unbalanced } in animation CSS").toBeGreaterThanOrEqual(
					0,
				);
			}
		}
		expect(depth).toBe(0);
	});
});

describe("animated properties keep their final value in the base style", () => {
	it("stats: .rank-circle carries its final stroke-dashoffset", () => {
		const svg = renderStatsCard(
			STATS_MODEL as never,
			{
				hide_title: false,
			} as never,
		);
		const rule = /\.rank-circle\s*\{([^}]*)\}/.exec(svg)?.[1] ?? "";
		// Without this the rank progress lived only in the keyframe's `to` frame,
		// so switching to `backwards` silently erased the indicator.
		expect(rule).toMatch(/stroke-dashoffset:\s*[\d.]+/);
	});

	it("leetcode: the ring carries its final stroke-dasharray in the base style", async () => {
		const svg = await renderLeetcodeCard();
		expect(
			/#total-solved-ring\{[^}]*stroke-dasharray:\s*[\d.]+\s+10000/.test(svg),
		).toBe(true);
	});

	it("trophy: progress bars have a base width, not one that only exists mid-animation", async () => {
		const { getNextRankBar } = await import("../../trophy/src/icons");
		const svg = getNextRankBar("Followers", 0.5, "#0366d6");
		const rect =
			/<rect[^>]*id="[^"]*-rank-progress"[^>]*>/.exec(svg)?.[0] ?? "";
		expect(rect).toMatch(/width="[\d.]+"/);
		expect(forwardsFillModes(svg)).toEqual([]);
	});
});

/** A real adapted trophy theme, the way the renderer resolves one. */
const trophyTheme = (): Theme =>
	(COLORS.watchdog ?? Object.values(COLORS)[0]) as Theme;

describe("trophy identifiers are document-unique", () => {
	it("two cells sharing a rank do not emit duplicate gradient ids", async () => {
		const { getTrophyIcon } = await import("../../trophy/src/icons");
		const theme = trophyTheme();
		const svg = `${getTrophyIcon(theme, RANK.B, "Followers")}${getTrophyIcon(
			theme,
			RANK.B,
			"Experience",
		)}`;
		const ids = [...svg.matchAll(/<linearGradient id="([^"]+)"/g)].map(
			(m) => m[1] as string,
		);
		expect(new Set(ids).size).toBe(ids.length);
		// Both fills must resolve to an id that is actually defined.
		for (const m of svg.matchAll(/fill="url\(#([^)]+)\)"/g)) {
			expect(ids).toContain(m[1] as string);
		}
	});

	it("falls back to a usable id when the label has nothing safe left", async () => {
		const { getTrophyIcon } = await import("../../trophy/src/icons");
		const svg = getTrophyIcon(trophyTheme(), RANK.A, "!!!");
		const id = /<linearGradient id="([^"]+)"/.exec(svg)?.[1] ?? "";
		expect(id).toMatch(/^rank-A-[A-Za-z0-9_-]+$/);
	});
});

/** The animation stylesheet the extension emits, for the brace-balance test. */
function animationCss({ solved, total }: { solved: number; total: number }) {
	const styles: string[] = [];
	const gen = { config: { animation: true } };
	const body = {
		problem: {
			easy: { total, solved },
			medium: { total, solved },
			hard: { total, solved },
		},
	};
	void AnimationExtension()(
		gen as never,
		body as never,
		{} as never,
		styles as never,
	);
	return styles.join("\n");
}
