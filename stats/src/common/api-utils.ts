import { isLocaleAvailable } from "../translations.js";
import { setErrorCacheHeaders } from "./cache.js";
import { renderError } from "./utils.js";

type ErrorWithMessage = {
	message?: string;
	secondaryMessage?: string;
};

type RenderOptions = {
	title_color?: string;
	text_color?: string;
	bg_color?: string;
	border_color?: string;
	theme?: string;
};

// Reuse RenderOptions to avoid duplication and satisfy linter
type ResponseLike = {
	setHeader: (name: string, value: string) => unknown;
	send: (body: string) => unknown;
};

type ApiErrorOptions = {
	res: ResponseLike;
	err: unknown;
} & RenderOptions;

type ValidateLocaleOptions = {
	locale?: string;
	res: ResponseLike;
} & RenderOptions;

/**
 * Extract error message and secondaryMessage from an error object.
 */
export const extractErrorMessages = (
	err: unknown,
): { message: string; secondaryMessage?: string } => {
	const hasMessage =
		err && typeof err === "object" && "message" in err && err.message;
	const hasSecondary =
		err &&
		typeof err === "object" &&
		"secondaryMessage" in err &&
		err.secondaryMessage;
	const message = hasMessage
		? String((err as ErrorWithMessage).message)
		: "Something went wrong";
	const secondaryMessage = hasSecondary
		? String((err as ErrorWithMessage).secondaryMessage)
		: undefined;
	return { message, secondaryMessage };
};

/**
 * Common error handler for API endpoints.
 * Sets error cache headers and sends error SVG with proper theming.
 */
export const handleApiError = ({
	res,
	err,
	title_color,
	text_color,
	bg_color,
	border_color,
	theme,
}: ApiErrorOptions) => {
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
 * Returns true if locale is invalid (error sent), false if valid.
 */
export const validateLocale = ({
	locale,
	res,
	title_color,
	text_color,
	bg_color,
	border_color,
	theme,
}: ValidateLocaleOptions): boolean => {
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
 */
export const toNum = (
	v: string | number | undefined | null,
): number | undefined => {
	if (v === undefined || v === null || v === "") return undefined;
	const n = typeof v === "number" ? v : parseInt(String(v), 10);
	return Number.isNaN(n) ? undefined : n;
};

/**
 * Set proper SVG headers for GitHub README embeds.
 * Ensures correct Content-Type with charset and security headers.
 */
export const setSvgHeaders = (res: ResponseLike): void => {
	res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
	res.setHeader("X-Content-Type-Options", "nosniff");
	// Ensure caching proxies/clients vary on encoding
	res.setHeader("Vary", "Accept-Encoding");
};
