import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildStreakSvg, escapeXml } from "./svg_builder.js";

// This module exposes a default handler that can be imported by api/streak.ts
// It delegates to the existing `renderForUser` if available, otherwise it
// uses the provided SVG builder.

type Output = { contentType: string; body: string | Buffer; status?: number };

export default async function handleVercel(
	req: VercelRequest,
	res: VercelResponse,
): Promise<void> {
	const url = new URL(
		req.url || "",
		`https://${req.headers.host || "example.com"}`,
	);
	const username = (
		url.searchParams.get("user") ||
		url.searchParams.get("username") ||
		""
	).trim();
	if (!username) {
		const msg = "Missing ?user= parameter";
		const svg = buildStreakSvg({
			stats: { currentStreak: 0, longestStreak: 0 },
			theme: {
				background: "#111827",
				border: "#374151",
				stroke: "#374151",
				ring: "#FB923C",
				fire: "#FB923C",
				currStreakNum: "#ffffff",
				sideNums: "#ffffff",
				currStreakLabel: "#ffffff",
				sideLabels: "#94A3B8",
				dates: "#94A3B8",
			},
			localeStrings: { current: "Current Streak", longest: "Longest Streak" },
			title: msg,
		});
		res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
		res.setHeader("Cache-Control", `public, max-age=60, s-maxage=60`);
		res.status(200).send(svg);
		return;
	}

	// parse params
	const params: Record<string, string> = {};
	for (const [k, v] of url.searchParams) params[k] = v;

	// prefer importing a bundled streak entrypoint that exposes renderForUser
	const tryImport = async (base: string): Promise<unknown> => {
		try {
			return await import(`${base}.js`);
		} catch (_e) {
			return await import(`${base}.ts`);
		}
	};

	try {
		let core: unknown;
		try {
			core = await tryImport("../dist/index");
		} catch {
			core = await tryImport("../src/index");
		}

		const renderForUser:
			| ((u: string, p?: Record<string, string>) => Promise<Output>)
			| undefined = (() => {
			// Only accept a direct `renderForUser` function from the module.
			const c = core as unknown;
			if (c && typeof c === "object") {
				const maybe = c as Record<string, unknown>;
				if (typeof maybe.renderForUser === "function") {
					return maybe.renderForUser as (
						u: string,
						p?: Record<string, string>,
					) => Promise<Output>;
				}
			}
			return undefined;
		})();

		if (renderForUser) {
			const out = await renderForUser(username, params);
			res.setHeader("Content-Type", out.contentType);
			res.setHeader(
				"Cache-Control",
				"public, max-age=14400, s-maxage=14400, stale-while-revalidate=86400",
			);
			if (out.status) res.status(out.status);
			else res.status(200);
			res.send(out.body as unknown as string | Buffer);
			return;
		}
	} catch (e) {
		console.error("streak: renderForUser import failed", e);
	}

	// Fallback: build a minimal SVG with current/longest 0
	const fallback = buildStreakSvg({
		stats: { currentStreak: 0, longestStreak: 0 },
		theme: {
			background: "#111827",
			border: "#374151",
			stroke: "#374151",
			ring: "#FB923C",
			fire: "#FB923C",
			currStreakNum: "#ffffff",
			sideNums: "#ffffff",
			currStreakLabel: "#ffffff",
			sideLabels: "#94A3B8",
			dates: "#94A3B8",
		},
		localeStrings: { current: "Current Streak", longest: "Longest Streak" },
		title: `Streak fallback for ${escapeXml(username)}`,
	});
	res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
	res.setHeader("Cache-Control", "public, max-age=14400, s-maxage=14400");
	res.status(200).send(fallback);
}
