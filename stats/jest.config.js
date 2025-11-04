export default {
	preset: "ts-jest/presets/default-esm",
	clearMocks: true,
	transform: {
		"^.+\\.tsx?$": ["ts-jest", { useESM: true }],
	},
	testEnvironment: "jsdom",
	coverageProvider: "v8",
	testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/tests/e2e/"],
	modulePathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/tests/e2e/"],
	coveragePathIgnorePatterns: [
		"<rootDir>/node_modules/",
		"<rootDir>/tests/E2E/",
	],
};
