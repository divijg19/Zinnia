import { Generator } from "./card.js";
import { ActivityExtension } from "./exts/activity.js";
import { AnimationExtension } from "./exts/animation.js";
import { ContestExtension } from "./exts/contest.js";
import { FontExtension } from "./exts/font.js";
import { HeatmapExtension } from "./exts/heatmap.js";
import { RemoteStyleExtension } from "./exts/remote-style.js";
import { supported, ThemeExtension } from "./exts/theme.js";
import { Config } from "./types.js";

/**
 * Generate a card.
 * @param config The configuration of the card
 * @returns The card (svg)
 */
export async function generate(config: Partial<Config>): Promise<string> {
	const generator = new Generator();
	return await generator.generate({
		username: "jacoblincool",
		site: "us",
		width: 500,
		height: 200,
		css: [],
		extensions: [FontExtension, AnimationExtension, ThemeExtension],
		animation: true,
		font: "baloo_2",
		theme: "light",
		...config,
	});
}

export default generate;
export {
	ActivityExtension,
	AnimationExtension,
	Config,
	ContestExtension,
	FontExtension,
	Generator,
	HeatmapExtension,
	RemoteStyleExtension,
	ThemeExtension,
	supported,
};
