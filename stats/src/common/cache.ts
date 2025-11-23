import { clampValue } from "./utils.js";

const MIN = 60;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/**
 * Common durations in seconds.
 */
const DURATIONS = {
	ONE_MINUTE: MIN,
	FIVE_MINUTES: 5 * MIN,
	TEN_MINUTES: 10 * MIN,
	FIFTEEN_MINUTES: 15 * MIN,
	THIRTY_MINUTES: 30 * MIN,

	TWO_HOURS: 2 * HOUR,
	FOUR_HOURS: 4 * HOUR,
	SIX_HOURS: 6 * HOUR,
	EIGHT_HOURS: 8 * HOUR,
	TWELVE_HOURS: 12 * HOUR,

	ONE_DAY: DAY,
	TWO_DAY: 2 * DAY,
	SIX_DAY: 6 * DAY,
	TEN_DAY: 10 * DAY,
} as const;

/**
 * Common cache TTL values in seconds.
 */
const CACHE_TTL = {
	STATS_CARD: {
		DEFAULT: DURATIONS.ONE_DAY,
		MIN: DURATIONS.TWELVE_HOURS,
		MAX: DURATIONS.TWO_DAY,
	},
	TOP_LANGS_CARD: {
		DEFAULT: DURATIONS.SIX_DAY,
		MIN: DURATIONS.TWO_DAY,
		MAX: DURATIONS.TEN_DAY,
	},
	PIN_CARD: {
		DEFAULT: DURATIONS.TEN_DAY,
		MIN: DURATIONS.ONE_DAY,
		MAX: DURATIONS.TEN_DAY,
	},
	GIST_CARD: {
		DEFAULT: DURATIONS.TWO_DAY,
		MIN: DURATIONS.ONE_DAY,
		MAX: DURATIONS.TEN_DAY,
	},
	ERROR: DURATIONS.TEN_MINUTES,
} as const;

type ResolveArgs = { requested: number; def: number; min: number; max: number };

const resolveCacheSeconds = ({
	requested,
	def,
	min,
	max,
}: ResolveArgs): number => {
	let cacheSeconds = clampValue(
		Number.isNaN(requested) ? def : requested,
		min,
		max,
	);

	if (process.env.CACHE_SECONDS) {
		const envCacheSeconds = parseInt(process.env.CACHE_SECONDS, 10);
		if (!Number.isNaN(envCacheSeconds)) {
			cacheSeconds = envCacheSeconds;
		}
	}

	return cacheSeconds;
};

const disableCaching = (res: {
	setHeader: (k: string, v: string) => unknown;
}) => {
	// Disable caching for browsers, shared caches/CDNs, and GitHub Camo.
	res.setHeader(
		"Cache-Control",
		"no-cache, no-store, must-revalidate, max-age=0, s-maxage=0",
	);
	res.setHeader("Pragma", "no-cache");
	res.setHeader("Expires", "0");
};

const setCacheHeaders = (
	res: { setHeader: (k: string, v: string) => unknown },
	cacheSeconds: number,
) => {
	if (cacheSeconds < 1 || process.env.NODE_ENV === "development") {
		disableCaching(res);
		return;
	}

	res.setHeader(
		"Cache-Control",
		`max-age=${cacheSeconds}, ` +
			`s-maxage=${cacheSeconds}, ` +
			`stale-while-revalidate=${DURATIONS.ONE_DAY}`,
	);
};

const setErrorCacheHeaders = (res: {
	setHeader: (k: string, v: string) => unknown;
}) => {
	const envCacheSeconds = process.env.CACHE_SECONDS
		? parseInt(process.env.CACHE_SECONDS, 10)
		: NaN;
	if (
		(Number.isFinite(envCacheSeconds) && envCacheSeconds < 1) ||
		process.env.NODE_ENV === "development"
	) {
		disableCaching(res);
		return;
	}

	// Use lower cache period for errors.
	res.setHeader(
		"Cache-Control",
		`max-age=${CACHE_TTL.ERROR}, ` +
			`s-maxage=${CACHE_TTL.ERROR}, ` +
			`stale-while-revalidate=${DURATIONS.ONE_DAY}`,
	);
	// Mark as transient so observability can detect degraded responses.
	try {
		res.setHeader("X-Cache-Status", "transient");
	} catch (_e) {
		// ignore
	}
};

export {
	resolveCacheSeconds,
	setCacheHeaders,
	setErrorCacheHeaders,
	DURATIONS,
	CACHE_TTL,
};
