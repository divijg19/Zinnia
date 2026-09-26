/* Shared theme helpers: parseBackgroundToken and normalizeThemeKeys */

export function parseBackgroundToken(
	bgRaw?: string | null,
): { id: string; def: string } | null {
	if (!bgRaw || typeof bgRaw !== "string" || !bgRaw.includes(",")) return null;
	try {
		const parts = String(bgRaw)
			.split(",")
			.map((p) => p.trim())
			.filter(Boolean);
		const head = (parts[0] || "").toLowerCase();
		const colorTokens = (arr: string[]) =>
			arr.map((c) => (c?.startsWith("#") ? c : `#${c}`));

		// Deterministic FNV-1a hash so gradient IDs are stable across
		// runtimes (node, edge, bundled) without depending on node:crypto.
		// IDs are internal to a single SVG document (`url(#...)` references
		// match by construction), so only stability matters, not the scheme.
		let hash = 0x811c9dc5;
		for (let i = 0; i < bgRaw.length; i++) {
			hash ^= bgRaw.charCodeAt(i);
			hash = Math.imul(hash, 0x01000193);
		}
		const id = `bggrad-${(hash >>> 0).toString(16).padStart(8, "0")}`;

		if (head === "radial") {
			const colors = colorTokens(parts.slice(1));
			const stops = colors.map((col, i) => {
				const offset = Math.round((i / Math.max(1, colors.length - 1)) * 100);
				return `<stop offset='${offset}%' stop-color='${col}'/>`;
			});
			const def = `<radialGradient id='${id}' gradientUnits='userSpaceOnUse' cx='50%' cy='50%' r='50%'>${stops.join("\n")}</radialGradient>`;
			return { id, def };
		}

		let angleRaw = parts[0] || "0";
		angleRaw = angleRaw.replace(/deg$/i, "");
		const angle = Number.parseFloat(angleRaw) || 0;
		const colors = colorTokens(parts.slice(1));
		const stops = colors.map((col, i) => {
			const offset = Math.round((i / Math.max(1, colors.length - 1)) * 100);
			return `<stop offset='${offset}%' stop-color='${col}'/>`;
		});
		const def = `<linearGradient id='${id}' gradientUnits='userSpaceOnUse' gradientTransform='rotate(${angle})'>${stops.join("\n")}</linearGradient>`;
		return { id, def };
	} catch {
		return null;
	}
}

export function normalizeThemeKeys(
	raw: Record<string, string | undefined> | null | undefined,
): Record<string, string | undefined> {
	const keyMap: Record<string, string> = {
		bg_color: "background",
		border_color: "border",
		stroke_color: "stroke",
		title_color: "title_color",
		text_color: "text_color",
		icon_color: "icon_color",
		ring_color: "ring",
	};
	const out: Record<string, string | undefined> = {};
	if (!raw || typeof raw !== "object") return out;
	for (const [k, v] of Object.entries(raw)) {
		const nk = (keyMap as Record<string, string>)[k] ?? k;
		if (v !== undefined) out[nk] = String(v);
	}
	return out;
}
