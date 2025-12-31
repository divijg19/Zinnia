// Simple cache adapter: in-memory Map + optional Upstash REST KV (GET/SET/EXPIRE)

type Cache = {
	get: (key: string) => Promise<string | null>;
	set: (key: string, value: string, ttlSeconds?: number) => Promise<void>;
};

const IN_MEMORY: Cache = (() => {
	const map = new Map<string, { v: string; expiresAt: number | null }>();
	return {
		get: async (key: string) => {
			const item = map.get(key);
			if (!item) return null;
			if (item.expiresAt && Date.now() > item.expiresAt) {
				map.delete(key);
				return null;
			}
			return item.v;
		},
		set: async (key: string, value: string, ttlSeconds?: number) => {
			const expires =
				ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
			map.set(key, { v: value, expiresAt: expires });
		},
	};
})();

// Minimal Upstash REST wrapper (no deps)
async function upstashCall(
	url: string,
	token: string,
	cmd: string,
	...args: string[]
) {
	const body = JSON.stringify([cmd, ...args]);
	const res = await fetch(url, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body,
	});
	if (!res.ok) {
		// Try to capture response text for diagnostics but limit size
		let text = "";
		try {
			text = (await res.text()).slice(0, 200);
		} catch {}
		const msg = `upstash request failed: ${res.status}${text ? `:${text}` : ""}`;
		throw new Error(msg);
	}
	const j = await res.json();
	return j?.result ?? null;
}

function findEnv(...names: string[]) {
	for (const n of names) {
		if (process.env[n]) return process.env[n] as string;
		const up = n.toUpperCase();
		if (process.env[up]) return process.env[up] as string;
		const low = n.toLowerCase();
		if (process.env[low]) return process.env[low] as string;
	}
	return undefined;
}

async function createUpstashCache(): Promise<Cache | null> {
	const prefix = (process.env.UPSTASH_PREFIX || "UPSTASH").toUpperCase();
	const url =
		findEnv(
			`${prefix}_KV_REST_API_URL`,
			`${prefix}_REST_URL`,
			"UPSTASH_REST_URL",
			"ZINNIA_KV_REST_API_URL",
		) || undefined;
	const token =
		findEnv(
			`${prefix}_KV_REST_API_TOKEN`,
			`${prefix}_REST_TOKEN`,
			"UPSTASH_REST_TOKEN",
			"ZINNIA_KV_REST_API_TOKEN",
		) || undefined;
	if (!url || !token) return null;
	return {
		get: async (key: string) => {
			try {
				const r = await upstashCall(url, token, "GET", key);
				if (r === null || r === undefined) return null;
				return String(r);
			} catch (e) {
				try {
					if (process.env.UPSTASH_DEBUG === "1")
						console.warn("streak: upstash GET failed", String(e));
				} catch {}
				return null;
			}
		},
		set: async (key: string, value: string, ttlSeconds = 300) => {
			try {
				await upstashCall(url, token, "SET", key, value);
				try {
					await upstashCall(
						url,
						token,
						"EXPIRE",
						key,
						String(Math.max(1, Math.floor(ttlSeconds))),
					);
				} catch (e) {
					try {
						if (process.env.UPSTASH_DEBUG === "1")
							console.warn("streak: upstash EXPIRE failed", String(e));
					} catch {}
					// ignore expire failures
				}
			} catch (e) {
				try {
					if (process.env.UPSTASH_DEBUG === "1")
						console.warn("streak: upstash SET failed", String(e));
				} catch {}
				// do not rethrow — fall back to in-memory caching
			}
		},
	};
}

let CACHE: Cache | null = null;

export async function getCache(): Promise<Cache> {
	if (CACHE) return CACHE;
	const isTest =
		typeof process !== "undefined" &&
		(process.env.VITEST === "1" ||
			process.env.NODE_ENV === "test" ||
			typeof (globalThis as any).vi !== "undefined");
	if (isTest) {
		CACHE = IN_MEMORY;
		return CACHE;
	}
	const us = await createUpstashCache();
	if (us) {
		CACHE = us;
		return CACHE;
	}
	CACHE = IN_MEMORY;
	return CACHE;
}
