// Cross-runtime env getter: prefers Node's process.env, falls back to Deno.env.get
export function getEnv(key: string): string | undefined {
	// deno-lint-ignore no-explicit-any
	const g: any = globalThis as any;
	if (typeof process !== "undefined" && process?.env) return process.env[key];
	const denoGet = g?.Deno?.env?.get?.bind?.(g.Deno?.env);
	if (denoGet) return denoGet(key);
	return undefined;
}

const enableLogging = getEnv("ENV_TYPE") !== "test";

export const Logger = {
	log(message: unknown): void {
		if (!enableLogging) return;
		console.log(message);
	},
	error(message: unknown): void {
		if (!enableLogging) return;
		console.error(message);
	},
	warn(message: unknown): void {
		if (!enableLogging) return;
		console.warn(message);
	},
};
