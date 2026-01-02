// Lightweight env loader and access helpers
// - loads `.env` in non-production when available
// - exposes simple getters used across the codebase

export async function loadDotenv(): Promise<void> {
	if (process.env.NODE_ENV === "production") return;
	try {
		// dynamic import so production builds without dotenv don't fail
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const mod = await import("dotenv");
		try {
			mod.config();
		} catch {}
	} catch {}
}

// trigger best-effort dotenv load for developer convenience
void loadDotenv();

// Normalize common GitHub token env vars into PAT_1 for compatibility.
// This keeps deployments flexible (GITHUB_TOKEN, GH_TOKEN, etc.) while
// preserving the canonical PAT_N runtime selection logic used elsewhere.
try {
	if (!process.env.PAT_1) {
		const fallbacks = [
			"PAT",
			"GITHUB_TOKEN",
			"GH_TOKEN",
			"GH_PAT",
			"GITHUB_PAT",
			"GH_ACCESS_TOKEN",
		];
		for (const k of fallbacks) {
			const v = process.env[k];
			if (v && v.trim().length > 0) {
				try {
					process.env.PAT_1 = v.trim();
					if (process.env.TOKENS_DEBUG === "1") {
						// eslint-disable-next-line no-console
						console.info(`[env] seeded PAT_1 from ${k}`);
					}
				} catch {}
				break;
			}
		}
	}
} catch {}

export function getEnv(key: string): string | undefined {
	return process.env[key];
}

export function requireEnv(key: string): string {
	const v = getEnv(key);
	if (!v || v.length === 0) throw new Error(`Missing required env var: ${key}`);
	return v;
}

export function allEnv(): NodeJS.ProcessEnv {
	return process.env;
}

export default { loadDotenv, getEnv, requireEnv, allEnv };
