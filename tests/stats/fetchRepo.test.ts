import { afterEach, describe, expect, it, vi } from "vitest";

const data_repo = {
    repository: {
        name: "convoychat",
        stargazers: { totalCount: 38000 },
        description: "Help us take over the world! React + TS + GraphQL Chat App",
        primaryLanguage: {
            color: "#2b7489",
            id: "MDg6TGFuZ3VhZ2UyODc=",
            name: "TypeScript",
        },
        forkCount: 100,
    },
};

const data_user = {
    data: {
        user: { repository: data_repo.repository },
        organization: null,
    },
};

const data_org = {
    data: {
        user: null,
        organization: { repository: data_repo.repository },
    },
};

afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
});

describe("Test fetchRepo (vitest)", () => {
    it("should fetch correct user repo", async () => {
        vi.doMock("../../stats/src/common/retryer", () => ({
            retryer: async () => ({ data: data_user }),
        }));
        const mod = await import("../../stats/src/fetchers/repo");
        const { fetchRepo } = mod;

        const repo = await fetchRepo("anuraghazra", "convoychat");

        expect(repo).toStrictEqual({
            ...data_repo.repository,
            starCount: data_repo.repository.stargazers.totalCount,
        });
    });

    it("should fetch correct org repo", async () => {
        vi.doMock("../../stats/src/common/retryer", () => ({
            retryer: async () => ({ data: data_org }),
        }));
        const mod = await import("../../stats/src/fetchers/repo");
        const { fetchRepo } = mod;

        const repo = await fetchRepo("anuraghazra", "convoychat");
        expect(repo).toStrictEqual({
            ...data_repo.repository,
            starCount: data_repo.repository.stargazers.totalCount,
        });
    });

    it("should throw error if user is found but repo is null", async () => {
        vi.doMock("../../stats/src/common/retryer", () => ({
            retryer: async () => ({ data: { data: { user: { repository: null }, organization: null } } }),
        }));
        const mod = await import("../../stats/src/fetchers/repo");
        const { fetchRepo } = mod;

        await expect(fetchRepo("anuraghazra", "convoychat")).rejects.toThrow(
            "User Repository Not found",
        );
    });

    it("should throw error if org is found but repo is null", async () => {
        vi.doMock("../../stats/src/common/retryer", () => ({
            retryer: async () => ({ data: { data: { user: null, organization: { repository: null } } } }),
        }));
        const mod = await import("../../stats/src/fetchers/repo");
        const { fetchRepo } = mod;

        await expect(fetchRepo("anuraghazra", "convoychat")).rejects.toThrow(
            "Organization Repository Not found",
        );
    });

    it("should throw error if both user & org data not found", async () => {
        vi.doMock("../../stats/src/common/retryer", () => ({
            retryer: async () => ({ data: { data: { user: null, organization: null } } }),
        }));
        const mod = await import("../../stats/src/fetchers/repo");
        const { fetchRepo } = mod;

        await expect(fetchRepo("anuraghazra", "convoychat")).rejects.toThrow(
            "Not found",
        );
    });

    it("should throw error if repository is private", async () => {
        vi.doMock("../../stats/src/common/retryer", () => ({
            retryer: async () => ({ data: { data: { user: { repository: { ...data_repo.repository, isPrivate: true } }, organization: null } } }),
        }));
        const mod = await import("../../stats/src/fetchers/repo");
        const { fetchRepo } = mod;

        await expect(fetchRepo("anuraghazra", "convoychat")).rejects.toThrow(
            "User Repository Not found",
        );
    });
});
