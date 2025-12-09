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
	// Build headers and send GraphQL POST
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		"User-Agent": "zinnia/1.0 (+trophy)",
	};
	if (token) headers.Authorization = `bearer ${token}`;

	let response: Response;
	try {
		response = await fetch("https://api.github.com/graphql", {
			method: "POST",
			headers,
			body: JSON.stringify({ query, variables }),
		});
	} catch (err: any) {
		// Network / DNS / Abort
		throw new ServiceError(
			`Network error fetching GitHub GraphQL: ${String(err?.message ?? err)}`,
			EServiceKindError.NETWORK,
		);
	}

	// Try to parse JSON body defensively
	let bodyJson: unknown;
	const text = await response.text();
	if (text) {
		try {
			bodyJson = JSON.parse(text);
		} catch {
			throw new ServiceError(
				`Invalid JSON response from GitHub (status=${response.status})`,
				EServiceKindError.INVALID_RESPONSE,
			);
		}
	}

	// If HTTP status indicates error, try to convert body into ServiceError
	if (!response.ok) {
		throw handleError(
			bodyJson as GithubErrorResponse | GithubExceedError | undefined,
			response.status,
		);
	}

	const responseData = bodyJson as
		| QueryDefaultResponse<{ user: T }>
		| undefined;
	const user = (responseData as any)?.data?.user;
	if (user) return user as T;

	// No user found — attempt to surface a meaningful error from body
	throw handleError(
		bodyJson as GithubErrorResponse | GithubExceedError | undefined,
		response.status,
	);
}

function handleError(
	reponseErrors: GithubErrorResponse | GithubExceedError | undefined,
	status = 0,
): ServiceError {
	// Normalize possible shapes from GitHub (GraphQL and REST)
	const body: any = reponseErrors as any;

	// Check common GraphQL errors array
	const errorsArray: Array<{ message?: string; type?: string }> =
		(body && (body.errors || body.data?.errors)) || [];

	// Inspect messages for rate-limit or auth signals
	const allMessages = `${errorsArray
		.map((e) => e.message)
		.filter(Boolean)
		.join(" ")} ${body?.message || ""}`;
	const lc = String(allMessages).toLowerCase();

	if (
		lc.includes("rate limit") ||
		lc.includes("rate_limited") ||
		lc.includes("rate_limit")
	) {
		throw new ServiceError("Rate limit exceeded", EServiceKindError.RATE_LIMIT);
	}

	if (
		status === 401 ||
		status === 403 ||
		lc.includes("bad credentials") ||
		lc.includes("unauthorized")
	) {
		throw new ServiceError(
			"Unauthorized / Bad credentials",
			EServiceKindError.AUTH,
		);
	}

	// If the response included a message, surface it
	if (body?.message) {
		throw new ServiceError(
			String(body.message),
			EServiceKindError.INVALID_RESPONSE,
		);
	}

	// Last resort
	throw new ServiceError("Unknown GitHub error", EServiceKindError.NOT_FOUND);
}
