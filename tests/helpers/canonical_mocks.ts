// Canonical test helpers that re-expose existing test mock utilities.
export * from "../_mockHelpers";

// Provide a small helper to clear the global test renderer seam used by loader.
export function clearInjectedRenderer() {
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		delete (globalThis as any).__STREAK_TEST_RENDERER;
	} catch {
		// ignore
	}
}

export default {
	clearInjectedRenderer,
};
