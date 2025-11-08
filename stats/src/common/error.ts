export const TRY_AGAIN_LATER = "Please try again later";

export const SECONDARY_ERROR_MESSAGES: Record<string, string> = {
	MAX_RETRY:
		"You can deploy own instance or wait until public will be no longer limited",
	NO_TOKENS:
		"Please add an env variable called PAT_1 with your GitHub API token in vercel",
	USER_NOT_FOUND: "Make sure the provided username is not an organization",
	GRAPHQL_ERROR: TRY_AGAIN_LATER,
	GITHUB_REST_API_ERROR: TRY_AGAIN_LATER,
};

export class CustomError extends Error {
	type: string;
	secondaryMessage: string;

	constructor(message: string, type: string) {
		super(message);
		this.type = type;
		this.secondaryMessage = SECONDARY_ERROR_MESSAGES[type] || type;
	}

	static MAX_RETRY = "MAX_RETRY";
	static NO_TOKENS = "NO_TOKENS";
	static USER_NOT_FOUND = "USER_NOT_FOUND";
	static GRAPHQL_ERROR = "GRAPHQL_ERROR";
	static GITHUB_REST_API_ERROR = "GITHUB_REST_API_ERROR";
}

export class MissingParamError extends Error {
	missedParams: string[];
	secondaryMessage?: string;

	constructor(missedParams: string[], secondaryMessage?: string) {
		const msg = `Missing params ${missedParams
			.map((p) => `"${p}"`)
			.join(", ")} make sure you pass the parameters in URL`;
		super(msg);
		this.missedParams = missedParams;
		this.secondaryMessage = secondaryMessage;
	}
}

// Named exports are declared above; no further export re-exports needed.
