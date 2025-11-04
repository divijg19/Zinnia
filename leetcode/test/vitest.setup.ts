import { readFileSync } from "node:fs";
import { join } from "node:path";
import { vi } from "vitest";

// Load fixtures (the files include a top-level `data` property like a real GraphQL response)
const usFixture = JSON.parse(
	readFileSync(
		join(__dirname, "../__fixtures__/leetcode_us_graphql.json"),
		"utf-8",
	),
);
const cnFixture = JSON.parse(
	readFileSync(
		join(__dirname, "../__fixtures__/leetcode_cn_graphql.json"),
		"utf-8",
	),
);

// Mock the leetcode-query package so `new LeetCode().graphql()` returns the fixture object
vi.mock("leetcode-query", () => {
	return {
		LeetCode: class {
			graphql() {
				return Promise.resolve(usFixture);
			}
		},
		LeetCodeCN: class {
			graphql() {
				return Promise.resolve(cnFixture);
			}
		},
	};
});
