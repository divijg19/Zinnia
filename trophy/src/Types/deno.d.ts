// eslint-disable-next-line @typescript-eslint/no-explicit-any --- IGNORE ---
// declare const Deno: any; --- IGNORE ---

// Minimal types for Deno.env.get
declare namespace Deno {
	namespace env {
		function get(key: string): string | undefined;
	}
}
