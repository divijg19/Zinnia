// @ts-check

import { isLocaleAvailable } from "../translations.js";
import { setErrorCacheHeaders } from "./cache.js";
import { renderError } from "./utils.ts";

/**
 * Extract error message and secondaryMessage from an error object.
 * @param {unknown} err - The error object.
 * @returns {{ message: string, secondaryMessage?: string }}
 */
export const extractErrorMessages = (err) => {
	const hasMessage =
		err && typeof err === "object" && "message" in err && err.message;
	const hasSecondary =
		err &&
		typeof err === "object" &&
		"secondaryMessage" in err &&
		err.secondaryMessage;
	const message = hasMessage ? String(err.message) : "Something went wrong";
	const secondaryMessage = hasSecondary
		? String(err.secondaryMessage)
		: undefined;
	return { message, secondaryMessage };
};

/**
 * Common error handler for API endpoints.
 * Sets error cache headers and sends error SVG with proper theming.
 * @param {Object} options - Handler options.
 * @param {any} options.res - Response object.
 * @param {unknown} options.err - Error object.
 * @param {string=} options.title_color - Title color for error card.
 * @param {string=} options.text_color - Text color for error card.
 * @param {string=} options.bg_color - Background color for error card.
 * @param {string=} options.border_color - Border color for error card.
 * @param {string=} options.theme - Theme for error card.
 */
export const handleApiError = ({
	res,
	err,
	title_color,
	text_color,
	bg_color,
	border_color,
	theme,
}) => {
	setErrorCacheHeaders(res);
	const { message, secondaryMessage } = extractErrorMessages(err);
	return res.send(
		renderError({
			message,
			secondaryMessage,
			renderOptions: {
				title_color,
				text_color,
				bg_color,
				border_color,
				theme,
			},
		}),
	);
};

/**
 * Validate locale and return error response if invalid.
 * @param {Object} options - Validation options.
 * @param {string=} options.locale - Locale to validate.
 * @param {any} options.res - Response object.
 * @param {string=} options.title_color - Title color for error card.
 * @param {string=} options.text_color - Text color for error card.
 * @param {string=} options.bg_color - Background color for error card.
 * @param {string=} options.border_color - Border color for error card.
 * @param {string=} options.theme - Theme for error card.
 * @returns {boolean} - Returns true if locale is invalid (error sent), false if valid.
 */
export const validateLocale = ({
	locale,
	res,
	title_color,
	text_color,
	bg_color,
	border_color,
	theme,
}) => {
	if (locale && !isLocaleAvailable(locale)) {
		res.send(
			renderError({
				message: "Something went wrong",
				secondaryMessage: "Language not found",
				renderOptions: {
					title_color,
					text_color,
					bg_color,
					border_color,
					theme,
				},
			}),
		);
		return true; // Invalid locale, error sent
	}
	return false; // Valid locale
};

/**
 * Parse a value to number or return undefined.
 * @param {string|number|undefined|null} v - Value to parse.
 * @returns {number|undefined} - Parsed number or undefined.
 */
export const toNum = (v) => {
	if (v === undefined || v === null || v === "") return undefined;
	const n = typeof v === "number" ? v : parseInt(String(v), 10);
	return Number.isNaN(n) ? undefined : n;
};

/**
 * Set proper SVG headers for GitHub README embeds.
 * Ensures correct Content-Type with charset and security headers.
 * @param {any} res - Response object.
 */
export const setSvgHeaders = (res) => {
	res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
	res.setHeader("X-Content-Type-Options", "nosniff");
};
