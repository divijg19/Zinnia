import { afterEach, describe, expect, it, vi } from "vitest";

const data_langs = {
	data: {
		user: {
			repositories: {
				nodes: [
					{
						name: "test-repo-1",
						languages: {
							edges: [{ size: 100, node: { color: "#0f0", name: "HTML" } }],
						},
					},
					{
						name: "test-repo-2",
						languages: {
							edges: [{ size: 100, node: { color: "#0f0", name: "HTML" } }],
						},
					},
					{
						name: "test-repo-3",
						languages: {
							edges: [
								{ size: 100, node: { color: "#0ff", name: "javascript" } },
							],
						},
					},
					{
						name: "test-repo-4",
						languages: {
							edges: [
								{ size: 100, node: { color: "#0ff", name: "javascript" } },
							],
						},
					},
				],
			},
		},
	},
};

const error = {
	errors: [
		{
			type: "NOT_FOUND",
			path: ["user"],
			locations: [],
			message: "Could not resolve to a User with the login of 'noname'.",
		},
	],
};

afterEach(() => {
	vi.resetModules();
	vi.restoreAllMocks();
});

describe("FetchTopLanguages (vitest)", () => {
	it("should fetch correct language data while using the new calculation", async () => {
		vi.doMock("../../stats/src/common/retryer", () => ({
			retryer: async () => ({ data: data_langs }),
		}));
		const mod = await import("../../stats/src/fetchers/top-languages");
		const { fetchTopLanguages } = mod;

		const repo = await fetchTopLanguages("anuraghazra", [], 0.5, 0.5);
		expect(repo).toStrictEqual({
			HTML: { color: "#0f0", count: 2, name: "HTML", size: 20.000000000000004 },
			javascript: {
				color: "#0ff",
				count: 2,
				name: "javascript",
				size: 20.000000000000004,
			},
		});
	});

	it("should fetch correct language data while excluding the 'test-repo-1' repository", async () => {
		vi.doMock("../../stats/src/common/retryer", () => ({
			retryer: async () => ({ data: data_langs }),
		}));
		const mod = await import("../../stats/src/fetchers/top-languages");
		const { fetchTopLanguages } = mod;

		const repo = await fetchTopLanguages("anuraghazra", ["test-repo-1"]);
		expect(repo).toStrictEqual({
			HTML: { color: "#0f0", count: 1, name: "HTML", size: 100 },
			javascript: { color: "#0ff", count: 2, name: "javascript", size: 200 },
		});
	});

	it("should fetch correct language data while using the old calculation", async () => {
		vi.doMock("../../stats/src/common/retryer", () => ({
			retryer: async () => ({ data: data_langs }),
		}));
		const mod = await import("../../stats/src/fetchers/top-languages");
		const { fetchTopLanguages } = mod;

		const repo = await fetchTopLanguages("anuraghazra", [], 1, 0);
		expect(repo).toStrictEqual({
			HTML: { color: "#0f0", count: 2, name: "HTML", size: 200 },
			javascript: { color: "#0ff", count: 2, name: "javascript", size: 200 },
		});
	});

	it("should rank languages by the number of repositories they appear in", async () => {
		vi.doMock("../../stats/src/common/retryer", () => ({
			retryer: async () => ({ data: data_langs }),
		}));
		const mod = await import("../../stats/src/fetchers/top-languages");
		const { fetchTopLanguages } = mod;

		const repo = await fetchTopLanguages("anuraghazra", [], 0, 1);
		expect(repo).toStrictEqual({
			HTML: { color: "#0f0", count: 2, name: "HTML", size: 2 },
			javascript: { color: "#0ff", count: 2, name: "javascript", size: 2 },
		});
	});

	it("counts repo occurrences per language regardless of edge order", async () => {
		// Interleaved by-repo ordering: JS and HTML each appear in exactly 2
		// repos. The shared-counter implementation recorded JS=3 here because
		// a repeat inherited the previous language's tally.
		const data_interleaved = {
			data: {
				user: {
					repositories: {
						nodes: [
							{
								name: "repo-1",
								languages: {
									edges: [
										{
											size: 800,
											node: { color: "#f1e05a", name: "javascript" },
										},
										{ size: 200, node: { color: "#e34c26", name: "HTML" } },
									],
								},
							},
							{
								name: "repo-2",
								languages: {
									edges: [
										{ size: 500, node: { color: "#e34c26", name: "HTML" } },
										{
											size: 300,
											node: { color: "#f1e05a", name: "javascript" },
										},
									],
								},
							},
							{
								name: "repo-3",
								languages: {
									edges: [
										{ size: 120, node: { color: "#3572A5", name: "python" } },
									],
								},
							},
						],
					},
				},
			},
		};
		vi.doMock("../../stats/src/common/retryer", () => ({
			retryer: async () => ({ data: data_interleaved }),
		}));
		const mod = await import("../../stats/src/fetchers/top-languages");
		const { fetchTopLanguages } = mod;

		const repo = await fetchTopLanguages("anuraghazra");

		expect(repo.javascript?.count).toBe(2);
		expect(repo.HTML?.count).toBe(2);
		expect(repo.python?.count).toBe(1);
		// sizes aggregate independently of adjacency
		expect(repo.javascript?.size).toBe(1100);
		expect(repo.HTML?.size).toBe(700);
	});

	it("keeps sizes untouched when count_weight is 0 after interleaved counting", async () => {
		const data_interleaved = {
			data: {
				user: {
					repositories: {
						nodes: [
							{
								name: "repo-1",
								languages: {
									edges: [
										{ size: 100, node: { color: "#0ff", name: "javascript" } },
										{ size: 50, node: { color: "#0f0", name: "HTML" } },
									],
								},
							},
							{
								name: "repo-2",
								languages: {
									edges: [
										{ size: 60, node: { color: "#0f0", name: "HTML" } },
										{ size: 40, node: { color: "#0ff", name: "javascript" } },
									],
								},
							},
						],
					},
				},
			},
		};
		vi.doMock("../../stats/src/common/retryer", () => ({
			retryer: async () => ({ data: data_interleaved }),
		}));
		const mod = await import("../../stats/src/fetchers/top-languages");
		const { fetchTopLanguages } = mod;

		const repo = await fetchTopLanguages("anuraghazra", [], 1, 0);
		expect(repo.javascript).toMatchObject({ count: 2, size: 140 });
		expect(repo.HTML).toMatchObject({ count: 2, size: 110 });
	});

	it("should throw specific error when user not found", async () => {
		vi.doMock("../../stats/src/common/retryer", () => ({
			retryer: async () => ({ data: error }),
		}));
		const mod = await import("../../stats/src/fetchers/top-languages");
		const { fetchTopLanguages } = mod;

		await expect(fetchTopLanguages("anuraghazra")).rejects.toThrow(
			"Could not resolve to a User with the login of 'noname'.",
		);
	});

	it("should throw other errors with their message", async () => {
		vi.doMock("../../stats/src/common/retryer", () => ({
			retryer: async () => ({
				data: { errors: [{ message: "Some test GraphQL error" }] },
			}),
		}));
		const mod = await import("../../stats/src/fetchers/top-languages");
		const { fetchTopLanguages } = mod;

		await expect(fetchTopLanguages("anuraghazra")).rejects.toThrow(
			"Some test GraphQL error",
		);
	});

	it("should throw error with specific message when error does not contain message property", async () => {
		vi.doMock("../../stats/src/common/retryer", () => ({
			retryer: async () => ({ data: { errors: [{ type: "TEST" }] } }),
		}));
		const mod = await import("../../stats/src/fetchers/top-languages");
		const { fetchTopLanguages } = mod;

		await expect(fetchTopLanguages("anuraghazra")).rejects.toThrow(
			"Something went wrong while trying to retrieve the language data using the GraphQL API.",
		);
	});
});
