import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
	setEtagAndAlwaysSend200,
	setShortCacheHeaders,
	setSvgHeaders,
} from "./canonical/http_cache.js";
import { statusCardSvg } from "./status-svg.js";

export type ErrorCode =
	| "STATS_RATE_LIMIT"
	| "STATS_INTERNAL"
	| "TOP_LANGS_INTERNAL"
	| "TOP_LANGS_RATE_LIMIT"
	| "STREAK_UPSTREAM_FETCH"
	| "STREAK_INTERNAL"
	| "TROPHY_INTERNAL"
	| "LEETCODE_INTERNAL"
	| "LEETCODE_BUILD_MISSING"
	| "UNKNOWN";

/** Redact GitHub-style secret tokens from a diagnostic string. */
export function redactSecretTokens(value: string): string {
	return String(value).replace(/gh[pousr]_[A-Za-z0-9_]{10,}/g, "[REDACTED]");
}

/** Send a machine-readable diagnostics payload (for `?debug=1`). Never cached. */
export function sendDebugJson(
	res: VercelResponse,
	payload: Record<string, unknown>,
) {
	try {
		res.setHeader("Content-Type", "application/json; charset=utf-8");
	} catch {}
	try {
		res.setHeader("Cache-Control", "no-store");
	} catch {}
	try {
		res.status(200);
	} catch {}
	return res.send(JSON.stringify(payload, null, 2));
}

/** Shared validation message for missing/invalid identity params. */
export const ERR_MISSING_USERNAME = "Missing or invalid ?username=";

/** Validation-failure SVG shared by card routes. */
export function missingUsername(
	req: VercelRequest,
	res: VercelResponse,
	code: ErrorCode = "UNKNOWN",
) {
	return sendErrorSvg(req, res, ERR_MISSING_USERNAME, code);
}

/** Throw for empty renderer output so callers route to the error path. */
export function emptyRenderer(service: string): never {
	throw new Error(`${service} renderer returned empty body`);
}

/**
 * Unified route catch-tail: redacted diagnostics (plus debug JSON when
 * requested), dev-only error headers, server log, transient error SVG.
 */
export function handleRouteError(
	req: VercelRequest,
	res: VercelResponse,
	err: unknown,
	opts: {
		service: string;
		code: ErrorCode;
		debug: boolean;
		diag: Record<string, unknown>;
	},
) {
	const errName = err instanceof Error ? err.name : "Error";
	const errMsg = redactSecretTokens(
		err instanceof Error ? err.message : String(err),
	).slice(0, 180);
	if (opts.debug) {
		return sendDebugJson(res, {
			...opts.diag,
			stage: "error",
			error: `${errName}: ${errMsg}`,
			code: opts.code,
		});
	}
	try {
		if (process.env.VERCEL_ENV !== "production") {
			res.setHeader("X-Dev-Error-Name", errName);
			res.setHeader("X-Dev-Error-Message", errMsg);
		}
	} catch {}
	try {
		console.error(
			`${opts.service}: internal error`,
			err instanceof Error ? err.stack || err.message : String(err),
		);
	} catch {}
	setShortCacheHeaders(res, 60);
	res.setHeader("X-Cache-Status", "transient");
	return sendErrorSvg(req, res, `${opts.service}: internal error`, opts.code);
}

/** Minimal standard error SVG with hidden error code comment. */
export function svgError(
	message: string,
	code: ErrorCode = "UNKNOWN",
	width = 600,
	height = 60,
): string {
	return statusCardSvg(message, `ZINNIA_ERR:${code}`, width, height);
}

/** Send a standardized error SVG on the provided response with cache+etag handling. */
export function sendErrorSvg(
	_req: VercelRequest,
	res: VercelResponse,
	message: string,
	code: ErrorCode,
	ttlSeconds = 60,
) {
	const body = svgError(message, code);
	setSvgHeaders(res);
	// Error responses are transient; use a short cache TTL so clients
	// revalidate quickly when the service recovers.
	setShortCacheHeaders(res, ttlSeconds);
	res.setHeader("X-Cache-Status", "transient");
	// Diagnostic headers: only expose when explicitly enabled to avoid
	// accidentally leaking messages in public production environments.
	try {
		const expose = (
			process.env.ZINNIA_EXPOSE_ERROR_HEADERS || ""
		).toLowerCase();
		if (expose === "1" || expose === "true") {
			res.setHeader("X-Error-Code", code);
			const msg = String(message).slice(0, 200);
			res.setHeader("X-Error-Message", msg);
		}
	} catch {
		// ignore header failures
	}
	res.status(200);
	// Always 200 + full SVG body with ETag set (never 304-empty, which some
	// embedders treat as an error).
	setEtagAndAlwaysSend200(res, body);
	return res.send(body);
}
