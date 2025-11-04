const enableLogging = Deno.env.get("ENV_TYPE") !== "test";

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
