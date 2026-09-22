import { afterEach, describe, expect, it, vi } from "vitest";
import {
	applyTheme,
	getPreferredTheme,
	getStoredTheme,
	initPageTheme,
	resolveTheme,
	STORAGE_KEY,
} from "../../demo/utils/page-theme.js";

function stubMatchMedia(dark) {
	Object.defineProperty(window, "matchMedia", {
		value: vi.fn().mockReturnValue({ matches: dark }),
		configurable: true,
		writable: true,
	});
}

afterEach(() => {
	window.localStorage.clear();
	delete document.documentElement.dataset.pageTheme;
	// @ts-expect-error test cleanup
	delete window.matchMedia;
});

describe("demo page theme", () => {
	it("prefers a stored theme over the OS setting", () => {
		window.localStorage.setItem(STORAGE_KEY, "dark");
		stubMatchMedia(false);
		expect(getStoredTheme()).toBe("dark");
		expect(resolveTheme()).toBe("dark");
	});

	it("falls back to the OS setting without stored theme", () => {
		stubMatchMedia(true);
		expect(getStoredTheme()).toBeNull();
		expect(resolveTheme()).toBe("dark");
	});

	it("defaults to light without stored theme or matchMedia", () => {
		expect(getPreferredTheme()).toBe("light");
		expect(resolveTheme()).toBe("light");
	});

	it("applies and persists the theme", () => {
		expect(applyTheme("dark")).toBe("dark");
		expect(document.documentElement.dataset.pageTheme).toBe("dark");
		expect(window.localStorage.getItem(STORAGE_KEY)).toBe("dark");
		expect(applyTheme("bogus")).toBe("light");
	});

	it("toggles the theme from the button", () => {
		const button = document.createElement("button");
		document.body.appendChild(button);
		initPageTheme(button);
		expect(document.documentElement.dataset.pageTheme).toBe("light");
		expect(button.getAttribute("aria-pressed")).toBe("false");

		button.click();
		expect(document.documentElement.dataset.pageTheme).toBe("dark");
		expect(button.getAttribute("aria-pressed")).toBe("true");
		expect(button.getAttribute("aria-label")).toBe("Switch to light mode");

		button.click();
		expect(document.documentElement.dataset.pageTheme).toBe("light");
	});
});
