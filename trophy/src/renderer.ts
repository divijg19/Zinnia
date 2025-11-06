type TrophyConfig = {
	username: string;
	theme?: string;
	title?: string;
	columns?: number;
};

const THEMES: Record<string, { bg: string; fg: string; accent: string }> = {
	dark: { bg: "#0d1117", fg: "#c9d1d9", accent: "#58a6ff" },
	light: { bg: "#ffffff", fg: "#24292f", accent: "#0969da" },
	nord: { bg: "#2e3440", fg: "#eceff4", accent: "#88c0d0" },
	watchdog: { bg: "#021D4A", fg: "#A9FEF7", accent: "#FE428E" },
};

function getTheme(theme?: string) {
	return THEMES[theme ?? "dark"] ?? THEMES.dark;
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

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="trophy for ${username}">
  <title>Trophies for ${username}</title>
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}" />
      <stop offset="100%" stop-color="${bg}" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bgGrad)" />
	<g transform="translate(16, 16)">
		<text x="0" y="24" fill="${fg}" font-size="18" font-family="ui-sans-serif, system-ui" font-weight="600">${title ?? `GitHub Profile Trophies`
		}</text>
    <text x="0" y="44" fill="${fg}" font-size="12" font-family="ui-sans-serif, system-ui" opacity="0.8">${username}</text>
  </g>
  ${trophies.join("\n")}
</svg>`;
}
