import type { VercelRequest, VercelResponse } from "@vercel/node";
import { describe, expect, test } from "vitest";
import leetcodeHandler from "../../api/leetcode.js";
import statsHandler from "../../api/stats.js";
import streakHandler from "../../api/streak.js";
import topLangsHandler from "../../api/top-langs.js";
import trophyHandler from "../../api/trophy.js";

function makeReq(urlPath: string): VercelRequest {
	return {
		method: "GET",
		url: urlPath,
		headers: {
			host: "localhost",
			"x-forwarded-proto": "http",
		},
	} as unknown as VercelRequest;
}

function makeRes() {
	const headers = new Map<string, string>();
	let statusCode = 200;
	let body: string | undefined;
	const res: Partial<VercelResponse> & {
		_headers: Map<string, string>;
		_body: () => string;
		_status: () => number;
	} = {
		setHeader: (k: string, v: unknown) => {
			headers.set(k.toLowerCase(), String(v));
			return res as unknown as VercelResponse;
		},
		getHeader: (k: string) => headers.get(k.toLowerCase()),
		status: ((code: number) => {
			statusCode = code;
			return res as unknown as VercelResponse;
		}) as unknown as VercelResponse["status"],
		send: ((b: unknown) => {
			body = typeof b === "string" ? b : b == null ? "" : String(b);
			return res as unknown as VercelResponse;
		}) as unknown as VercelResponse["send"],
		_headers: headers,
		_body: () => body ?? "",
		_status: () => statusCode,
	};
	return res as unknown as VercelResponse & {
		_headers: Map<string, string>;
		_body: () => string;
		_status: () => number;
	};
}

async function runHandler(name: string, handler: any, urlPath: string) {
	const req = makeReq(urlPath);
	const res = makeRes();
	await handler(req, res);
	const body = res._body();
	expect(body, `${name}: should return SVG`).toContain("<svg");
	const ct = res._headers.get("content-type") ?? "";
	expect(ct, `${name}: should set SVG content-type`).toContain("image/svg");
	return { body, status: res._status(), headers: res._headers };
}

describe("offline handler smoke", () => {
	test("trophy/streak/leetcode/stats/top-langs return SVG", async () => {
		// Smoke-test invariants only: handlers respond with SVG + SVG content-type.
		// Avoid asserting on internal renderer output details here; that coverage
		// lives in dedicated unit/snapshot tests.
		await runHandler(
			"trophy",
			trophyHandler,
			"/api/trophy?username=divijg19&theme=watchdog&cache=0",
		);

		await runHandler(
			"streak",
			streakHandler,
			"/api/streak?username=divijg19&theme=watchdog&cache=0",
		);

		await runHandler(
			"leetcode",
			leetcodeHandler,
			"/api/leetcode?username=divijg19&theme=watchdog&cache=0",
		);

		// These may return an error SVG if PAT is not configured; that's OK
		// for an offline smoke test, but they must still return valid SVG.
		await runHandler(
			"stats",
			statsHandler,
			"/api/stats?username=divijg19&theme=watchdog&cache=0",
		);
		await runHandler(
			"top-langs",
			topLangsHandler,
			"/api/top-langs?username=divijg19&theme=watchdog&layout=compact&cache=0",
		);
	});
});
