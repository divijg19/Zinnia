import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A failed LeetCode fetch must never render as data.
 *
 * `Generator._fetch` used to catch every error from the GraphQL query and
 * return a fabricated card: solved/total counts from `Math.random()`, the error
 * message as the username, ranking 0. Because the route reports `ok: true` and
 * `renderWithFallback` caches whatever `produce` resolves, one rate-limited
 * request pinned invented numbers onto the public embed for the full 24 hour
 * TTL, and nothing in the response, the logs or `?debug=1` gave it away.
 */

const failing = vi.fn();

vi.mock("../../leetcode/packages/core/src/shims/leetcode-query", () => ({
	LeetCode: class {
		graphql() {
			return failing();
		}
	},
}));

const { Generator, LeetCodeFetchError } = await import(
	"../../leetcode/packages/core/src/card"
);
const { AnimationExtension } = await import(
	"../../leetcode/packages/core/src/exts/animation"
);
const { FontExtension } = await import(
	"../../leetcode/packages/core/src/exts/font"
);
const { ThemeExtension } = await import(
	"../../leetcode/packages/core/src/exts/theme"
);

function generate() {
	return new Generator().generate({
		username: "testuser",
		site: "us",
		width: 500,
		height: 200,
		css: [],
		extensions: [FontExtension, AnimationExtension, ThemeExtension],
		animation: true,
		font: "baloo_2",
		theme: "watchdog",
	});
}

describe("leetcode fetch failure", () => {
	beforeEach(() => {
		failing.mockReset();
	});

	it("rejects with a typed error instead of returning a card", async () => {
		failing.mockRejectedValue(new Error("LeetCode GraphQL failed: 429"));
		await expect(generate()).rejects.toBeInstanceOf(LeetCodeFetchError);
	});

	it("never resolves to an SVG when the upstream query fails", async () => {
		failing.mockRejectedValue(new Error("LeetCode GraphQL failed: 429"));
		const outcome = await generate().then(
			(svg) => ({ resolved: true, svg }),
			(error: unknown) => ({ resolved: false, error }),
		);
		// The fabricated fallback resolved happily, which is what let a failure
		// reach the cache and the embedder as though it were a successful render.
		expect(outcome.resolved).toBe(false);
		expect((outcome as { svg?: string }).svg).toBeUndefined();
	});

	it("names the service and keeps the upstream reason", async () => {
		failing.mockRejectedValue(new Error("LeetCode GraphQL failed: 429"));
		await expect(generate()).rejects.toThrow(/429/);
		await expect(generate()).rejects.toThrow(/LeetCode/);
	});

	it("does not fabricate problem counts on failure", async () => {
		failing.mockRejectedValue(new Error("boom"));
		const error = await generate().catch((e: unknown) => e);
		const message = (error as Error).message;
		// The old fallback put random 500..1000 counts into the card body.
		expect(message).not.toMatch(/\b[5-9]\d{2}\b/);
	});

	it("still fails for an unknown user rather than inventing a profile", async () => {
		failing.mockResolvedValue({ data: { user: null } });
		await expect(generate()).rejects.toBeInstanceOf(LeetCodeFetchError);
	});
});
