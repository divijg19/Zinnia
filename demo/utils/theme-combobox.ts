import type { DemoTheme } from "../types.js";
import { highlightMatches } from "./html.js";
import {
	getModifierTags,
	groupOf,
	MODIFIER_OPTIONS,
	type ThemeGroup,
} from "./theme-groups.js";
import {
	type SearchIndex,
	searchThemes,
	type ThemeMatch,
} from "./theme-search.js";

/**
 * The theme search box.
 *
 * The WAI-ARIA combobox pattern: a text input that owns a listbox of
 * suggestions. The suggestions show the rendered card, not just a name, so the
 * theme is picked by what it looks like, and they are grouped by category so
 * a long list can be read.
 */

export type ThemeComboboxOptions = {
	/** The search input. */
	input: HTMLInputElement;
	/** The listbox the suggestions are rendered into. */
	list: HTMLElement;
	/** The search index, built once from the registry. */
	index: SearchIndex;
	/** Called when a suggestion is chosen. */
	onSelect: (theme: DemoTheme) => void;
	/** Called on every keystroke, with the current matches. */
	onQuery?: (query: string, matches: ThemeMatch[]) => void;
	/** An extra filter applied to the matches, such as the variant chips. */
	accept?: (theme: DemoTheme) => boolean;
	/** How many suggestions to show. Every match is shown when it is left out. */
	limit?: number;
};

export type ThemeCombobox = {
	/** Recompute the matches and redraw the suggestions. */
	refresh: () => void;
	open: () => void;
	close: () => void;
	/** The matches for the current query. */
	matches: () => ThemeMatch[];
	/** Set the query and redraw. */
	setQuery: (query: string) => void;
	destroy: () => void;
};

/**
 * How many suggestions the list shows.
 *
 * Every match is shown by default: the list scrolls, and a truncated list
 * would hide the categories behind the first one.
 */
const DEFAULT_LIMIT = Number.POSITIVE_INFINITY;

/** The label of a variant tag, for the suggestion list. */
const TAG_LABELS = new Map(
	MODIFIER_OPTIONS.map((option) => [option.value, option.label]),
);

/** The suggestions of one category, in the order they are shown. */
type SuggestionGroup = {
	name: ThemeGroup;
	matches: ThemeMatch[];
};

/**
 * Group the matches by category.
 *
 * The groups follow the ranking: the group of the best match comes first, so
 * the theme the search meant is still the first suggestion, and the themes
 * inside a group keep their order.
 */
function groupMatches(matches: ThemeMatch[]): SuggestionGroup[] {
	const groups: SuggestionGroup[] = [];
	const byName = new Map<ThemeGroup, SuggestionGroup>();
	for (const match of matches) {
		const name = groupOf(match.theme);
		let group = byName.get(name);
		if (!group) {
			group = { name, matches: [] };
			byName.set(name, group);
			groups.push(group);
		}
		group.matches.push(match);
	}
	return groups;
}

/** The suggestions, as they are drawn. */
function renderSuggestion(match: ThemeMatch, active: boolean): string {
	const theme = match.theme;
	const asset = theme.widgets?.stats;
	const tags = [...getModifierTags(theme)].map(
		(tag) => TAG_LABELS.get(tag) ?? tag,
	);
	const thumb = asset?.src
		? `<img class="suggestion-thumb" src="${asset.src}" alt="" width="${asset.width ?? 495}" height="${asset.height ?? 195}" loading="lazy" decoding="async" />`
		: "";
	const tagsHtml = tags.length
		? `<span class="suggestion-tags">${tags.join(" · ")}</span>`
		: "";
	const display =
		theme.displayName && theme.displayName !== theme.name
			? `<span class="suggestion-display">${theme.displayName}</span>`
			: "";
	return `<div class="suggestion${active ? " active" : ""}" role="option" id="theme-option-${theme.name}" aria-selected="${active ? "true" : "false"}" data-theme="${theme.name}">
			${thumb}
			<span class="suggestion-text">
				<span class="suggestion-name">${highlightMatches(theme.name, match.matches)}</span>
				${display}
				${tagsHtml}
			</span>
		</div>`;
}

