// Canonical loader for the trophy package renderer.
// Mirrors the existing search order used by `trophy/api/index.ts` but
// centralizes it so other handlers can reuse the same logic.
export async function loadTrophyModule(): Promise<any> {
	const preferSrc =
		process.env.TROPHY_PREFER_SRC === "1" ||
		process.env.NODE_ENV !== "production";
	const isTest =
		typeof process !== "undefined" &&
		(process.env.VITEST === "1" ||
			process.env.NODE_ENV === "test" ||
			typeof (globalThis as any).vi !== "undefined");

	const candidates: string[] = [];
	if (isTest) {
		// Use literal specifiers that Vitest mocks commonly target so `vi.doMock` matches.
		candidates.push("../../trophy/src/renderer");
		candidates.push("../../trophy/src/renderer.js");
		candidates.push("../../trophy/src/index");
		candidates.push("../../trophy/src/index.js");
		candidates.push("../dist/index");
		candidates.push("../dist/index.js");
		candidates.push("./dist/index.js");
	} else {
		// Non-test environments: prefer built artifacts or package locations using file URLs
		const paths = [];
		if (preferSrc) {
			paths.push("../../trophy/src/renderer.ts");
			paths.push("../../trophy/src/renderer.js");
			paths.push("../../trophy/src/index.ts");
			paths.push("../../trophy/src/index.js");
			paths.push("../../api/_build/trophy/renderer.js");
			paths.push("../../api/_build/trophy/index.js");
			paths.push("../../trophy/dist/index.js");
			paths.push("../../trophy/dist/renderer.js");
		} else {
			paths.push("../../api/_build/trophy/renderer.js");
			paths.push("../../api/_build/trophy/index.js");
			paths.push("../../trophy/dist/index.js");
			paths.push("../../trophy/dist/renderer.js");
			paths.push("../../trophy/src/renderer.js");
			paths.push("../../trophy/src/renderer.ts");
		}
		for (const p of paths) {
			try {
				const u = new URL(p, import.meta.url);
				candidates.push(u.href);
			} catch {
				// ignore URL resolution failures
			}
		}
	}

	for (const p of candidates) {
		try {
			// dynamic import of candidate
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const mod = await import(p);
			return mod;
		} catch {
			// try next
		}
	}
	throw new Error("Trophy module not found (tried dist and src paths)");
}

export default { loadTrophyModule };
