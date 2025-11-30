// Cross-runtime env getter: prefers Node's process.env, falls back to Deno.env.get
export function getEnv(key: string): string | undefined {
	const g = globalThis as unknown as {
		Deno?: { env?: { get?: (k: string) => string } } & Record<string, unknown>;
		[k: string]: unknown;
	};
	if (
		typeof process !== "undefined" &&
		(process as unknown as { env?: NodeJS.ProcessEnv }).env
	)
		return process.env[key];
	const denoEnv = g?.Deno?.env as { get?: (k: string) => string } | undefined;
	const denoGet = denoEnv?.get?.bind?.(denoEnv);
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
