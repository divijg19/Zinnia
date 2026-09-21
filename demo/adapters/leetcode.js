import { Generator } from "../../leetcode/packages/core/src/card.ts";
import { FontExtension } from "../../leetcode/packages/core/src/exts/font.ts";
import { ThemeExtension } from "../../leetcode/packages/core/src/exts/theme.ts";
import { resetItemCounter } from "../../leetcode/packages/core/src/item.ts";

export class FixtureGenerator extends Generator {
	constructor(fixture) {
		super();
		this.fixture = fixture;
	}

	async fetch() {
		resetItemCounter();
		return structuredClone(this.fixture);
	}
}

export function renderLeetCode(theme, fixture) {
	return new FixtureGenerator(fixture).generate({
		username: fixture.profile.username,
		site: "us",
		width: 500,
		height: 200,
		css: [],
		extensions: [FontExtension, ThemeExtension],
		animation: false,
		font: "baloo_2",
		theme: theme.name,
	});
}
