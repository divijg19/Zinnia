import { describe, expect, it } from "vitest";
import { svgError } from "../../lib/errors";
import { statusCardSvg } from "../../lib/status-svg";

// Golden templates captured verbatim from the pre-refactor inline literals in
// leetcode/api/index.ts and lib/errors.ts (this commit's parent), then resolved to
// their runtime values (those templates contain a single newline escape). The only
// edit is that the original ${...} placeholders are re-tokenized as @@name@@ so the
// goldens read as plain data. They pin the exact bytes each call site emitted, so
// the extraction is provably output-identical rather than merely "looks the same".
const GOLDEN_CARD =
	'<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" role="img" aria-label="@@msg@@"><title>@@msg@@</title><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f9fafb" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">@@msg@@</text></svg>';
const GOLDEN_ERROR_CARD =
	'<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="@@width@@" height="@@height@@" role="img" aria-label="@@message@@"><title>@@message@@</title><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f9fafb" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="14">@@message@@</text></svg>\n<!-- ZINNIA_ERR:@@code@@ -->';

const fill = (tpl: string, vars: Record<string, string>) =>
	Object.entries(vars).reduce((acc, [k, v]) => acc.split(k).join(v), tpl);

describe("lib/status-svg", () => {
	it("reproduces the legacy inline card byte-for-byte", () => {
		expect(statusCardSvg("MESSAGE")).toBe(
			fill(GOLDEN_CARD, { "@@msg@@": "MESSAGE" }),
		);
	});

	it("reproduces the legacy error card (with ZINNIA_ERR marker)", () => {
		expect(svgError("MESSAGE", "STATS_INTERNAL")).toBe(
			fill(GOLDEN_ERROR_CARD, {
				"@@message@@": "MESSAGE",
				"@@code@@": "STATS_INTERNAL",
				// svgError defaults, matching the legacy template's literals
				"@@width@@": "600",
				"@@height@@": "60",
			}),
		);
	});

	it("defaults the error card marker to UNKNOWN", () => {
		expect(svgError("MESSAGE")).toContain("<!-- ZINNIA_ERR:UNKNOWN -->");
	});

	it("omits the marker when none is given", () => {
		const svg = statusCardSvg("MESSAGE");
		expect(svg).not.toContain("ZINNIA_ERR");
		expect(svg).not.toContain("<!--");
	});

	it("escapes XML metacharacters in the message", () => {
		const svg = statusCardSvg('a&b<c>d"e');
		expect(svg).toContain("a&amp;b&lt;c&gt;d&quot;e");
		expect(svg).not.toContain("<c>");
	});

	it("honors custom dimensions", () => {
		expect(statusCardSvg("M", undefined, 320, 40)).toContain(
			'width="320" height="40"',
		);
	});
});
