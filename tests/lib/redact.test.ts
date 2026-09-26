import { describe, expect, it } from "vitest";
import { redactSecretTokens } from "../../lib/errors";

// `redactSecretTokens` guards error messages that reach user-visible output:
// the `?debug=1` JSON payload and the non-production X-Dev-Error-Message
// header. It had no direct tests, and the pattern missed `github_pat_`,
// GitHub's currently recommended fine-grained format.
describe("redactSecretTokens", () => {
	const classicShapes = [
		["classic personal access token", `ghp_${"a".repeat(36)}`],
		["OAuth access token", `gho_${"b".repeat(36)}`],
		["user-to-server token", `ghu_${"c".repeat(36)}`],
		["server-to-server token", `ghs_${"d".repeat(36)}`],
		["refresh token", `ghr_${"e".repeat(36)}`],
	] as const;

	for (const [label, token] of classicShapes) {
		it(`redacts a ${label} (${token.slice(0, 4)}_)`, () => {
			expect(redactSecretTokens(`auth failed for ${token}`)).toBe(
				"auth failed for [REDACTED]",
			);
		});
	}

	// Regression: fine-grained PATs start with `github_pat_`, which the old
	// `gh[pousr]_` pattern could not match, so they reached the response body.
	it("redacts a fine-grained token (github_pat_)", () => {
		const token = `github_pat_11ABCDE0_${"z".repeat(59)}`;
		const out = redactSecretTokens(`upstream rejected ${token}`);
		expect(out).toBe("upstream rejected [REDACTED]");
		expect(out).not.toContain("11ABCDE0");
	});

	it("redacts every token in a string that carries several", () => {
		const out = redactSecretTokens(
			`a=ghp_${"a".repeat(36)} b=github_pat_${"b".repeat(20)}`,
		);
		expect(out).toBe("a=[REDACTED] b=[REDACTED]");
	});

	it("redacts a token that is part of a longer value", () => {
		const token = `ghs_${"f".repeat(36)}`;
		expect(redactSecretTokens(`Bearer ${token}`)).toBe("Bearer [REDACTED]");
	});

	it("leaves ordinary diagnostic text untouched", () => {
		for (const text of [
			"fetch failed",
			"https://api.github.com/graphql",
			"rate limit exceeded for user",
			"",
		]) {
			expect(redactSecretTokens(text)).toBe(text);
		}
	});

	// The prefix alone is not a token; redacting it would corrupt unrelated text.
	it("does not redact a prefix that is not followed by a token body", () => {
		expect(redactSecretTokens("ghp_short")).toBe("ghp_short");
	});

	it("coerces non-string input", () => {
		expect(redactSecretTokens(42 as unknown as string)).toBe("42");
	});
});
