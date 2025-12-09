import {
	EServiceKindError,
	type GithubErrorResponse,
	type GithubExceedError,
	type QueryDefaultResponse,
	ServiceError,
} from "../Types/index.ts";

export async function requestGithubData<T = unknown>(
	query: string,
	variables: { [key: string]: string },
	token = "",
): Promise<T> {
	// Build headers only when a token is provided.
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		"User-Agent": "zinnia/1.0 (+trophy)",
	};
	if (token) {
		headers.Authorization = `bearer ${token}`;
	}

	const response = await fetch("https://api.github.com/graphql", {
		method: "POST",
		headers,
		body: JSON.stringify({ query, variables }),
	});

	const responseData = (await response.json()) as QueryDefaultResponse<{
		user: T;
	}>;

	if (responseData?.data?.user) {
		return responseData.data.user;
	}

	throw handleError(
		responseData as unknown as GithubErrorResponse | GithubExceedError,
	);
}

function handleError(
	reponseErrors: GithubErrorResponse | GithubExceedError,
): ServiceError {
	let isRateLimitExceeded = false;
	const arrayErrors = (reponseErrors as GithubErrorResponse)?.errors || [];
	const objectError = (reponseErrors as GithubExceedError) || {};

	if (Array.isArray(arrayErrors)) {
		isRateLimitExceeded = arrayErrors.some((error) =>
			error.type.includes(EServiceKindError.RATE_LIMIT),
		);
	}

	if (objectError?.message) {
		isRateLimitExceeded = objectError?.message.includes("rate limit");
	}

	if (isRateLimitExceeded) {
		throw new ServiceError("Rate limit exceeded", EServiceKindError.RATE_LIMIT);
	}

	throw new ServiceError("unknown error", EServiceKindError.NOT_FOUND);
}
