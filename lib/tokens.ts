const PAT_KEYS = ["PAT_1", "PAT_2", "PAT_3", "PAT_4", "PAT_5"] as const;

export function getGithubPAT(): string | undefined {
	for (const key of PAT_KEYS) {
		const t = process.env[key];
		if (t && t.trim().length > 0) return t.trim();
	}
	return undefined;
}

export { PAT_KEYS };
