/**
 * Snapshot and restore `PAT_*` env vars around tests that mutate them.
 *
 * Extracted verbatim from the per-file duplicates so every wrapper test
 * saves/restores the same way.
 */
export function snapshotPatEnv(): Record<string, string | undefined> {
	const saved: Record<string, string | undefined> = {};
	for (const k of Object.keys(process.env)) {
		if (/^PAT_\d*$/.test(k)) {
			saved[k] = process.env[k];
			delete process.env[k];
		}
	}
	return saved;
}

export function restorePatEnv(saved: Record<string, string | undefined>): void {
	for (const k of Object.keys(process.env)) {
		if (/^PAT_\d*$/.test(k)) delete process.env[k];
	}
	for (const [k, v] of Object.entries(saved)) {
		if (v !== undefined) process.env[k] = v;
	}
}
