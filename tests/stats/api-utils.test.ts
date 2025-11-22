import { describe, expect, it, vi } from "vitest";
import {
	extractErrorMessages,
	handleApiError,
	setSvgHeaders,
	toNum,
	validateLocale,
} from "../../stats/src/common/api-utils.js";

describe("extractErrorMessages", () => {
	it("should extract message and secondaryMessage from error object", () => {
		const err = {
			message: "Test error",
			secondaryMessage: "Additional context",
		};
		const result = extractErrorMessages(err);
		expect(result.message).toBe("Test error");
		expect(result.secondaryMessage).toBe("Additional context");
	});

	it("should return default message for non-error objects", () => {
		const result = extractErrorMessages(null);
		expect(result.message).toBe("Something went wrong");
		expect(result.secondaryMessage).toBeUndefined();
	});

	it("should handle error with message only", () => {
		const err = { message: "Only message" };
		const result = extractErrorMessages(err);
		expect(result.message).toBe("Only message");
		expect(result.secondaryMessage).toBeUndefined();
	});

	it("should handle Error instances", () => {
		const err = new Error("Standard error");
		const result = extractErrorMessages(err);
		expect(result.message).toBe("Standard error");
		expect(result.secondaryMessage).toBeUndefined();
	});

	it("should handle error with falsy message", () => {
		const err = { message: "" };
		const result = extractErrorMessages(err);
		expect(result.message).toBe("Something went wrong");
	});
});

describe("handleApiError", () => {
	it("should set error cache headers and send error SVG", () => {
		const mockRes: any = {
			setHeader: vi.fn(),
			send: vi.fn(),
		};
		const err = {
			message: "Test error",
			secondaryMessage: "Test secondary",
		};

		handleApiError({
			res: mockRes,
			err,
			title_color: "fff",
			text_color: "000",
			bg_color: "ccc",
			border_color: "333",
			theme: "dark",
		});

		expect(mockRes.setHeader).toHaveBeenCalled();
		expect(mockRes.send).toHaveBeenCalled();
		const sentContent = mockRes.send.mock.calls[0][0];
		expect(sentContent).toContain("Test error");
		expect(sentContent).toContain("Test secondary");
	});

	it("should handle errors without secondary message", () => {
		const mockRes: any = {
			setHeader: vi.fn(),
			send: vi.fn(),
		};
		const err = new Error("Simple error");

		handleApiError({
			res: mockRes,
			err,
		});

		expect(mockRes.send).toHaveBeenCalled();
		const sentContent = mockRes.send.mock.calls[0][0];
		expect(sentContent).toContain("Simple error");
	});
});

describe("validateLocale", () => {
	it("should return false for valid locale", () => {
		const mockRes: any = { send: vi.fn() };

		const result = validateLocale({ locale: "en", res: mockRes });

		expect(result).toBe(false);
		expect(mockRes.send).not.toHaveBeenCalled();
	});

	it("should return true and send error for invalid locale", () => {
		const mockRes: any = { send: vi.fn() };

		const result = validateLocale({
			locale: "invalid_locale_xyz",
			res: mockRes,
			title_color: "fff",
			text_color: "000",
			bg_color: "ccc",
			border_color: "333",
			theme: "dark",
		});

		expect(result).toBe(true);
		expect(mockRes.send).toHaveBeenCalled();
		const sentContent = mockRes.send.mock.calls[0][0];
		expect(sentContent).toContain("Something went wrong");
		expect(sentContent).toContain("Language not found");
	});

	it("should return false when locale is undefined", () => {
		const mockRes: any = { send: vi.fn() };

		const result = validateLocale({ locale: undefined, res: mockRes });

		expect(result).toBe(false);
		expect(mockRes.send).not.toHaveBeenCalled();
	});

	it("should return false when locale is empty string", () => {
		const mockRes: any = { send: vi.fn() };

		const result = validateLocale({ locale: "", res: mockRes });

		expect(result).toBe(false);
		expect(mockRes.send).not.toHaveBeenCalled();
	});
});

describe("toNum", () => {
	it("should parse valid string numbers", () => {
		expect(toNum("123")).toBe(123);
		expect(toNum("0")).toBe(0);
		expect(toNum("-456")).toBe(-456);
	});

	it("should return number as-is", () => {
		expect(toNum(789)).toBe(789);
		expect(toNum(0)).toBe(0);
		expect(toNum(-123)).toBe(-123);
	});

	it("should return undefined for invalid inputs", () => {
		expect(toNum(undefined)).toBeUndefined();
		expect(toNum(null)).toBeUndefined();
		expect(toNum("")).toBeUndefined();
	});

	it("should return undefined for non-numeric strings", () => {
		expect(toNum("abc")).toBeUndefined();
	});
	it("should handle whitespace in strings", () => {
		expect(toNum("  456  ")).toBe(456);
	});

	it("should parse partial numbers correctly", () => {
		expect(toNum("123abc")).toBe(123);
	});
});

describe("setSvgHeaders", () => {
	it("should set Content-Type header with charset for GitHub embeds", () => {
		const mockRes: any = { setHeader: vi.fn() };

		setSvgHeaders(mockRes);

		expect(mockRes.setHeader).toHaveBeenCalledWith(
			"Content-Type",
			"image/svg+xml; charset=utf-8",
		);
	});

	it("should set X-Content-Type-Options security header", () => {
		const mockRes: any = { setHeader: vi.fn() };

		setSvgHeaders(mockRes);

		expect(mockRes.setHeader).toHaveBeenCalledWith(
			"X-Content-Type-Options",
			"nosniff",
		);
	});

	it("should call setHeader exactly twice", () => {
		const mockRes: any = { setHeader: vi.fn() };

		setSvgHeaders(mockRes);

		expect(mockRes.setHeader).toHaveBeenCalledTimes(2);
	});
});
