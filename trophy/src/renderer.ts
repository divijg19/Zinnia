import { COLORS } from "./theme.ts";

type TrophyConfig = {
	username: string;
	theme?: string;
	title?: string;
	columns?: number;
};

function getTheme(themeName?: string): {
	bg: string;
	fg: string;
	accent: string;
} {
	const t = COLORS[themeName ?? "flat"] || COLORS.flat;
	if (!t) {
		// Fallback if even flat is missing (should not happen)
		return { bg: "#fff", fg: "#000", accent: "#000" };
	}
	return {
		bg: t.BACKGROUND,
		fg: t.TITLE,
		accent: t.NEXT_RANK_BAR,
	};
}

export function renderTrophySVG(cfg: TrophyConfig): string {
	const { username, theme, title, columns = 4 } = cfg;
	const { bg, fg, accent } = getTheme(theme);

	// Simple layout: header + grid of placeholder trophies
	const cellW = 150;
	const cellH = 90;
	const gap = 12;
	const headerH = 56;
	const rows = 2;
	const width = columns * cellW + (columns - 1) * gap + 32;
	const height = headerH + rows * cellH + (rows - 1) * gap + 32;

	const trophies: string[] = [];
	for (let i = 0; i < rows * columns; i++) {
		const c = i % columns;
		const r = Math.floor(i / columns);
		const x = 16 + c * (cellW + gap);
		const y = headerH + 16 + r * (cellH + gap);

		// Trophy card
		trophies.push(`
      <g transform="translate(${x}, ${y})">
        <rect rx="10" width="${cellW}" height="${cellH}" fill="#00000020" />
        <g transform="translate(14, 14)">
          <path d="M20 30 L30 10 L40 30 L50 35 L35 45 L38 60 L30 52 L22 60 L25 45 L10 35 Z" fill="${accent}"/>
          <text x="64" y="16" fill="${fg}" font-size="12" font-family="ui-sans-serif, system-ui">Achievement</text>
          <text x="64" y="34" fill="${fg}" font-size="11" font-family="ui-sans-serif, system-ui" opacity="0.8">Trophy #${i + 1}</text>
        </g>
      </g>
    `);
	}

	// Handle gradient background: "angle,color1,color2" or simple hex
	let bgDef = "";
	let bgFill = "";
	if (bg?.includes(",")) {
		const parts = bg.split(",");
		const angle = parseInt(parts[0] || "45", 10) || 45;
		const p1 = parts[1] || "";
		const p2 = parts[2] || "";
		const startColor = p1.startsWith("#") ? p1 : `#${p1}`;
		const endColor = p2.startsWith("#") ? p2 : `#${p2}`;
		// Convert angle to x1,y1,x2,y2 approximation
		const rad = (angle * Math.PI) / 180;
		const x2 = Math.abs(Math.cos(rad));
		const y2 = Math.abs(Math.sin(rad));
		bgDef = `
    <linearGradient id="bgGrad" x1="0" y1="0" x2="${x2}" y2="${y2}">
      <stop offset="0%" stop-color="${startColor}" />
      <stop offset="100%" stop-color="${endColor}" />
    </linearGradient>`;
		bgFill = "url(#bgGrad)";
	} else {
		bgFill = bg;
	}

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="trophy for ${username}">
  <title>Trophies for ${username}</title>
  <defs>${bgDef}</defs>
  <rect width="100%" height="100%" fill="${bgFill}" />
	<g transform="translate(16, 16)">
		<text x="0" y="24" fill="${fg}" font-size="18" font-family="ui-sans-serif, system-ui" font-weight="600">${
			title ?? `GitHub Profile Trophies`
		}</text>
    <text x="0" y="44" fill="${fg}" font-size="12" font-family="ui-sans-serif, system-ui" opacity="0.8">${username}</text>
  </g>
  ${trophies.join("\n")}
</svg>`;
}
