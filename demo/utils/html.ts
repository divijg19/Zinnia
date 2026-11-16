/**
 * The small HTML helpers the demo renders with.
 *
 * The gallery and the suggestion list both show a theme name with the matched
 * characters highlighted, so the escaping and the highlighting live here
 * rather than being written twice.
 */

/** Escape the characters that would break out of text or an attribute. */
export function escapeHtml(value: string): string {
	return String(value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

/**
 * Mark the matched characters of a name.
 *
 * The matched indices come from the search, so the highlight shows exactly
 * why a theme was picked.
 */
export function highlightMatches(text: string, matches: number[]): string {
	const escaped = escapeHtml(text);
	if (!matches.length) return escaped;
	const marked = new Set(matches);
	let out = "";
	let open = false;
	for (let i = 0; i < text.length; i++) {
		const isMatch = marked.has(i);
		if (isMatch && !open) {
			out += "<mark>";
			open = true;
		} else if (!isMatch && open) {
			out += "</mark>";
			open = false;
		}
		out += escaped[i] ?? "";
	}
	if (open) out += "</mark>";
	return out;
}

/** The indices of a literal query inside a text, for highlighting. */
export function findMatches(text: string, query: string): number[] {
	if (!query) return [];
	const at = text.toLowerCase().indexOf(query.toLowerCase());
	if (at === -1) return [];
	return Array.from({ length: query.length }, (_, i) => at + i);
}
