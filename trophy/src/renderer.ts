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
		return { bg: "#ffffff", fg: "#000000", accent: "#000000" };
	}
	return {
		bg: String(t.BACKGROUND),
		fg: String(t.TITLE),
		accent: String(t.NEXT_RANK_BAR),
	};
}

function normalizeHex(hex?: string | null): string | null {
	if (!hex) return null;
	const s = String(hex).trim();
	if (s.startsWith("url(") || s.startsWith("linear-gradient(")) return s;
	if (s.includes(",")) {
		const parts = s.split(",").map((p) => p.trim());
		if (parts.length >= 3 && !Number.isNaN(Number(parts[0]))) {
			const angle = parts[0];
			const raw1 = parts[1] ?? "";
			const raw2 = parts[2] ?? "";
			const p1 = raw1.startsWith("#") ? raw1 : `#${raw1}`;
			const p2 = raw2.startsWith("#") ? raw2 : `#${raw2}`;
			return `${angle},${p1},${p2}`;
		}
	}
	const noHash = s.replace(/^#/, "");
	if (/^[0-9a-fA-F]{3}$/.test(noHash)) {
		return `#${noHash
			.split("")
			.map((c) => c + c)
			.join("")
			.toLowerCase()}`;
	}
	if (/^[0-9a-fA-F]{6}$/.test(noHash)) return `#${noHash.toLowerCase()}`;
	return s;
}

export function renderTrophySVG(cfg: TrophyConfig): string {
	const { username, theme, title, columns = 4 } = cfg;
	const { bg, fg, accent } = getTheme(theme);
	const bgNorm = normalizeHex(bg) ?? "#ffffff";
	const fgNorm = normalizeHex(fg) ?? "#000000";
	const accentNorm = normalizeHex(accent) ?? "#888888";

	// Consistent scaffold: header + grid of placeholder trophies
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

		trophies.push(`
			<g transform="translate(${x}, ${y})">
				<rect rx="10" width="${cellW}" height="${cellH}" fill="#00000020" />
				<g transform="translate(14, 14)">
					<path d="M20 30 L30 10 L40 30 L50 35 L35 45 L38 60 L30 52 L22 60 L25 45 L10 35 Z" fill="${accentNorm}"/>
					<text x="64" y="16" fill="${fgNorm}" font-size="12" font-family="Segoe UI, Arial, sans-serif">Achievement</text>
					<text x="64" y="34" fill="${fgNorm}" font-size="11" font-family="Segoe UI, Arial, sans-serif" opacity="0.8">Trophy #${i + 1}</text>
				</g>
			</g>
		`);
	}

	// Background handling: either gradient string "angle,#hex,#hex" or simple color
	let bgDef = "";
	let bgFill = "";
	if (bgNorm.includes(",")) {
		const parts = bgNorm.split(",").map((p) => p.trim());
		if (parts.length >= 3 && !Number.isNaN(Number(parts[0]))) {
			const angle = Number(parts[0]) % 360;
			const startColor = parts[1];
			const endColor = parts[2];
			bgDef = `<defs><linearGradient id="bgGrad" gradientTransform="rotate(${angle})"><stop offset="0%" stop-color="${startColor}"/><stop offset="100%" stop-color="${endColor}"/></linearGradient></defs>`;
			bgFill = `url(#bgGrad)`;
		} else {
			bgFill = bgNorm;
		}
	} else {
		bgFill = bgNorm;
	}

	const safeTitle = String(title ?? `GitHub Profile Trophies`)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;");

	return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="trophy for ${username}">\n  <title>Trophies for ${username}</title>\n  ${bgDef}\n  <rect width="100%" height="100%" fill="${bgFill}" />\n\t<g transform="translate(16, 16)">\n\t\t<text x="0" y="24" fill="${fgNorm}" font-size="18" font-family="Segoe UI, Arial, sans-serif" font-weight="600">${safeTitle}</text>\n\t    <text x="0" y="44" fill="${fgNorm}" font-size="12" font-family="Segoe UI, Arial, sans-serif" opacity="0.8">${username}</text>\n  </g>\n  ${trophies.join("\n")}\n</svg>`;
}
