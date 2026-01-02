export { generateCard, generateErrorCard } from "./card.ts";
export {
	getExcludingDaysText,
	getTranslations,
	normalizeLocaleCode,
	normalizeThemeName,
} from "./card_helpers.ts";
export { COLORS } from "./colors.ts";
export { generateDemoSvg } from "./demo/preview.ts";
export type { Stats } from "./stats.ts";
export { getContributionStats, getWeeklyContributionStats } from "./stats.ts";
export { getTelemetry, incrementPngFallback } from "./telemetry.ts";
export { TRANSLATIONS } from "./translations.ts";
export type { Output, Params } from "./types_public.ts";

// Public index for the `streak` module. Consumers should import named
// exports from this file to access the stable public API surface.
import { generateCard, generateErrorCard } from "./card.ts";
import { convertHexColors, removeAnimations } from "./card_helpers.ts";
import { fetchContributions } from "./fetcher.ts";
import { DefaultLRU } from "./lru.ts";
import {
	getContributionStats,
	getWeeklyContributionStats,
	type Stats,
} from "./stats.ts";
import { incrementPngFallback } from "./telemetry.ts";
import type { ContributionDay } from "./types.ts";
import type { Output, Params } from "./types_public.ts";

export async function generateOutput(
	output: string | Stats,
	params: Params | null = null,
): Promise<Output> {
	params = params ?? {};
	const requestedType = (params.type as string) ?? "svg";
	if (requestedType === "json") {
		const data = typeof output === "string" ? { error: output } : output;
		return { contentType: "application/json", body: JSON.stringify(data) };
	}

	// produce svg from stats or error message
	const svg =
		typeof output === "string"
			? generateErrorCard(output, params)
			: generateCard(output as Stats, params);

	// normalize hex colors
	let outSvg = convertHexColors(svg);

	// Always sanitize output to remove scripts/SMIL and normalize colors so
	// cached/ETag'd bodies are safe for embedding across consumers.
	outSvg = removeAnimations(outSvg);

	if (requestedType === "png") {
		try {
			const sharpMod = await import("sharp");
			type SharpFactory = (input?: Buffer | Uint8Array | string) => {
				png: () => { toBuffer: () => Promise<Buffer> };
			};
			const candidate =
				(sharpMod as unknown as { default?: unknown })?.default ??
				(sharpMod as unknown);
			const sharpFn = candidate as SharpFactory;
			const png = await sharpFn(Buffer.from(outSvg)).png().toBuffer();
			return { contentType: "image/png", body: png };
		} catch (e) {
			// If PNG conversion fails (sharp missing or runtime error), fall back to serving
			// the SVG so callers still receive a usable response instead of a server error.
			// Increment telemetry so we can monitor how often this occurs and log the error.
			try {
				incrementPngFallback();
			} catch {
				// ignore telemetry errors
			}
			try {
				console.warn(
					"streak: PNG conversion failed, serving SVG fallback:",
					e?.toString?.() ?? String(e),
				);
			} catch {}
			return { contentType: "image/svg+xml", body: outSvg };
		}
	}

	return { contentType: "image/svg+xml", body: outSvg };
}

export async function renderForUser(
	username: string,
	params: Params = {},
): Promise<Output> {
	if (!username)
		return {
			contentType: "image/svg+xml",
			body: generateErrorCard("Missing or invalid username", params),
			status: 400,
		};
	// compute a stable cache key for this username+params combination
	const stableKey = (() => {
		try {
			const keys = Object.keys(params).sort();
			const obj: Record<string, string> = {};
			for (const k of keys) obj[k] = String(params[k]);
			return `${username}:${JSON.stringify(obj)}`;
		} catch {
			return `${username}:${String(JSON.stringify(params))}`;
		}
	})();

	// check LRU cache first
	const cached = DefaultLRU.get(stableKey);
	if (cached) {
		const ct = cached.type === "png" ? "image/png" : "image/svg+xml";
		return { contentType: ct, body: cached.body };
	}
	try {
		const forceRefresh = !!(
			params &&
			(params.force_refresh === "1" ||
				params.force_refresh === "true" ||
				params.force_refresh === true)
		);
		const days: ContributionDay[] = await fetchContributions(username, {
			forceRefresh,
		});
		const mode =
			(params.mode as string) ?? (params.period as string) ?? "daily";
		const stats =
			mode === "weekly"
				? getWeeklyContributionStats(days)
				: getContributionStats(
						days,
						((params.exclude_days as string) || "")
							.split(",")
							.map((s) => s.trim())
							.filter(Boolean),
					);
		const out = await generateOutput(stats, params);
		// store in LRU for future hits (only cache svg/png bodies)
		try {
			if (out.contentType === "image/png") {
				DefaultLRU.set(stableKey, {
					body: out.body as Buffer,
					type: "png",
					ts: Date.now(),
				});
			} else if (out.contentType === "image/svg+xml") {
				DefaultLRU.set(stableKey, {
					body: out.body as string,
					type: "svg",
					ts: Date.now(),
				});
			}
		} catch {
			// ignore caching errors
		}
		return out;
	} catch (e: unknown) {
		const err = e as Error;
		return {
			contentType: "image/svg+xml",
			body: generateErrorCard(err.message || "Internal error", params),
			status: 500,
		};
	}
}

// Prefer named exports for idiomatic TypeScript imports
// No default export; use named exports `generateOutput` and `renderForUser`.

export { getCache } from "./cache.ts";
// Re-export commonly-needed internals for API integration (single-bundle import)
export { fetchContributions } from "./fetcher.ts";
