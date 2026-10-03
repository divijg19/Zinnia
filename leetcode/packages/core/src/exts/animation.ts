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

		let css = keyframe;
		for (let i = 0; i < order.length; i++) {
			css += `${order[i]}{opacity:0;animation:fade_in ${0.3 / speed}s ease ${(
				0.1 * i
			).toFixed(2)}s 1 forwards}`;
		}

		const [total, solved] = (["easy", "medium", "hard"] as const).reduce(
			(acc, level) => [
				acc[0] + data.problem[level].total,
				acc[1] + data.problem[level].solved,
			],
			[0, 0],
		);

		const progress = safeRatio(solved, total);
		const ring = circle("#total-solved-ring", 80 * Math.PI * progress, 0.7);
		css += ring.css;

		// Every element above starts at `opacity:0` and is only revealed by its
		// animation. If the animation never runs - a reader with
		// `prefers-reduced-motion: reduce`, an embedder that suppresses motion,
		// or a renderer that drops the trailing style block - the card renders
		// completely blank. Restore the finished state explicitly instead.
		css +=
			`@media (prefers-reduced-motion: reduce){${order.join(",")}` +
			`{animation:none!important;opacity:1!important}}` +
			`#total-solved-ring{animation:none!important;opacity:1!important;` +
			`stroke-dasharray:${ring.dasharray} 10000!important}}`;

		styles.push(css);
	};
}

/**
 * Share of solved problems, guarding a zero total. LeetCode returns 0 for a
 * user who has solved nothing on a difficulty, and `0/0` is NaN - which would
 * serialize into the `stroke-dasharray` as `NaN` and drop the whole rule.
 */
function safeRatio(solved: number, total: number): number {
	if (!Number.isFinite(total) || total <= 0) return 0;
	return solved / total;
}

function circle(selector: string, len = 0, delay = 0) {
	const R = Math.floor(Math.random() * 1000);
	const dasharray = Number.isFinite(len) ? len : 0;
	const animation = `@keyframes circle_${R}{0%{opacity:0;stroke-dasharray:0 1000}50%{opacity:1}100%{opacity:1;stroke-dasharray:${dasharray} 10000}}`;
	const style = `${selector}{animation:circle_${R} 1.2s ease ${delay}s 1 forwards}`;
	return { css: animation + style, dasharray };
}
