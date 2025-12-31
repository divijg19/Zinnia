import { beforeEach, describe, expect, it } from "vitest";
import { getEnv, requireEnv } from "../../lib/env";

describe("lib/env", () => {
	beforeEach(() => {
		// isolate test env
		delete process.env.TEST_VAR;
	});

	it("returns set env value via getEnv", () => {
		process.env.TEST_VAR = "hello";
		expect(getEnv("TEST_VAR")).toBe("hello");
	});

	it("requireEnv throws when missing", () => {
		delete process.env.TEST_VAR;
		expect(() => requireEnv("TEST_VAR")).toThrow();
	});
});
