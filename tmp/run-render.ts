import { renderTrophySVG } from "../trophy/src/renderer.ts";
import { COLORS } from "../trophy/src/theme.ts";

function sample(name: string) {
	try {
		const svg = renderTrophySVG({
			username: "divijg19",
			theme: name,
			title: "Trophies",
			columns: 4,
		});
		console.log(`--- THEME: ${name} ---`);
		console.log(svg.slice(0, 2048));
		console.log(`--- END ${name} ---\n`);
	} catch (e) {
		console.error(`Error rendering ${name}:`, e);
	}
}

console.log(
	"Available themes sample:",
	Object.keys(COLORS).slice(0, 10).join(", "),
);

sample("onedark");
sample("watchdog");
