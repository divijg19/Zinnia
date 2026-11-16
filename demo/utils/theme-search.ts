import type { DemoTheme } from "../types.js";
import {
	facetLabel,
	facetsOf,
	familyOf,
	isFilterQuery,
	sectionOf,
} from "./theme-taxonomy.js";

/**
 * Theme search.
 *
 * Three modes, one ranking:
 *
 * - **substring** - the fast path. The query appears in the name or the
 *   display name; the match position is the score.
 * - **regex** - the query is written `/pattern/flags`. An invalid pattern falls
 *   back to a literal search rather than throwing.
 * - **fuzzy** - the query is a subsequence of the name, scored the way an
 *   editor scores a jump: consecutive characters and word boundaries are worth
 *   more, gaps and a late first match cost.
 *
 * The registry holds 96 themes, so the search is a single linear pass over a
 * precomputed index. No worker, no debounce, no dependency: at this size the
 * scan costs less than the keystroke that triggered it.
 */

/** A theme with the fields the matcher reads, normalized once. */
type IndexedTheme = {
	theme: DemoTheme;
	name: string;
	displayName: string;
	lowerName: string;
	lowerDisplayName: string;
	/** True where a word starts: after `_` or `-`, or at a camelCase hump. */
	boundaries: boolean[];
	/** The family the theme belongs to, lowercased. */
	family: string;
	/** The words the qualities and the section of the theme answer to. */
	words: string[];
};

export type SearchIndex = IndexedTheme[];

/**
 * How a theme matched.
 *
 * The kind outranks the score: an exact match beats a better fuzzy match,
 * every time. `facet` is last: it matches the qualities of a theme rather
 * than its name, so it never outranks a name the user can see.
 */
export type MatchKind = "exact" | "prefix" | "substring" | "fuzzy" | "facet";

/** A theme that matched, best first. */
export type ThemeMatch = {
	theme: DemoTheme;
	/** 0..1, higher is better. Only comparable within a kind. */
	score: number;
	/** Indices into the theme name, for highlighting. */
	matches: number[];
	kind: MatchKind;
};

const SCORE_MATCH = 16;
const SCORE_CONSECUTIVE = 8;
const SCORE_BOUNDARY = 8;
const SCORE_FIRST = 12;
const PENALTY_GAP = -3;
const PENALTY_MAX_GAP = -10;
const PENALTY_LEADING = -1;
const PENALTY_MAX_LEADING = -12;

/** Build the search index for a registry. Called once, when it loads. */
export function buildSearchIndex(themes: DemoTheme[]): SearchIndex {
	return themes.map((theme) => {
		const name = theme.name;
		const displayName = theme.displayName || name;
		const boundaries = new Array<boolean>(name.length).fill(false);
		for (let i = 0; i < name.length; i++) {
			const previous = name[i - 1];
			const current = name[i];
			if (i === 0) {
				boundaries[i] = true;
			} else if (previous === "_" || previous === "-") {
				boundaries[i] = true;
			} else if (
				previous !== undefined &&
				previous === previous.toLowerCase() &&
				current !== undefined &&
				current === current.toUpperCase() &&
				current !== current.toLowerCase()
			) {
				// a camelCase hump: `catppuccinMocha`
				boundaries[i] = true;
			}
		}
		return {
			theme,
			name,
			displayName,
			lowerName: name.toLowerCase(),
			lowerDisplayName: displayName.toLowerCase(),
			boundaries,
			family: familyOf(theme).toLowerCase(),
			words: filterWords(theme),
		};
	});
}

/** Parse `/pattern/flags` into a regular expression, or null. */
function parseRegex(query: string): RegExp | null {
	const match = /^\/(.+)\/([gimsuy]*)$/.exec(query);
	if (!match) return null;
	const pattern = match[1];
	const flags = match[2] ?? "";
	if (pattern === undefined) return null;
	try {
		return new RegExp(pattern, flags.replace("g", ""));
	} catch {
		// An invalid pattern is not an error: the query is read as a literal.
		return null;
	}
}

/** The characters a fuzzy match lined up, and what they are worth. */
function fuzzyMatch(
	entry: IndexedTheme,
	query: string,
): { score: number; indices: number[] } | null {
	const text = entry.lowerName;
	const indices: number[] = [];
	let score = 0;
	let queryIndex = 0;
	let textIndex = 0;
	let previousIndex = -1;
	let firstIndex = 0;

	while (queryIndex < query.length && textIndex < text.length) {
		if (text[textIndex] === query[queryIndex]) {
			indices.push(textIndex);
			score += SCORE_MATCH;
			if (previousIndex === textIndex - 1) score += SCORE_CONSECUTIVE;
			if (entry.boundaries[textIndex]) score += SCORE_BOUNDARY;
			if (queryIndex === 0) {
				score += SCORE_FIRST;
				firstIndex = textIndex;
			}
			previousIndex = textIndex;
			queryIndex++;
		}
		textIndex++;
	}
	if (queryIndex < query.length) return null;

	// A match that starts late, or that skips a lot, is a weaker match.
	score += Math.max(PENALTY_MAX_LEADING, PENALTY_LEADING * firstIndex);
	for (let i = 1; i < indices.length; i++) {
		const gap = (indices[i] ?? 0) - (indices[i - 1] ?? 0) - 1;
		score += Math.max(PENALTY_MAX_GAP, PENALTY_GAP * gap);
	}

	// Normalize against the best a match of this length could score.
	const best =
		query.length *
		(SCORE_MATCH + SCORE_CONSECUTIVE + SCORE_BOUNDARY + SCORE_FIRST);
	return { score: best > 0 ? Math.min(1, score / best) : 0, indices };
}

