import type { ContributionDay, RenderOptions } from "./types.js";

export function renderSvg(
	days: ContributionDay[],
	opts: RenderOptions = {},
): string {
	const width = opts.width ?? 600;
	const height = opts.height ?? 120;
	const colors = opts.colors ?? { bg: "#111827", fg: "#f9fafb" };
	const total = days.reduce((s, d) => s + d.count, 0);
	// deterministic: assume days already sorted ascending
	const title = `GitHub contributions: ${total}`;
	const svgParts: string[] = [];
	svgParts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
	svgParts.push(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" role="img" aria-label="${title}">`,
	);
	svgParts.push(`<title>${title}</title>`);
	svgParts.push(`<rect width="100%" height="100%" fill="${colors.bg}"/>`);
	svgParts.push(
		`<text x="12" y="20" fill="${colors.fg}" font-family="Segoe UI, Ubuntu, Sans-Serif" font-size="13">${title}</text>`,
	);

	// render a small strip of squares for the last 30 days as a compact visual
	const lastN = 30;
	const lastDays = days.slice(-lastN);
	const squareSize = 8;
	const padding = 12;
	const gap = 3;
	const startX = padding;
	const startY = 36;
	for (let i = 0; i < lastDays.length; i++) {
		const d = lastDays[i];
		const intensity = Math.min(1, d.count / 5);
		// deterministic color ramp (greenish)
		const r = Math.round(11 + 60 * (1 - intensity));
		const g = Math.round(64 + 120 * intensity);
		const b = Math.round(27 + 20 * (1 - intensity));
		const fill = `rgb(${r},${g},${b})`;
		const x = startX + i * (squareSize + gap);
		svgParts.push(
			`<rect x="${x}" y="${startY}" width="${squareSize}" height="${squareSize}" rx="2" fill="${fill}" />`,
		);
	}

	svgParts.push(`</svg>`);
	return svgParts.join("\n");
}
