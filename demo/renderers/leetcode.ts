import { Generator } from "../../leetcode/packages/core/src/card.js";
import { FontExtension } from "../../leetcode/packages/core/src/exts/font.js";
import { ThemeExtension } from "../../leetcode/packages/core/src/exts/theme.js";
import { resetItemCounter } from "../../leetcode/packages/core/src/item.js";
import type { FetchedData } from "../../leetcode/packages/core/src/types.js";
import type { ThemeDefinition } from "../../lib/themes/registry.js";

/** A generator that answers with the fixture instead of the live API. */
export class FixtureGenerator extends Generator {
	private readonly fixture: FetchedData;

	constructor(fixture: FetchedData) {
		super();
		this.fixture = fixture;
	}

	protected override async fetch(
		_username: string,
		_headers: Record<string, string>,
	): Promise<FetchedData> {
		resetItemCounter();
		return structuredClone(this.fixture);
	}
}

/** Render the LeetCode card for one theme, the way the demo shows it. */
export function renderLeetCode(
	theme: ThemeDefinition,
	fixture: FetchedData,
): Promise<string> {
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
