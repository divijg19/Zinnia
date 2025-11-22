import { describe, expect, it } from "vitest";
import { renderGistCard } from "../../stats/src/cards/gist";
import { themes } from "../../stats/themes/index.js";

const data = {
	name: "test",
	nameWithOwner: "anuraghazra/test",
	description: "Small test repository with different Python programs.",
	language: "Python",
	starsCount: 163,
	forksCount: 19,
};

describe("test renderGistCard", () => {
	it("should render correctly", () => {
		document.body.innerHTML = renderGistCard(data);

		const [header] = document.getElementsByClassName("header");
		expect(header?.textContent).toContain("test");
		expect(header?.textContent).not.toContain("anuraghazra");

		expect(
			document.getElementsByClassName("description")[0].textContent,
		).toContain("Small test repository with different Python programs.");

		const stars = document.querySelector('[data-testid="starsCount"]');
		const forks = document.querySelector('[data-testid="forksCount"]');
		const langName = document.querySelector('[data-testid="lang-name"]');
		const langColor = document.querySelector('[data-testid="lang-color"]');

		expect(stars).not.toBeNull();
		expect((stars as HTMLElement).textContent).toContain("163");
		expect(forks).not.toBeNull();
		expect((forks as HTMLElement).textContent).toContain("19");
		expect(langName).not.toBeNull();
		expect((langName as HTMLElement).textContent).toContain("Python");
		expect(langColor).not.toBeNull();
		expect((langColor as Element).getAttribute("fill")).toBe("#3572A5");
	});

	it("should display username in title if show_owner is true", () => {
		document.body.innerHTML = renderGistCard(data, { show_owner: true });
		const [header2] = document.getElementsByClassName("header");
		expect(header2?.textContent).toContain("anuraghazra/test");
	});

	it("should trim header if name is too long", () => {
		document.body.innerHTML = renderGistCard({
			...data,
			name: "some-really-long-repo-name-for-test-purposes",
		});
		const [header3] = document.getElementsByClassName("header");
		expect(header3?.textContent).toContain(
			"some-really-long-repo-name-for-test...",
		);
	});

	it("should trim long description", () => {
		document.body.innerHTML = renderGistCard({
			...data,
			description:
				"The quick brown fox jumps over the lazy dog is an English-language pangram—a sentence that contains all of the letters of the English alphabet",
		});

		const desc = document.getElementsByClassName("description")[0];
		expect(desc.children[0].textContent).toContain(
			"The quick brown fox jumps over the lazy dog is an",
		);
		expect(desc.children[1].textContent).toContain(
			"English-language pangram—a sentence that contains all",
		);
	});

	it("should render custom colors properly", () => {
		const customColors = {
			title_color: "5a0",
			icon_color: "1b998b",
			text_color: "9991",
			bg_color: "252525",
		};
		document.body.innerHTML = renderGistCard(data, { ...customColors });
		const styleTag = document.querySelector("style");
		expect(styleTag).not.toBeNull();
		const content = (styleTag as HTMLStyleElement).innerHTML;
		expect(content).toContain(`#${customColors.title_color}`);
		expect(content).toContain(`#${customColors.text_color}`);
		expect(content).toContain(`#${customColors.icon_color}`);
		const cardBg = document.querySelector('[data-testid="card-bg"]');
		expect(cardBg?.getAttribute("fill")).toBe("#252525");
	});

	it("should render with all the themes", () => {
		Object.keys(themes).forEach((name) => {
			document.body.innerHTML = renderGistCard(data, { theme: name });
			const styleTag = document.querySelector("style");
			expect(styleTag).not.toBeNull();
			const content = (styleTag as HTMLStyleElement).innerHTML;
			expect(content).toContain(`#${(themes as any)[name].title_color}`);
			expect(content).toContain(`#${(themes as any)[name].text_color}`);
			expect(content).toContain(`#${(themes as any)[name].icon_color}`);
			const backgroundElement = document.querySelector(
				'[data-testid="card-bg"]',
			);
			const backgroundElementFill = backgroundElement?.getAttribute("fill");
			expect([
				`#${(themes as any)[name].bg_color}`,
				"url(#gradient)",
			]).toContain(backgroundElementFill);
		});
	});

	it("should not render star count or fork count if either are zero", () => {
		document.body.innerHTML = renderGistCard({ ...data, starsCount: 0 });
		expect(document.querySelector('[data-testid="starsCount"]')).toBeNull();
		expect(document.querySelector('[data-testid="forksCount"]')).not.toBeNull();

		document.body.innerHTML = renderGistCard({
			...data,
			starsCount: 1,
			forksCount: 0,
		});
		expect(document.querySelector('[data-testid="starsCount"]')).not.toBeNull();
		expect(document.querySelector('[data-testid="forksCount"]')).toBeNull();

		document.body.innerHTML = renderGistCard({
			...data,
			starsCount: 0,
			forksCount: 0,
		});
		expect(document.querySelector('[data-testid="starsCount"]')).toBeNull();
		expect(document.querySelector('[data-testid="forksCount"]')).toBeNull();
	});

	it("should render without rounding and fallback description", () => {
		document.body.innerHTML = renderGistCard(data, { border_radius: "0" });
		const rectEl = document.querySelector("rect");
		expect(rectEl).not.toBeNull();
		expect((rectEl as Element).getAttribute("rx")).toBe("0");
		document.body.innerHTML = renderGistCard(data, {});
		const rectEl2 = document.querySelector("rect");
		expect(rectEl2).not.toBeNull();
		expect((rectEl2 as Element).getAttribute("rx")).toBe("4.5");

		document.body.innerHTML = renderGistCard({
			...data,
			description: undefined,
		});
		expect(
			document.getElementsByClassName("description")[0].textContent,
		).toContain("No description provided");
	});
});
