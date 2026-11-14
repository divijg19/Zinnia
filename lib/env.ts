// Lightweight env loader and access helpers
// - loads `.env` in non-production when available
// - exposes simple getters used across the codebase

/**
 * Read a local `.env` file into `process.env`.
 *
 * Node has done this natively since 20.6, so there is no dependency for it.
 * Variables that are already set are left alone, and a missing file throws -
 * which is the normal case in production and in CI, where the platform
 * injects the variables instead.
 */
export async function loadEnvFile(): Promise<void> {
	if (process.env.NODE_ENV === "production") return;
	try {
		process.loadEnvFile();
	} catch {}
}

// trigger best-effort .env load for developer convenience
void loadEnvFile();

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

export default { loadEnvFile, getEnv, requireEnv, allEnv };