export function createThemeCombobox(
	options: ThemeComboboxOptions,
): ThemeCombobox {
	const { input, list, index, onSelect, onQuery, accept } = options;
	const limit = options.limit ?? DEFAULT_LIMIT;

	let matches: ThemeMatch[] = [];
	/** The suggestions on screen, grouped by category. */
	let groups: SuggestionGroup[] = [];
	/** The suggestions on screen, in the order they are drawn. */
	let visible: ThemeMatch[] = [];
	let active = -1;
	let open = false;

	function currentMatches(): ThemeMatch[] {
		const found = searchThemes(index, input.value);
		return accept ? found.filter((match) => accept(match.theme)) : found;
	}

	function draw(): void {
		if (!visible.length) {
			list.innerHTML = `<div class="suggestion-empty">No theme matches. Try <code>/regex/</code> or a shorter query.</div>`;
			return;
		}
		let index = 0;
		list.innerHTML = groups
			.map((group) => {
				const options = group.matches
					.map((match) => {
						const html = renderSuggestion(match, index === active);
						index++;
						return html;
					})
					.join("");
				return `<div class="suggestion-group" role="group" aria-label="${group.name}">
					<div class="suggestion-group-title" aria-hidden="true">${group.name}</div>
					${options}
				</div>`;
			})
			.join("");
	}

	function setActive(next: number): void {
		if (!visible.length) {
			active = -1;
			input.removeAttribute("aria-activedescendant");
			draw();
			return;
		}
		active = (next + visible.length) % visible.length;
		input.setAttribute(
			"aria-activedescendant",
			`theme-option-${visible[active]?.theme.name ?? ""}`,
		);
		draw();
		// `scrollIntoView` is optional: jsdom does not implement it, and a
		// browser without it should still work.
		list
			.querySelector(".suggestion.active")
			?.scrollIntoView?.({ block: "nearest" });
	}

	function refresh(): void {
		matches = currentMatches();
		groups = groupMatches(matches.slice(0, limit));
		// The suggestions are drawn grouped, so the list the keyboard walks
		// is the grouped one.
		visible = groups.flatMap((group) => group.matches);
		active = visible.length ? 0 : -1;
		draw();
		onQuery?.(input.value, matches);
		if (open) {
			const first = visible[0];
			if (first) {
				input.setAttribute(
					"aria-activedescendant",
					`theme-option-${first.theme.name}`,
				);
			} else {
				input.removeAttribute("aria-activedescendant");
			}
		}
	}

	function openList(): void {
		open = true;
		list.hidden = false;
		input.setAttribute("aria-expanded", "true");
		refresh();
	}

	function closeList(): void {
		open = false;
		list.hidden = true;
		input.setAttribute("aria-expanded", "false");
		input.removeAttribute("aria-activedescendant");
	}

	function choose(match: ThemeMatch | undefined): void {
		if (!match) return;
		input.value = match.theme.name;
		closeList();
		onSelect(match.theme);
	}

	function onKeyDown(event: KeyboardEvent): void {
		switch (event.key) {
			case "ArrowDown":
				event.preventDefault();
				if (!open) openList();
				else setActive(active + 1);
				break;
			case "ArrowUp":
				event.preventDefault();
				if (!open) openList();
				else setActive(active - 1);
				break;
			case "Home":
				if (open) {
					event.preventDefault();
					setActive(0);
				}
				break;
			case "End":
				if (open) {
					event.preventDefault();
					setActive(visible.length - 1);
				}
				break;
			case "Enter":
				if (open) {
					event.preventDefault();
					choose(visible[active]);
				}
				break;
			case "Escape":
				if (open) closeList();
				else {
					input.value = "";
					refresh();
				}
				break;
			default:
				break;
		}
	}

	function onPointerDown(event: PointerEvent): void {
		// Keep the input focused so the list does not close before the click.
		event.preventDefault();
	}

	function onClick(event: MouseEvent): void {
		const target = (event.target as Element | null)?.closest(".suggestion");
		const name = target?.getAttribute("data-theme");
		if (!name) return;
		const match = visible.find((entry) => entry.theme.name === name);
		choose(match);
	}

	input.addEventListener("input", refresh);
	input.addEventListener("focus", openList);
	input.addEventListener("keydown", onKeyDown);
	input.addEventListener("blur", closeList);
	list.addEventListener("pointerdown", onPointerDown);
	list.addEventListener("click", onClick);
	input.setAttribute("aria-expanded", "false");

	return {
		refresh,
		open: openList,
		close: closeList,
		matches: () => matches,
		setQuery: (query: string) => {
			input.value = query;
			refresh();
		},
		destroy: () => {
			input.removeEventListener("input", refresh);
			input.removeEventListener("focus", openList);
			input.removeEventListener("keydown", onKeyDown);
			input.removeEventListener("blur", closeList);
			list.removeEventListener("pointerdown", onPointerDown);
			list.removeEventListener("click", onClick);
		},
	};
}
