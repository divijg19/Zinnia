import { CustomError } from "./error.js";
import { logger } from "./utils.js";

// Script variables.

// Count the number of GitHub API tokens available.
const PATs = Object.keys(process.env).filter((key) =>
	/PAT_\d*$/.exec(key),
).length;
const RETRIES = process.env.NODE_ENV === "test" ? 7 : PATs;

export type FetcherFunction<V> = (
	variables: V,
	token: string | undefined,
	retriesForTests?: number,
) => Promise<{
	data: {
		data?: any;
		errors?: Array<{
			type?: string;
			message?: string;
		}>;
	};
	statusText: string;
	response?: {
		data?: {
			message?: string;
		};
	};
}>;

/**
 * Try to execute the fetcher function until it succeeds or the max number of retries is reached.
 *
 * @param fetcher The fetcher function.
 * @param variables Object with arguments to pass to the fetcher function.
 * @param retries How many times to retry.
 * @returns The response from the fetcher function.
 */
export const retryer = async <V>(
	fetcher: FetcherFunction<V>,
	variables: V,
	retries = 0,
): Promise<{
	data: {
		data?: any;
		errors?: Array<{
			type?: string;
			message?: string;
		}>;
	};
	statusText: string;
	response?: {
		data?: {
			message?: string;
		};
	};
}> => {
	if (!RETRIES) {
		throw new CustomError("No GitHub API tokens found", CustomError.NO_TOKENS);
	}

	if (retries > RETRIES) {
		throw new CustomError(
			"Downtime due to GitHub API rate limiting",
			CustomError.MAX_RETRY,
		);
	}

	try {
		// try to fetch with the first token since RETRIES is 0 index i'm adding +1
		const response = await fetcher(
			variables,
			process.env[`PAT_${retries + 1}`] || "",
			// used in tests for faking rate limit
			retries,
		);

		// react on both type and message-based rate-limit signals.
		// https://github.com/anuraghazra/github-readme-stats/issues/4425
		const errors = response?.data?.errors;
		const errorType = errors?.[0]?.type;
		const errorMsg = errors?.[0]?.message || "";
		const isRateLimited =
			(errors && errorType === "RATE_LIMITED") || /rate limit/i.test(errorMsg);

		// if rate limit is hit increase the RETRIES and recursively call the retryer
		// with username, and current RETRIES
		if (isRateLimited) {
			logger.log(`PAT_${retries + 1} Failed`);
			retries++;
			// directly return from the function
			return retryer(fetcher, variables, retries);
		}

		// finally return the response
		return response;
	} catch (err: unknown) {
		// prettier-ignore
		// also checking for bad credentials if any tokens gets invalidated
		const isBadCredential =
			err &&
			typeof err === "object" &&
			"response" in err &&
			err.response &&
			typeof err.response === "object" &&
			"data" in err.response &&
			err.response.data &&
			typeof err.response.data === "object" &&
			"message" in err.response.data &&
			err.response.data.message === "Bad credentials";
		const isAccountSuspended =
			err &&
			typeof err === "object" &&
			"response" in err &&
			err.response &&
			typeof err.response === "object" &&
			"data" in err.response &&
			err.response.data &&
			typeof err.response.data === "object" &&
			"message" in err.response.data &&
			err.response.data.message === "Sorry. Your account was suspended.";

		if (isBadCredential || isAccountSuspended) {
			logger.log(`PAT_${retries + 1} Failed`);
			retries++;
			// directly return from the function
			return retryer(fetcher, variables, retries);
		}

		throw err;
	}
};

export { RETRIES };
