import type { selectors } from "../elements.js";
import type { Extension } from "../types.js";

const keyframe = `@keyframes fade_in{from{opacity:0}to{opacity:1}}`;

const order: (typeof selectors)[number][] = [
	"#icon",
	"#username",
	"#ranking",
	"#total-solved-bg",
	"#total-solved-ring",
	"#total-solved-text",
	"#easy-solved-type",
	"#easy-solved-count",
	"#easy-solved-bg",
	"#easy-solved-progress",
	"#medium-solved-type",
	"#medium-solved-count",
	"#medium-solved-bg",
	"#medium-solved-progress",
	"#hard-solved-type",
	"#hard-solved-count",
	"#hard-solved-bg",
	"#hard-solved-progress",
];

export function AnimationExtension(): Extension {
	return async function Animation(generator, data, _body, styles) {
		if (generator.config.animation === false) {
			return;
		}

		const speed = 1;

		// Visibility must never depend on an animation running.
		//
		// These rules used to declare `opacity: 0` and fill `forwards`, which
		// made the card invisible wherever the animation did not run: a reader
		// with `prefers-reduced-motion`, an embedder that suppresses motion, or
		// a renderer that drops the style block.
		//
		// The rule now is that every property an animation touches already holds
		// its final value in the element's own style, and `backwards` supplies
		// only the `from` frame during the delay. The fade-in looks identical,
		// and with no animation the element simply renders finished.
		// `#total-solved-ring` qualifies because `elements.ts` puts its final
		// `stroke-dasharray` in the base style.
		let css = keyframe;
		for (let i = 0; i < order.length; i++) {
			css += `${order[i]}{animation:fade_in ${0.3 / speed}s ease ${(
				0.1 * i
			).toFixed(2)}s 1 backwards}`;
		}

		const [total, solved] = (["easy", "medium", "hard"] as const).reduce(
			(acc, level) => [
				acc[0] + data.problem[level].total,
				acc[1] + data.problem[level].solved,
			],
			[0, 0],
		);

		const progress = safeRatio(solved, total);
		css += circle("#total-solved-ring", 80 * Math.PI * progress, 0.7);

		styles.push(css);
	};
}

/**
 * Share of solved problems, guarding a zero total. LeetCode returns 0 for a
 * user who has solved nothing on a difficulty, and `0/0` is NaN - which would
 * serialize into the `stroke-dasharray` as `NaN` and drop the whole
 * declaration.
 */
function safeRatio(solved: number, total: number): number {
	if (!Number.isFinite(total) || total <= 0) return 0;
	return solved / total;
}

/**
 * Ring fill animation.
 *
 * The keyframe name used to end in `Math.floor(Math.random() * 1000)`, so every
 * render of identical input emitted a different `@keyframes circle_814` and
 * `circle_27`. Two consequences: the card could never be byte-stable, which
 * defeats the render cache and the ETag entirely, and the random identifier was
 * visible in the served SVG. The selector is already unique per animated ring,
 * so deriving the name from it is both stable and more readable.
 */
function circle(selector: string, len = 0, delay = 0) {
	const name = `circle_${selector.replace(/^#/, "")}`;
	const dasharray = Number.isFinite(len) ? len : 0;
	const animation = `@keyframes ${name}{0%{opacity:0;stroke-dasharray:0 1000}50%{opacity:1}100%{opacity:1;stroke-dasharray:${dasharray} 10000}}`;
	const style = `${selector}{animation:${name} 1.2s ease ${delay}s 1 backwards}`;
	return animation + style;
}
