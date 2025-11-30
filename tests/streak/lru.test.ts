import { expect, test } from "vitest";
import { LRUCache } from "../../streak/src/lru";

test("LRUCache evicts least recently used and respects ttl", async () => {
	const c = new LRUCache(3, 60); // small max, long ttl
	c.set("a", { body: "a", type: "svg", ts: Date.now() });
	c.set("b", { body: "b", type: "svg", ts: Date.now() });
	c.set("c", { body: "c", type: "svg", ts: Date.now() });
	// touch 'a' to make it most recently used
	expect(c.get("a")?.body).toBe("a");
	// add d => should evict 'b' (least recently used)
	c.set("d", { body: "d", type: "svg", ts: Date.now() });
	expect(c.get("b")).toBeUndefined();
	expect(c.get("a")?.body).toBe("a");
	expect(c.get("c")?.body).toBe("c");
	expect(c.get("d")?.body).toBe("d");
});

test("LRUCache ttl expires entries", async () => {
	const ttlSeconds = 0.001; // 1ms
	const c = new LRUCache(10, ttlSeconds);
	c.set("x", { body: "x", type: "svg", ts: Date.now() });
	// immediate read should be present
	expect(c.get("x")?.body).toBe("x");
	// wait 20ms to expire
	await new Promise((r) => setTimeout(r, 20));
	expect(c.get("x")).toBeUndefined();
});