/** Score one theme against a query, or null when it does not match. */
function scoreEntry(
	entry: IndexedTheme,
	query: string,
	regex: RegExp | null,
): ThemeMatch | null {
	if (regex) {
		const match = regex.exec(entry.name) ?? regex.exec(entry.displayName);
		if (!match) return null;
		const start = match.index;
		return {
			theme: entry.theme,
			score: 1,
			matches: Array.from({ length: match[0].length }, (_, i) => start + i),
			kind: "substring",
		};
	}

	const everyIndex = entry.name.split("").map((_, i) => i);
	if (entry.lowerName === query) {
		return { theme: entry.theme, score: 1, matches: everyIndex, kind: "exact" };
	}
	if (entry.lowerName.startsWith(query)) {
		return {
			theme: entry.theme,
			score: 1,
			matches: Array.from({ length: query.length }, (_, i) => i),
			kind: "prefix",
		};
	}
	const at = entry.lowerName.indexOf(query);
	if (at !== -1) {
		return {
			theme: entry.theme,
			score: 1 - at / Math.max(1, entry.lowerName.length),
			matches: Array.from({ length: query.length }, (_, i) => at + i),
			kind: "substring",
		};
	}
	// The display name is a second name for the same theme: it can match, but
	// its characters say nothing about where the theme name is highlighted.
	if (entry.lowerDisplayName === query) {
		return { theme: entry.theme, score: 1, matches: [], kind: "exact" };
	}
	const displayAt = entry.lowerDisplayName.indexOf(query);
	if (displayAt !== -1) {
		return {
			theme: entry.theme,
			score: 1 - displayAt / Math.max(1, entry.lowerDisplayName.length),
			matches: [],
			kind: "substring",
		};
	}
	const fuzzy = fuzzyMatch(entry, query);
	if (fuzzy) {
		return {
			theme: entry.theme,
			score: fuzzy.score,
			matches: fuzzy.indices,
			kind: "fuzzy",
		};
	}

	// The qualities of a theme are names too: a query that picks a filter by
	// clicking has to pick it by typing.
	if (entry.family.includes(query) || matchesFilter(entry, query)) {
		return { theme: entry.theme, score: 0, matches: [], kind: "facet" };
	}
	return null;
}

/** Whether the query is asking for a quality or a section this theme has. */
function matchesFilter(entry: IndexedTheme, query: string): boolean {
	if (!isFilterQuery(query)) return false;
	return entry.words.includes(query);
}

/**
 * The words a theme answers to beyond its name: the labels of the facets it
 * carries, and the name of the section it is grouped into.
 */
function filterWords(theme: DemoTheme): string[] {
	const words = new Set<string>();
	for (const facet of facetsOf(theme)) {
		words.add(facetLabel(facet).toLowerCase());
	}
	for (const word of sectionOf(theme)
		.toLowerCase()
		.split(/[\s&]+/)) {
		words.add(word);
	}
	return [...words];
}

/**
 * Search the index.
 *
 * An empty query matches everything, in registry order: an empty search box
 * should show the gallery, not nothing.
 */
export function searchThemes(index: SearchIndex, query: string): ThemeMatch[] {
	const trimmed = query.trim();
	if (!trimmed) {
		return index.map((entry) => ({
			theme: entry.theme,
			score: 1,
			matches: [],
			kind: "exact" as const,
		}));
	}

	const regex = parseRegex(trimmed);
	const needle = regex ? trimmed : trimmed.toLowerCase();
	const matches: ThemeMatch[] = [];
	const rank = kindRank(trimmed);

	for (const entry of index) {
		const scored = scoreEntry(entry, needle, regex);
		if (scored) matches.push(scored);
	}

	matches.sort((a, b) => {
		const byKind = rank[a.kind] - rank[b.kind];
		if (byKind !== 0) return byKind;
		if (b.score !== a.score) return b.score - a.score;
		const byLength = a.theme.name.length - b.theme.name.length;
		if (byLength !== 0) return byLength;
		return a.theme.name.localeCompare(b.theme.name);
	});
	return matches;
}

/**
 * How the kinds rank for a query.
 *
 * A query that asks for a quality - a word that picks a filter - is answered
 * by the qualities before it is answered by a lucky subsequence of a name.
 */
function kindRank(query: string): Record<MatchKind, number> {
	if (isFilterQuery(query)) {
		return { exact: 0, prefix: 1, substring: 2, facet: 3, fuzzy: 4 };
	}
	return { exact: 0, prefix: 1, substring: 2, fuzzy: 3, facet: 4 };
}
