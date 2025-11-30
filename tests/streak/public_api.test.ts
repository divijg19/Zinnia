import { describe, expect, it } from "vitest";
import {
	COLORS,
	generateCard,
	generateDemoSvg,
	generateErrorCard,
	getTelemetry,
	getTranslations,
	incrementPngFallback,
	normalizeThemeName,
	TRANSLATIONS,
} from "../../streak/src/index.js";

describe("public API surface", () => {
	it("exports core functions and constants", () => {
		expect(typeof generateCard).toBe("function");
		expect(typeof generateErrorCard).toBe("function");
		expect(typeof generateDemoSvg).toBe("function");
		expect(typeof getTranslations).toBe("function");
		expect(typeof normalizeThemeName).toBe("function");
		expect(typeof TRANSLATIONS).toBe("object");
		expect(Array.isArray(COLORS)).toBe(true);
		expect(typeof incrementPngFallback).toBe("function");
		expect(typeof getTelemetry).toBe("function");
	});
});
