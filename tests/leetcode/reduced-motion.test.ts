import { describe, expect, it } from "vitest";
import { AnimationExtension } from "../../leetcode/packages/core/src/exts/animation";

/**
 * Every animated element starts at `opacity:0` and is revealed only by its
 * animation. If the animation never runs, the card renders as an empty frame -
 * which is exactly what a README embed looks like when something goes wrong in
 * the reader's browser rather than on the server.
 */
function render(config: { animation: boolean }, solved = 1, total = 3): string {
	const styles: string[] = [];
	const generator = {
		config: { animation: config.animation },
	};
	const body = {
		problem: {
			easy: { total: total, solved },
			medium: { total: total, solved },
			hard: { total: total, solved },
		},
	};
	void AnimationExtension()(
		generator as never,
		body as never,
		{} as never,
		styles,
	);
	return styles.join("\n");
}

describe("leetcode AnimationExtension", () => {
	it("restores the finished card under prefers-reduced-motion", () => {
		const css = render({ animation: true });

		expect(css).toContain("@media (prefers-reduced-motion: reduce)");
		const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion"));
		// Every animated element must be forced visible, not just animation-free:
		// without `opacity:1` the elements keep their `opacity:0` start state.
		expect(reduced).toContain("#icon");
		expect(reduced).toContain("animation:none!important");
		expect(reduced).toContain("opacity:1!important");
		// The progress ring is animated too, and its end state is a dasharray.
		expect(reduced).toContain("#total-solved-ring");
		expect(reduced).toMatch(/stroke-dasharray:[\d.]+ 10000!important/);
		expect(reduced).not.toContain("NaN");
	});

	it("keeps the entrance animation for readers who want it", () => {
		const css = render({ animation: true });
		expect(css).toContain("@keyframes fade_in");
		expect(css).toContain("#icon{opacity:0;animation:fade_in");
	});

	it("emits no animation CSS at all when animation is disabled", () => {
		const css = render({ animation: false });
		expect(css).not.toContain("@keyframes");
		expect(css).not.toContain("opacity:0");
		expect(css).not.toContain("prefers-reduced-motion");
	});

	it("does not serialize NaN when a difficulty has no problems", () => {
		// LeetCode reports 0 for a difficulty the user never attempted, and the
		// solved/total ratio of 0/0 is NaN - which would drop the whole rule.
		const css = render({ animation: true }, 0, 0);
		expect(css).not.toContain("NaN");
		expect(css).toMatch(/stroke-dasharray:0 10000!important/);
	});
});
