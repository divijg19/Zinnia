import { beforeEach, describe, expect, it, vi } from "vitest";

const fetcherMocks = vi.hoisted(() => ({
	fetchContributions: vi.fn(),
}));

vi.mock("../../streak/src/fetcher", async (importOriginal) => {
	const actual = await importOriginal<Record<string, unknown>>();
	return {
		...actual,
		fetchContributions: fetcherMocks.fetchContributions,
	};
});

const DAYS = [
	{ date: "2026-06-14", count: 2 },
	{ date: "2026-06-15", count: 3 },
];

describe("renderForUser force_refresh vs LRU", () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		fetcherMocks.fetchContributions.mockResolvedValue(DAYS);
		const { DefaultLRU } = await import("../../streak/src/lru");
		DefaultLRU.clear();
	});

	it("bypasses the LRU on every forced request", async () => {
		const { renderForUser } = await import("../../streak/src/index.ts");

		const params = { force_refresh: "1" };
		await renderForUser("lru-bypass-user", params);
		await renderForUser("lru-bypass-user", params);

		expect(fetcherMocks.fetchContributions).toHaveBeenCalledTimes(2);
		expect(fetcherMocks.fetchContributions).toHaveBeenNthCalledWith(
			2,
			"lru-bypass-user",
			{ forceRefresh: true },
		);
	});

	it("still serves plain repeat requests from the LRU", async () => {
		const { renderForUser } = await import("../../streak/src/index.ts");

		await renderForUser("lru-control-user");
		await renderForUser("lru-control-user");

		expect(fetcherMocks.fetchContributions).toHaveBeenCalledTimes(1);
	});
});
