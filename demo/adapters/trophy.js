import { toTrophyTheme } from "../../lib/themes/adapters/trophy.ts";
import { Card } from "../../trophy/src/card.ts";

export function renderTrophy(theme, fixture) {
	const card = new Card(
		["Stars", "Commits", "Followers", "PullRequest"],
		[],
		4,
		1,
		125,
		0,
		0,
		false,
		false,
	);
	return card.render(fixture, toTrophyTheme(theme));
}
