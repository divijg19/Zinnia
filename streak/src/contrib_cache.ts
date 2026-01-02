import { getCache } from "./cache.ts";

type ContribMeta = {
	ts: number; // epoch ms when cached
	lastDate?: string; // YYYY-MM-DD
	lastFullResyncTs?: number;
};

const PAYLOAD_KEY = (username: string) => `streak:contribs:${username}`;
const META_KEY = (username: string) => `streak:contribs:${username}:meta`;

export async function readContribCache(
	username: string,
): Promise<{ days: any[]; meta: ContribMeta | null } | null> {
	try {
		const c = await getCache();
		const raw = await c.get(PAYLOAD_KEY(username));
		const rawMeta = await c.get(META_KEY(username));
		if (!raw) return null;
		const days = JSON.parse(raw);
		let meta: ContribMeta | null = null;
		if (rawMeta) {
			try {
				meta = JSON.parse(rawMeta);
			} catch {
				meta = null;
			}
		}
		return { days, meta };
	} catch (e) {
		try {
			if (process.env.STREAK_DEBUG === "1")
				console.warn("contrib_cache: read failed", String(e));
		} catch {}
		return null;
	}
}

export async function writeContribCache(
	username: string,
	days: any[],
	meta: Partial<ContribMeta> = {},
	ttlSeconds = 259200,
) {
	try {
		const c = await getCache();
		await c.set(PAYLOAD_KEY(username), JSON.stringify(days), ttlSeconds);
		// Ensure our generated `ts` (cache timestamp) overrides any provided
		// value in `meta` by spreading `meta` first and placing `ts` last.
		const fullMeta: ContribMeta = { ...(meta as ContribMeta), ts: Date.now() };
		await c.set(META_KEY(username), JSON.stringify(fullMeta), ttlSeconds);
	} catch (e) {
		try {
			if (process.env.STREAK_DEBUG === "1")
				console.warn("contrib_cache: write failed", String(e));
		} catch {}
	}
}

export async function clearContribCache(username: string) {
	try {
		const c = await getCache();
		await c.set(PAYLOAD_KEY(username), JSON.stringify([]), 1);
		await c.set(META_KEY(username), JSON.stringify({ ts: 0 }), 1);
	} catch (_) {}
}

export async function readContribMeta(
	username: string,
): Promise<ContribMeta | null> {
	try {
		const c = await getCache();
		const raw = await c.get(META_KEY(username));
		if (!raw) return null;
		try {
			return JSON.parse(raw);
		} catch {
			return null;
		}
	} catch (_) {
		return null;
	}
}

export type { ContribMeta };
