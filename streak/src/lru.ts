export type CacheValue = {
	body: string | Buffer;
	type: "svg" | "png";
	ts: number;
};

export class LRUCache {
	#map: Map<string, CacheValue>;
	#max: number;
	#ttl: number;

	constructor(max = 512, ttlSeconds = 300) {
		this.#map = new Map();
		this.#max = max;
		this.#ttl = ttlSeconds * 1000;
	}

	get(key: string): CacheValue | undefined {
		const v = this.#map.get(key);
		if (!v) return undefined;
		if (Date.now() - v.ts > this.#ttl) {
			this.#map.delete(key);
			return undefined;
		}
		// touch
		this.#map.delete(key);
		this.#map.set(key, v);
		return v;
	}

	set(key: string, value: Omit<CacheValue, "ts"> | CacheValue) {
		if (this.#map.has(key)) this.#map.delete(key);
		else if (this.#map.size >= this.#max) {
			const it = this.#map.keys().next();
			if (!it.done) this.#map.delete(it.value);
		}
		const saved: CacheValue = { ...(value as CacheValue), ts: Date.now() };
		this.#map.set(key, saved);
	}

	del(key: string) {
		this.#map.delete(key);
	}

	clear() {
		this.#map.clear();
	}
}

export const DefaultLRU = new LRUCache();
