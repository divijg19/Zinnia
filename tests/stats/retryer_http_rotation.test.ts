import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { retryer } from "../../stats/src/common/retryer";
import { clearGlobalFetchMock, setGlobalFetchMock } from "../_globalFetchMock";

// Mirrors how stats' `request()` maps a raw fetch Response onto the
// `{ data, statusText }` shape the retryer consumes.
const fetchBasedFetcher = async (
	_vars: unknown,
	token?: string,
): Promise<{ data: unknown; statusText: string }> => {
	const res = await fetch("https://api.github.com/graphql", {
		headers: { Authorization: String(token) },
	});
	const body = await res.json();
	return { data: body, statusText: res.statusText };
};

function httpLike(status: number, body: Record<string, unknown>) {
	return {
		ok: status >= 200 && status < 300,
		status,
		statusText: status === 401 ? "Unauthorized" : "Forbidden",
		json: async () => body,
	};
}

function loginOf(
	result: Awaited<ReturnType<typeof retryer>> | undefined,
): string {
	const data = result?.data as { data?: { user?: { login?: string } } };
	return data.data?.user?.login ?? "";
}

describe("retryer HTTP-level token rotation (fetch resolves non-2xx)", () => {
	let seenTokens: string[];

	// Builds a fetch mock that records each request's Authorization header
	// and replays `responses` in order.
	function recordingFetch(responses: Array<Record<string, unknown>>) {
		const queue = [...responses];
		return vi.fn(
			async (_url: unknown, init?: { headers?: Record<string, string> }) => {
				seenTokens.push(String(init?.headers?.Authorization));
				const next = queue.shift();
				if (!next) throw new Error("unexpected extra fetch call");
				return next;
			},
		);
	}

	beforeEach(() => {
		process.env.PAT_1 = "token-1";
		process.env.PAT_2 = "token-2";
		process.env.PAT_3 = "token-3";
		seenTokens = [];
	});

	afterEach(() => {
		clearGlobalFetchMock();
		delete process.env.PAT_1;
		delete process.env.PAT_2;
		delete process.env.PAT_3;
	});

	it("rotates to the next PAT on resolved 401 Bad credentials", async () => {
		setGlobalFetchMock(
			recordingFetch([
				httpLike(401, { message: "Bad credentials" }),
				httpLike(200, { data: { user: { login: "ok" } } }),
			]) as unknown as Response,
		);

		const result = await retryer(fetchBasedFetcher, { login: "user" });

		expect(seenTokens).toEqual(["token-1", "token-2"]);
		expect(loginOf(result)).toBe("ok");
	});

	it("rotates on resolved REST rate-limit message (403)", async () => {
		setGlobalFetchMock(
			recordingFetch([
				httpLike(403, {
					message:
						"API rate limit exceeded for 1.2.3.4. (But here's the good news: Authenticated requests get a higher rate limit.)",
				}),
				httpLike(200, { data: { user: { login: "ok-2" } } }),
			]) as unknown as Response,
		);

		const result = await retryer(fetchBasedFetcher, { login: "user" });

		expect(seenTokens).toEqual(["token-1", "token-2"]);
		expect(loginOf(result)).toBe("ok-2");
	});

	it("rotates on resolved account-suspended message", async () => {
		setGlobalFetchMock(
			recordingFetch([
				httpLike(403, { message: "Sorry. Your account was suspended." }),
				httpLike(200, { data: { user: { login: "ok-3" } } }),
			]) as unknown as Response,
		);

		const result = await retryer(fetchBasedFetcher, { login: "user" });

		expect(seenTokens).toEqual(["token-1", "token-2"]);
		expect(loginOf(result)).toBe("ok-3");
	});

	it("returns healthy responses untouched", async () => {
		setGlobalFetchMock(
			recordingFetch([
				httpLike(200, {
					data: { user: { login: "fresh" } },
				}),
			]) as unknown as Response,
		);

		const result = await retryer(fetchBasedFetcher, { login: "user" });

		expect(seenTokens).toEqual(["token-1"]);
		expect(loginOf(result)).toBe("fresh");
	});
});
