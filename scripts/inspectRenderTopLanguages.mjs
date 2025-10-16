import { renderTopLanguages } from "../stats/src/cards/top-languages.js";

const langs = {
	HTML: { color: "#0f0", name: "HTML", size: 200 },
	javascript: { color: "#0ff", name: "javascript", size: 200 },
	css: { color: "#ff0", name: "css", size: 100 },
};

const html = renderTopLanguages(langs, { layout: "donut" });
console.log("Rendered HTML length:", html.length);

// Extract all d="..." occurrences for data-testid="lang-donut"
const regex = /<path[\s\S]*?data-testid="lang-donut"[\s\S]*?d="([^"]+)"/g;
const ds = Array.from(html.matchAll(regex), (m) => m[1]);

console.log("Found d count:", ds.length);

const getNumbersFromSvgPathDefinitionAttribute = (d) =>
	d
		.split(" ")
		.filter((x) => !Number.isNaN(x))
		.map((x) => parseFloat(x));

const cartesianToPolar = (cx, cy, x, y) => {
	const radius = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
	let angleInDegrees = Math.atan2(y - cy, x - cx) / (Math.PI / 180.0);
	if (angleInDegrees < 0) angleInDegrees += 360;
	return { radius, angleInDegrees };
};

const langPercentFromDonutLayoutSvg = (d, centerX, centerY) => {
	const dTmp = getNumbersFromSvgPathDefinitionAttribute(d);
	return {
		nums: dTmp,
		computed:
			(cartesianToPolar(centerX, centerY, dTmp[0], dTmp[1]).angleInDegrees +
				90 -
				(cartesianToPolar(centerX, centerY, dTmp[7], dTmp[8]).angleInDegrees +
					90)) /
			3.6,
	};
};

for (const d of ds) {
	console.log("raw d:", d);
	const nums = getNumbersFromSvgPathDefinitionAttribute(d);
	console.log("nums:", nums);
	const center = { x: nums[7], y: nums[7] };
	const res = langPercentFromDonutLayoutSvg(d, center.x, center.y);
	console.log("center used:", center, "computed:", res.computed);
}

console.log("Done");
