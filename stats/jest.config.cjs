module.exports = {
	clearMocks: true,
	transform: {
		"^.+\\.(ts|tsx)$": ["ts-jest", { useESM: true }],
	},
	extensionsToTreatAsEsm: [".ts"],
	testEnvironment: "jsdom",
	coverageProvider: "v8",
	testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/tests/e2e/"],
	modulePathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/tests/e2e/"],
	coveragePathIgnorePatterns: [
		"<rootDir>/node_modules/",
		"<rootDir>/tests/E2E/",
	],
};
