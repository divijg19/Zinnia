import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearGlobalFetchMock, setGlobalFetchMock } from "../_globalFetchMock";

const mocks = vi.hoisted(() => ({
	getPat: vi.fn(),
	markExhausted: vi.fn(),
}));

vi.mock("../../lib/tokens", () => ({
	getGithubPATWithKeyForServiceAsync: mocks.getPat,
	markPatExhaustedAsync: mocks.markExhausted,
}));

// Imported after the mock so the fetcher binds the mocked token helpers.
const { fetchContributions } = await import("../../streak/src/fetcher");

function uniqueUsername(): string {
	// Unique per invocation so the contrib-cache read always misses and the
	// full-fetch GraphQL path (which propagates errors) is exercised.
	return `pat-key-probe-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

describe("streak fetcher PAT key propagation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.getPat.mockResolvedValue({ key: "PAT_4", token: "test-token" });
		mocks.markExhausted.mockResolvedValue(undefined);
	});

	afterEach(() => {
		clearGlobalFetchMock();
	});

	it("marks the selected PAT exhausted when GitHub answers 401", async () => {
		setGlobalFetchMock(
			vi.fn(async () => ({
				ok: false,
				status: 401,
				statusText: "Unauthorized",
				text: async () => "",
			})),
		);

		await expect(fetchContributions(uniqueUsername())).rejects.toThrow(
			"rate-limited",
		);
		expect(mocks.markExhausted).toHaveBeenCalledTimes(1);
		expect(mocks.markExhausted).toHaveBeenCalledWith("PAT_4", 300);
	});

	it("marks the selected PAT exhausted when GitHub answers 403", async () => {
		setGlobalFetchMock(
			vi.fn(async () => ({
				ok: false,
				status: 403,
				statusText: "Forbidden",
				text: async () => "",
			})),
		);

		await expect(fetchContributions(uniqueUsername())).rejects.toThrow(
			"rate-limited",
		);
		expect(mocks.markExhausted).toHaveBeenCalledWith("PAT_4", 300);
	});

	it("never leaks __patKey in outbound request bodies", async () => {
		const fetchMock = vi.fn(async (_url: unknown, init?: RequestInit) => {
			const body = JSON.parse(String(init?.body));
			expect(body.variables?.login).toEqual(expect.any(String));
			expect(body.variables).not.toHaveProperty("__patKey");
			return {
				ok: false,
				status: 401,
				statusText: "Unauthorized",
				text: async () => "",
			};
		});
		setGlobalFetchMock(fetchMock);

		await expect(fetchContributions(uniqueUsername())).rejects.toThrow(
			"rate-limited",
		);
		expect(fetchMock).toHaveBeenCalled();
	});

	it("does not mark exhaustion for non-auth failures (500)", async () => {
		setGlobalFetchMock(
			vi.fn(async () => ({
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
				text: async () => "boom",
			})),
		);

		await expect(fetchContributions(uniqueUsername())).rejects.toThrow(
			/graphql-failed:500/,
		);
		expect(mocks.markExhausted).not.toHaveBeenCalled();
	});
});
