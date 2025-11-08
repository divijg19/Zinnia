export const whitelist = process.env.WHITELIST
	? process.env.WHITELIST.split(",")
	: undefined;

export const gistWhitelist = process.env.GIST_WHITELIST
	? process.env.GIST_WHITELIST.split(",")
	: undefined;

export const excludeRepositories = process.env.EXCLUDE_REPO
	? process.env.EXCLUDE_REPO.split(",")
	: [];
