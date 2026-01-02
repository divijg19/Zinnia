import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendErrorSvg } from "../lib/errors.js";
import { filterThemeParam, getUsername } from "../lib/params.js";
import { getGithubPATForService } from "../lib/tokens.js";
import { renderStatsCard } from "../stats/src/cards/stats.js";
import { fetchStats } from "../stats/src/fetchers/stats.js";
import {
	resolveCacheSeconds,
	setCacheHeaders,
	setEtagAndMaybeSend304,
	setShortCacheHeaders,
	setSvgHeaders,
} from "./_utils.js";

function parseBoolean(value: string | undefined): boolean | undefined {
	if (typeof value !== "string") return undefined;
	const v = value.toLowerCase();
	if (v === "true") return true;
	if (v === "false") return false;
	return undefined;
}

function parseArray(value: string | undefined): string[] {
	if (!value) return [];
	return value
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
}

function parseNumber(value: string | undefined): number | undefined {
	if (!value) return undefined;
	const n = Number(value);
	if (Number.isFinite(n)) return n;
	return undefined;
}

function safeUrl(req: VercelRequest, fallbackPath: string): URL {
	const host = (req.headers.host || "localhost").toString();
	const proto = (req.headers["x-forwarded-proto"] || "http").toString();
	const raw = (req.url as string | undefined) || fallbackPath;
	try {
		if (/^https?:\/\//i.test(raw)) return new URL(raw);
		return new URL(raw, `${proto}://${host}`);
	} catch {
		return new URL(fallbackPath, `${proto}://${host}`);
	}
}

function hasAnyPatEnv(): boolean {
	try {
		return Object.keys(process.env).some((k) => {
			if (!/^PAT_\d*$/.test(k)) return false;
			const v = process.env[k];
			return typeof v === "string" && v.trim().length > 0;
		});
	} catch {
		return false;
	}
}

function seedPatFromRequestHeaders(req: VercelRequest): void {
	try {
		if (process.env.PAT_1 && process.env.PAT_1.trim().length > 0) return;
		// Some upstream libs assume PAT_1 exists even if PAT_2..PAT_N are set.
		// If we have any PAT_* already, mirror the first one into PAT_1.
		for (const [k, v] of Object.entries(process.env)) {
			if (!/^PAT_\d*$/.test(k)) continue;
			if (typeof v !== "string") continue;
			if (v.trim().length === 0) continue;
			process.env.PAT_1 = v;
			break;
		}
		if (process.env.PAT_1 && process.env.PAT_1.trim().length > 0) return;
		const authRaw =
			(req.headers.authorization as string | undefined) ||
			(req.headers.Authorization as string | undefined);
		const xTokenRaw = req.headers["x-github-token"] as string | undefined;
		const candidate = String(xTokenRaw || authRaw || "").trim();
		if (!candidate) return;
		const token = candidate
			.replace(/^token\s+/i, "")
			.replace(/^bearer\s+/i, "")
			.trim();
		if (!token) return;
		process.env.PAT_1 = token;
	} catch {
		// ignore
	}
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		try {
			if (process.env.VERCEL_ENV !== "production") {
				const hasAuth = Boolean(
					(req.headers.authorization as string | undefined)?.trim() ||
						(req.headers.Authorization as string | undefined)?.trim(),
				);
				const hasX = Boolean(
					(req.headers["x-github-token"] as string | undefined)?.trim(),
				);
				res.setHeader("X-Has-Auth", hasAuth ? "1" : "0");
				res.setHeader("X-Has-X-Github-Token", hasX ? "1" : "0");
			}
		} catch {}
		const url = safeUrl(req, "/api/stats");
		const username = getUsername(url, ["username", "user"]);
		if (!username) {
			return sendErrorSvg(req, res, "Missing or invalid ?username=", "UNKNOWN");
		}
		filterThemeParam(url);

		const token = getGithubPATForService("stats");
		try {
			if (
				token &&
				(!process.env.PAT_1 || process.env.PAT_1.trim().length === 0)
			) {
				process.env.PAT_1 = String(token);
			}
		} catch {}
		seedPatFromRequestHeaders(req);

		if (!hasAnyPatEnv()) {
			return sendErrorSvg(
				req,
				res,
				"Set PAT_1 (or GITHUB_TOKEN) in Vercel for stats",
				"STATS_RATE_LIMIT",
			);
		}

		const include_all_commits = parseBoolean(
			url.searchParams.get("include_all_commits") ?? undefined,
		);
		const exclude_repo = parseArray(
			url.searchParams.get("exclude_repo") ?? undefined,
		);
		const include_merged_pull_requests = parseBoolean(
			url.searchParams.get("include_merged_pull_requests") ?? undefined,
		);
		const include_discussions = parseBoolean(
			url.searchParams.get("include_discussions") ?? undefined,
		);
		const include_discussions_answers = parseBoolean(
			url.searchParams.get("include_discussions_answers") ?? undefined,
		);
		const commits_year = parseNumber(
			url.searchParams.get("commits_year") ?? undefined,
		);

		const stats = await fetchStats(
			username,
			Boolean(include_all_commits),
			exclude_repo,
			Boolean(include_merged_pull_requests),
			Boolean(include_discussions),
			Boolean(include_discussions_answers),
			typeof commits_year === "number" ? Math.trunc(commits_year) : undefined,
		);

		const svg = renderStatsCard(stats, {
			hide: parseArray(url.searchParams.get("hide") ?? undefined),
			show: parseArray(url.searchParams.get("show") ?? undefined),
			show_icons: parseBoolean(url.searchParams.get("show_icons") ?? undefined),
			hide_title: parseBoolean(url.searchParams.get("hide_title") ?? undefined),
			hide_border: parseBoolean(
				url.searchParams.get("hide_border") ?? undefined,
			),
			hide_rank: parseBoolean(url.searchParams.get("hide_rank") ?? undefined),
			include_all_commits: Boolean(include_all_commits),
			commits_year:
				typeof commits_year === "number" ? Math.trunc(commits_year) : undefined,
			custom_title: url.searchParams.get("custom_title") ?? undefined,
			// Stats renderer uses a narrow theme union; accept any user-provided theme.
			theme: (url.searchParams.get("theme") ?? "default") as any,
			locale: url.searchParams.get("locale") ?? undefined,
			card_width: parseNumber(url.searchParams.get("card_width") ?? undefined),
			line_height: parseNumber(
				url.searchParams.get("line_height") ?? undefined,
			),
			border_radius: parseNumber(
				url.searchParams.get("border_radius") ?? undefined,
			),
			title_color: url.searchParams.get("title_color") ?? undefined,
			text_color: url.searchParams.get("text_color") ?? undefined,
			icon_color: url.searchParams.get("icon_color") ?? undefined,
			ring_color: url.searchParams.get("ring_color") ?? undefined,
			bg_color: url.searchParams.get("bg_color") ?? undefined,
			border_color: url.searchParams.get("border_color") ?? undefined,
			number_format: url.searchParams.get("number_format") ?? undefined,
			rank_icon: (url.searchParams.get("rank_icon") ?? undefined) as any,
			disable_animations: parseBoolean(
				url.searchParams.get("disable_animations") ?? undefined,
			),
		});

		setSvgHeaders(res);
		const cacheSeconds = resolveCacheSeconds(
			url,
			["STATS_CACHE_SECONDS", "CACHE_SECONDS"],
			86400,
		);
		setCacheHeaders(res, cacheSeconds);
		if (
			setEtagAndMaybeSend304(req.headers as Record<string, unknown>, res, svg)
		) {
			res.status(200);
			res.send(svg);
			return null;
		}
		res.status(200);
		res.send(svg);
		return null;
	} catch (_err) {
		try {
			if (process.env.VERCEL_ENV !== "production") {
				const name = _err instanceof Error ? _err.name : "Error";
				const msgRaw = _err instanceof Error ? _err.message : String(_err);
				const msg = String(msgRaw)
					.replace(/gh[pousr]_[A-Za-z0-9_]{10,}/g, "[REDACTED]")
					.slice(0, 180);
				res.setHeader("X-Dev-Error-Name", name);
				res.setHeader("X-Dev-Error-Message", msg);
			}
		} catch {}
		try {
			console.error(
				"stats: internal error",
				_err instanceof Error ? _err.stack || _err.message : String(_err),
			);
		} catch {}
		setShortCacheHeaders(res, 60);
		res.setHeader("X-Cache-Status", "transient");
		return sendErrorSvg(req, res, "stats: internal error", "STATS_INTERNAL");
	}
}
