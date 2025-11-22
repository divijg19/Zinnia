import { afterEach, describe, expect, it, vi } from "vitest";

const langs = {
	HTML: { color: "#0f0", name: "HTML", size: 250 },
	javascript: { color: "#0ff", name: "javascript", size: 200 },
};

const errorObj = {
	message: "Could not fetch user",
	secondaryMessage: "Make sure the provided username is not an organization",
};

afterEach(() => {
	vi.resetModules();
	vi.restoreAllMocks();
});

describe("/api/top-langs (vitest)", () => {
	it("should test the request", async () => {
		vi.doMock("../../stats/src/fetchers/top-languages", () => ({
			fetchTopLanguages: async () => langs,
		}));
		const mod = await import("../../stats/api/top-langs");
		const topLangs = mod.default;

		const req: any = { query: { username: "anuraghazra" } };
		const res: any = { setHeader: vi.fn(), send: vi.fn() };

		await topLangs(req, res);

		const { renderTopLanguages } = await import(
			"../../stats/src/cards/top-languages"
		);
		expect(res.setHeader).toHaveBeenCalledWith(
			"Content-Type",
			"image/svg+xml; charset=utf-8",
		);
		expect(res.setHeader).toHaveBeenCalledWith(
			"X-Content-Type-Options",
			"nosniff",
		);
		expect(res.send).toHaveBeenCalledWith(renderTopLanguages(langs));
	}, 20000);

	it("should work with the query options", async () => {
		vi.doMock("../../stats/src/fetchers/top-languages", () => ({
			fetchTopLanguages: async () => langs,
		}));
		const mod = await import("../../stats/api/top-langs");
		const topLangs = mod.default;

		const req: any = {
			query: {
				username: "anuraghazra",
				hide_title: true,
				card_width: 100,
				title_color: "fff",
				icon_color: "fff",
				text_color: "fff",
				bg_color: "fff",
			},
		};
		const res: any = { setHeader: vi.fn(), send: vi.fn() };

		await topLangs(req, res);

		const { renderTopLanguages } = await import(
			"../../stats/src/cards/top-languages"
		);
		expect(res.setHeader).toHaveBeenCalledWith(
			"Content-Type",
			"image/svg+xml; charset=utf-8",
		);
		expect(res.setHeader).toHaveBeenCalledWith(
			"X-Content-Type-Options",
			"nosniff",
		);
		expect(res.send).toHaveBeenCalledWith(
			renderTopLanguages(langs, {
				hide_title: true,
				card_width: 100,
				title_color: "fff",
				icon_color: "fff",
				text_color: "fff",
				bg_color: "fff",
			}),
		);
	}, 20000);

	it("should render error card on user data fetch error", async () => {
		vi.doMock("../../stats/src/fetchers/top-languages", () => ({
			fetchTopLanguages: async () => {
				throw errorObj;
			},
		}));
		const mod = await import("../../stats/api/top-langs");
		const topLangs = mod.default;

		const req: any = { query: { username: "anuraghazra" } };
		const res: any = { setHeader: vi.fn(), send: vi.fn() };

		await topLangs(req, res);

		const { renderError } = await import("../../stats/src/common/utils");
		expect(res.setHeader).toHaveBeenCalledWith(
			"Content-Type",
			"image/svg+xml; charset=utf-8",
		);
		expect(res.setHeader).toHaveBeenCalledWith(
			"X-Content-Type-Options",
			"nosniff",
		);
		expect(res.send).toHaveBeenCalledWith(
			renderError({
				message: errorObj.message,
				secondaryMessage: errorObj.secondaryMessage,
			}),
		);
	}, 20000);

	it("should render error card on incorrect layout input", async () => {
		// No fetcher mock needed; validation happens before fetching
		const mod = await import("../../stats/api/top-langs");
		const topLangs = mod.default;

		const req: any = { query: { username: "anuraghazra", layout: ["pie"] } };
		const res: any = { setHeader: vi.fn(), send: vi.fn() };

		await topLangs(req, res);

		const { renderError } = await import("../../stats/src/common/utils");
		expect(res.setHeader).toHaveBeenCalledWith(
			"Content-Type",
			"image/svg+xml; charset=utf-8",
		);
		expect(res.setHeader).toHaveBeenCalledWith(
			"X-Content-Type-Options",
			"nosniff",
		);
		expect(res.send).toHaveBeenCalledWith(
			renderError({
				message: "Something went wrong",
				secondaryMessage: "Incorrect layout input",
			}),
		);
	});

	it("should render error card if username in blacklist", async () => {
		vi.doMock("../../stats/src/fetchers/top-languages", () => ({
			fetchTopLanguages: async () => langs,
		}));
		const mod = await import("../../stats/api/top-langs");
		const topLangs = mod.default;

		const req: any = { query: { username: "renovate-bot" } };
		const res: any = { setHeader: vi.fn(), send: vi.fn() };

		await topLangs(req, res);

		const { renderError } = await import("../../stats/src/common/utils");
		expect(res.setHeader).toHaveBeenCalledWith(
			"Content-Type",
			"image/svg+xml; charset=utf-8",
		);
		expect(res.setHeader).toHaveBeenCalledWith(
			"X-Content-Type-Options",
			"nosniff",
		);
		expect(res.send).toHaveBeenCalledWith(
			renderError({
				message: "This username is blacklisted",
				secondaryMessage: "Please deploy your own instance",
				renderOptions: { show_repo_link: false },
			}),
		);
	});

	it("should render error card if wrong locale provided", async () => {
		vi.doMock("../../stats/src/fetchers/top-languages", () => ({
			fetchTopLanguages: async () => langs,
		}));
		const mod = await import("../../stats/api/top-langs");
		const topLangs = mod.default;

		const req: any = { query: { username: "anuraghazra", locale: "asdf" } };
		const res: any = { setHeader: vi.fn(), send: vi.fn() };

		await topLangs(req, res);

		const { renderError } = await import("../../stats/src/common/utils");
		expect(res.setHeader).toHaveBeenCalledWith(
			"Content-Type",
			"image/svg+xml; charset=utf-8",
		);
		expect(res.setHeader).toHaveBeenCalledWith(
			"X-Content-Type-Options",
			"nosniff",
		);
		expect(res.send).toHaveBeenCalledWith(
			renderError({
				message: "Something went wrong",
				secondaryMessage: "Language not found",
			}),
		);
	});

	it("should have proper cache", async () => {
		vi.doMock("../../stats/src/fetchers/top-languages", () => ({
			fetchTopLanguages: async () => langs,
		}));
		const mod = await import("../../stats/api/top-langs");
		const topLangs = mod.default;

		const req: any = { query: { username: "anuraghazra" } };
		const res: any = { setHeader: vi.fn(), send: vi.fn() };

		await topLangs(req, res);

		const { CACHE_TTL, DURATIONS } = await import(
			"../../stats/src/common/cache"
		);
		expect(res.setHeader).toHaveBeenCalledWith(
			"Content-Type",
			"image/svg+xml; charset=utf-8",
		);
		expect(res.setHeader).toHaveBeenCalledWith(
			"X-Content-Type-Options",
			"nosniff",
		);
		expect(res.setHeader).toHaveBeenCalledWith(
			"Cache-Control",
			`max-age=${CACHE_TTL.TOP_LANGS_CARD.DEFAULT}, ` +
				`s-maxage=${CACHE_TTL.TOP_LANGS_CARD.DEFAULT}, ` +
				`stale-while-revalidate=${DURATIONS.ONE_DAY}`,
		);
	});
});
