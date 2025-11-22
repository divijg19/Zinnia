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
                            edges: [{ size: 100, node: { color: "#0ff", name: "javascript" } }],
                        },
                    },
                    {
                        name: "test-repo-4",
                        languages: {
                            edges: [{ size: 100, node: { color: "#0ff", name: "javascript" } }],
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
            javascript: { color: "#0ff", count: 2, name: "javascript", size: 20.000000000000004 },
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
            retryer: async () => ({ data: { errors: [{ message: "Some test GraphQL error" }] } }),
        }));
        const mod = await import("../../stats/src/fetchers/top-languages");
        const { fetchTopLanguages } = mod;

        await expect(fetchTopLanguages("anuraghazra")).rejects.toThrow("Some test GraphQL error");
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
