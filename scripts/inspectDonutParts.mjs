#!/usr/bin/env node
// @ts-nocheck
// Standalone inspector that mirrors the test's parsing logic for donut path parsing

const degreesToRadians = (angleInDegrees) => angleInDegrees * (Math.PI / 180.0);

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
	const rads = degreesToRadians(angleInDegrees);
	return {
		x: centerX + radius * Math.cos(rads),
		y: centerY + radius * Math.sin(rads),
	};
}

function createDonutPaths(cx, cy, radius, percentages) {
	const paths = [];
	let startAngle = 0;
	let endAngle = 0;
	const totalPercent = percentages.reduce((acc, curr) => acc + curr, 0);
	for (let i = 0; i < percentages.length; i++) {
		const percent = parseFloat(
			((percentages[i] / totalPercent) * 100).toFixed(2),
		);
		endAngle = 3.6 * percent + startAngle;
		const startPoint = polarToCartesian(cx, cy, radius, endAngle - 90);
		const endPoint = polarToCartesian(cx, cy, radius, startAngle - 90);
		const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
		const sx = Number(startPoint.x.toFixed(6));
		const sy = Number(startPoint.y.toFixed(6));
		const ex = Number(endPoint.x.toFixed(6));
		const ey = Number(endPoint.y.toFixed(6));
		paths.push({
			percent,
			d: `M ${sx} ${sy} A ${Number(radius.toFixed(6))} ${Number(radius.toFixed(6))} 0 ${largeArc} 0 ${ex} ${ey}`,
		});
		startAngle = endAngle;
	}
	return paths;
}

const centerX = 150;
const centerY = 100;
const radius = 56.66666666666667;
const percentages = [40, 40, 20];
const paths = createDonutPaths(centerX, centerY, radius, percentages);

const getNumbersFromSvgPathDefinitionAttribute = (d) =>
	d
		.split(" ")
		.filter((x) => !Number.isNaN(Number(x)))
		.map((x) => parseFloat(x));

const cartesianToPolar = (centerX, centerY, x, y) => {
	const radius = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
	let angleInDegrees = Math.atan2(y - centerY, x - centerX) / (Math.PI / 180.0);
	if (angleInDegrees < 0) angleInDegrees += 360;
	return { radius, angleInDegrees };
};

const langPercentFromDonutLayoutSvg = (d, centerX, centerY) => {
	const dTmp = getNumbersFromSvgPathDefinitionAttribute(d);
	const endAngle =
		cartesianToPolar(centerX, centerY, dTmp[0], dTmp[1]).angleInDegrees + 90;
	let startAngle =
		cartesianToPolar(centerX, centerY, dTmp[7], dTmp[8]).angleInDegrees + 90;
	if (startAngle > endAngle) startAngle -= 360;
	return (endAngle - startAngle) / 3.6;
};

for (const p of paths) {
	console.log("d:", p.d);
	const numbers = getNumbersFromSvgPathDefinitionAttribute(p.d);
	console.log("numbers:", numbers);
	const center = { x: numbers[7], y: numbers[7] };
	const computed = langPercentFromDonutLayoutSvg(p.d, center.x, center.y);
	console.log("center used in test:", center);
	console.log("computed percent:", computed);
}
