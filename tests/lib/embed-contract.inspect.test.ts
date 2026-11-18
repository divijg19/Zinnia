import { describe, expect, it } from "vitest";
import { errorCardCode, inspectSvg } from "../../scripts/lib/embed-contract";

/**
 * Error cards already carry a machine-readable code in a trailing comment.
 * A check that only says "error card (ZINNIA_ERR marker)" forces every failure
 * into the Vercel logs; naming the code keeps triage in the CI output.
 */

const SVG =
	'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="60" viewBox="0 0 600 60"></svg>';

function errorCard(code: string): string {
	return `${SVG}\n<!-- ZINNIA_ERR:${code} -->`;
}

describe("errorCardCode", () => {
	it("reads the code from a canonical error-card comment", () => {
		expect(errorCardCode(errorCard("STATS_INTERNAL"))).toBe("STATS_INTERNAL");
		expect(errorCardCode(errorCard("TOP_LANGS_RATE_LIMIT"))).toBe(
			"TOP_LANGS_RATE_LIMIT",
		);
		expect(errorCardCode(errorCard("UNKNOWN"))).toBe("UNKNOWN");
	});

	it("tolerates whitespace around the marker", () => {
		expect(
			errorCardCode(`${SVG}\n<!--   ZINNIA_ERR:STREAK_INTERNAL   -->`),
		).toBe("STREAK_INTERNAL");
	});

	it("returns null when there is no well-formed code comment", () => {
		expect(errorCardCode(SVG)).toBeNull();
		expect(errorCardCode(`${SVG}\n<!-- ZINNIA_ERR: -->`)).toBeNull();
		expect(errorCardCode(`${SVG}\n<!-- ZINNIA_ERR:mixedCase -->`)).toBeNull();
	});
});

describe("inspectSvg error reporting", () => {
	it("names the code instead of a generic marker", () => {
		const problems = inspectSvg(errorCard("STREAK_INTERNAL"));
		expect(problems).toContain("error card (ZINNIA_ERR:STREAK_INTERNAL)");
		expect(problems).not.toContain("error card (ZINNIA_ERR marker)");
	});

	it("keeps the generic marker for a bare ZINNIA_ERR string", () => {
		const problems = inspectSvg(`${SVG}\ntext without a comment: ZINNIA_ERR:`);
		expect(problems).toContain("error card (ZINNIA_ERR marker)");
	});

	it("does not report an error for a healthy card", () => {
		const problems = inspectSvg(SVG);
		expect(problems.some((p) => p.includes("ZINNIA_ERR"))).toBe(false);
	});
});
