import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
	redactSecretTokens,
	sendDebugJson,
	sendErrorSvg,
} from "../lib/errors.js";
import { filterThemeParam, getUsername } from "../lib/params.js";
import { getGithubPATForService } from "../lib/tokens.js";
import { renderTopLanguages } from "../stats/src/cards/top-languages.js";
import { fetchTopLanguages } from "../stats/src/fetchers/top-languages.js";
import {
	resolveCacheSeconds,
	setCacheHeaders,
	setEtagAndAlwaysSend200,
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
	// Snapshot request-external PAT state: per-request seeding below must
	// never leak into subsequent requests sharing a warm runtime.
	const prevPat1 = process.env.PAT_1;
	let debug = false;
	let diag: Record<string, unknown> = {
		service: "top-langs",
		ok: false,
		stage: "init",
		timing: {},
	};
	try {
		const url = safeUrl(req, "/api/top-langs");
		const debugParam = (url.searchParams.get("debug") || "").toLowerCase();
		debug = debugParam === "1" || debugParam === "true";
		const t0 = Date.now();
		diag = {
			service: "top-langs",
			ok: false,
			stage: "init",
			timing: {},
		};
		const username = getUsername(url, ["username", "user"]);
		if (!username) {
			if (debug) {
				return sendDebugJson(res, {
					...diag,
					stage: "validation",
					error: "Missing or invalid ?username=",
					code: "UNKNOWN",
				});
			}
			return sendErrorSvg(req, res, "Missing or invalid ?username=", "UNKNOWN");
		}
		filterThemeParam(url);

		const token = getGithubPATForService("top-langs");
		try {
			if (
				token &&
				(!process.env.PAT_1 || process.env.PAT_1.trim().length === 0)
			) {
				process.env.PAT_1 = String(token);
			}
		} catch {}
		seedPatFromRequestHeaders(req);

		// PAT presence only — never values. Safe to expose in ?debug=1.
		const patConfigured = hasAnyPatEnv();
		diag.params = {
			username,
			theme: url.searchParams.get("theme") ?? "default",
		};
		diag.validation = { username: true, patConfigured };

		if (!patConfigured) {
			if (debug) {
				return sendDebugJson(res, {
					...diag,
					stage: "validation",
					error: "Set PAT_1 (or GITHUB_TOKEN) in Vercel for top-langs",
					code: "TOP_LANGS_RATE_LIMIT",
				});
			}
			return sendErrorSvg(
				req,
				res,
				"Set PAT_1 (or GITHUB_TOKEN) in Vercel for top-langs",
				"TOP_LANGS_RATE_LIMIT",
			);
		}

		const exclude_repo = parseArray(
			url.searchParams.get("exclude_repo") ?? undefined,
		);
		const size_weight = parseNumber(
			url.searchParams.get("size_weight") ?? undefined,
		);
		const count_weight = parseNumber(
			url.searchParams.get("count_weight") ?? undefined,
		);

		const tFetch0 = Date.now();
		const topLangs = await fetchTopLanguages(
			username,
			exclude_repo,
			typeof size_weight === "number" ? size_weight : 1,
			typeof count_weight === "number" ? count_weight : 0,
		);
		(diag.timing as Record<string, unknown>).fetchMs = Date.now() - tFetch0;

		const layoutRaw = url.searchParams.get("layout") ?? undefined;
		const layout =
			layoutRaw === "compact" ||
			layoutRaw === "normal" ||
			layoutRaw === "donut" ||
			layoutRaw === "donut-vertical" ||
			layoutRaw === "pie"
				? layoutRaw
				: undefined;
		(diag.params as Record<string, unknown>).layout = layout ?? "normal";
		const statsFormatRaw = url.searchParams.get("stats_format") ?? undefined;
		const stats_format =
			statsFormatRaw === "percentages" || statsFormatRaw === "bytes"
				? statsFormatRaw
				: undefined;

		const tRender0 = Date.now();
		const svg = renderTopLanguages(topLangs, {
			hide: parseArray(url.searchParams.get("hide") ?? undefined),
			hide_progress: parseBoolean(
				url.searchParams.get("hide_progress") ?? undefined,
			),
			hide_title: parseBoolean(url.searchParams.get("hide_title") ?? undefined),
			hide_border: parseBoolean(
				url.searchParams.get("hide_border") ?? undefined,
			),
			custom_title: url.searchParams.get("custom_title") ?? undefined,
			// Top-langs renderer uses a narrow theme union; accept any user-provided theme.
			theme: (url.searchParams.get("theme") ?? "default") as any,
			layout,
			locale: url.searchParams.get("locale") ?? undefined,
			langs_count: parseNumber(
				url.searchParams.get("langs_count") ?? undefined,
			),
			card_width: parseNumber(url.searchParams.get("card_width") ?? undefined),
			border_radius: parseNumber(
				url.searchParams.get("border_radius") ?? undefined,
			),
			title_color: url.searchParams.get("title_color") ?? undefined,
			text_color: url.searchParams.get("text_color") ?? undefined,
			bg_color: url.searchParams.get("bg_color") ?? undefined,
			border_color: url.searchParams.get("border_color") ?? undefined,
			stats_format,
			disable_animations: parseBoolean(
				url.searchParams.get("disable_animations") ?? undefined,
			),
		});

		setSvgHeaders(res);
		const cacheSeconds = resolveCacheSeconds(
			url,
			["TOP_LANGS_CACHE_SECONDS", "CACHE_SECONDS"],
			86400,
		);
		setCacheHeaders(res, cacheSeconds);
		// Never send an empty body: route to the error path instead so
		// embedders always receive a renderable SVG.
		if (!svg) throw new Error("top-langs renderer returned empty body");
		(diag.timing as Record<string, unknown>).renderMs = Date.now() - tRender0;
		(diag.timing as Record<string, unknown>).totalMs = Date.now() - t0;
		if (debug) {
			return sendDebugJson(res, {
				...diag,
				ok: true,
				stage: "done",
				render: { bytes: svg.length, cacheSeconds },
			});
		}
		// Always 200 + full SVG with ETag set (never 304-empty).
		setEtagAndAlwaysSend200(res, svg);
		res.status(200);
		res.send(svg);
		return null;
	} catch (err) {
		if (debug) {
			const errName = err instanceof Error ? err.name : "Error";
			const errMsg = redactSecretTokens(
				err instanceof Error ? err.message : String(err),
			).slice(0, 180);
			return sendDebugJson(res, {
				...diag,
				stage: "error",
				error: `${errName}: ${errMsg}`,
				code: "TOP_LANGS_INTERNAL",
			});
		}
		try {
			if (process.env.VERCEL_ENV !== "production") {
				const name = err instanceof Error ? err.name : "Error";
				const msgRaw = err instanceof Error ? err.message : String(err);
				const msg = String(msgRaw)
					.replace(/gh[pousr]_[A-Za-z0-9_]{10,}/g, "[REDACTED]")
					.slice(0, 180);
				res.setHeader("X-Dev-Error-Name", name);
				res.setHeader("X-Dev-Error-Message", msg);
			}
		} catch {}
		try {
			console.error(
				"top-langs: internal error",
				err instanceof Error ? err.stack || err.message : String(err),
			);
		} catch {}
		setShortCacheHeaders(res, 60);
		res.setHeader("X-Cache-Status", "transient");
		return sendErrorSvg(
			req,
			res,
			"top-langs: internal error",
			"TOP_LANGS_INTERNAL",
		);
	} finally {
		try {
			if (prevPat1 === undefined) delete process.env.PAT_1;
			else process.env.PAT_1 = prevPat1;
		} catch {}
	}
}
