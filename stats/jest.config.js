export default {
	preset: "ts-jest/presets/default-esm",
	extensionsToTreatAsEsm: [".ts"],
	clearMocks: true,
	transform: {
		"^.+\\.tsx?$": ["ts-jest", { useESM: true }],
	},
	moduleNameMapper: {
		"^(\\.{1,2}/.*)\\.js$": "$1",
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
