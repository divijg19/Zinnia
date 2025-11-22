import { describe, expect, it } from "vitest";
import { renderRepoCard } from "../../stats/src/cards/repo";

const data_repo = {
    repository: {
        nameWithOwner: "anuraghazra/convoychat",
        name: "convoychat",
        description: "Help us take over the world! React + TS + GraphQL Chat App",
        primaryLanguage: {
            color: "#2b7489",
            id: "MDg6TGFuZ3VhZ2UyODc=",
            name: "TypeScript",
        },
        starCount: 38000,
        forkCount: 100,
        isPrivate: false,
        isArchived: false,
        isTemplate: false,
        stargazers: { totalCount: 38000 },
    },
};

describe("Test renderRepoCard", () => {
    it("should render correctly", () => {
        document.body.innerHTML = renderRepoCard(data_repo.repository);

        const [header] = document.getElementsByClassName("header");

        expect(header).not.toBeNull();
        expect((header as HTMLElement).textContent).toContain("convoychat");
        expect((header as HTMLElement).textContent).not.toContain("anuraghazra");
        expect(
            document.getElementsByClassName("description")[0].textContent,
        ).toContain("Help us take over the world! React + TS + GraphQL Chat App");
        const stargazers = document.querySelector('[data-testid="stargazers"]');
        const forkcount = document.querySelector('[data-testid="forkcount"]');
        const langName = document.querySelector('[data-testid="lang-name"]');
        const langColor = document.querySelector('[data-testid="lang-color"]');
        expect(stargazers).not.toBeNull();
        expect((stargazers as HTMLElement).textContent).toContain("38k");
        expect(forkcount).not.toBeNull();
        expect((forkcount as HTMLElement).textContent).toContain("100");
        expect(langName).not.toBeNull();
        expect((langName as HTMLElement).textContent).toContain("TypeScript");
        expect(langColor).not.toBeNull();
        expect((langColor as Element).getAttribute("fill")).toBe("#2b7489");
    });
});
