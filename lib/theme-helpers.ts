/* Shared theme helpers: parseBackgroundToken and normalizeHexToken */

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

		let id = "bggrad-";
		try {
			// use node crypto when available for deterministic ids
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const crypto = require("node:crypto");
			const h = crypto
				.createHash("sha1")
				.update(String(bgRaw), "utf8")
				.digest("hex");
			id += h.slice(0, 8);
		} catch {
			id += Math.random().toString(16).slice(2, 10);
		}

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

export function normalizeHexToken(hex?: string | null): string | null {
	if (!hex) return null;
	const s = String(hex).trim();
	if (s.startsWith("url(") || s.startsWith("linear-gradient(")) return s;
	if (s.includes(",")) return s;
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
