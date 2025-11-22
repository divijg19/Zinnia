import { afterEach, describe, expect, it, vi } from "vitest";

const gist_data = {
	data: {
		viewer: {
			gist: {
				description:
					"List of countries and territories in English and Spanish: name, continent, capital, dial code, country codes, TLD, and area in sq km. Lista de países y territorios en Inglés y Español: nombre, continente, capital, código de teléfono, códigos de país, dominio y área en km cuadrados. Updated 2023",
				owner: {
					login: "Yizack",
				},
				stargazerCount: 33,
				forks: {
					totalCount: 11,
				},
				files: [
					{
						name: "countries.json",
						language: {
							name: "JSON",
						},
						size: 85858,
					},
					{
						name: "territories.txt",
						language: {
							name: "Text",
						},
						size: 87858,
					},
					{
						name: "countries_spanish.json",
						language: {
							name: "JSON",
						},
						size: 85858,
					},
					{
						name: "territories_spanish.txt",
						language: {
							name: "Text",
						},
						size: 87858,
					},
				],
			},
		},
	},
};

const gist_not_found_data = {
	data: {
		viewer: {
			gist: null,
		},
	},
};

const gist_errors_data = {
	errors: [
		{
			message: "Some test GraphQL error",
		},
	],
};

afterEach(() => {
	vi.resetModules();
	vi.restoreAllMocks();
});

describe("Test fetchGist (vitest)", () => {
	it("should fetch gist correctly", async () => {
		vi.doMock("../../stats/src/common/retryer", () => ({
			retryer: async () => ({ data: gist_data }),
		}));
		const mod = await import("../../stats/src/fetchers/gist");
		const { fetchGist } = mod;

		const gist = await fetchGist("bbfce31e0217a3689c8d961a356cb10d");

		expect(gist).toStrictEqual({
			name: "countries.json",
			nameWithOwner: "Yizack/countries.json",
			description:
				"List of countries and territories in English and Spanish: name, continent, capital, dial code, country codes, TLD, and area in sq km. Lista de países y territorios en Inglés y Español: nombre, continente, capital, código de teléfono, códigos de país, dominio y área en km cuadrados. Updated 2023",
			language: "Text",
			starsCount: 33,
			forksCount: 11,
		});
	});

	it("should throw correct error if gist not found", async () => {
		vi.doMock("../../stats/src/common/retryer", () => ({
			retryer: async () => ({ data: gist_not_found_data }),
		}));
		const mod = await import("../../stats/src/fetchers/gist");
		const { fetchGist } = mod;

		await expect(fetchGist("bbfce31e0217a3689c8d961a356cb10d")).rejects.toThrow(
			"Gist not found",
		);
	});

	it("should throw error if response contains errors", async () => {
		vi.doMock("../../stats/src/common/retryer", () => ({
			retryer: async () => ({ data: gist_errors_data }),
		}));
		const mod = await import("../../stats/src/fetchers/gist");
		const { fetchGist } = mod;

		await expect(fetchGist("bbfce31e0217a3689c8d961a356cb10d")).rejects.toThrow(
			"Some test GraphQL error",
		);
	});

	it("should throw error if id is not provided", async () => {
		const mod = await import("../../stats/src/fetchers/gist");
		const { fetchGist } = mod;
		await expect((fetchGist as any)()).rejects.toThrow(
			'Missing params "id" make sure you pass the parameters in URL',
		);
	});
});
