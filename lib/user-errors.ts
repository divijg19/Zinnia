/**
 * Recognising "that GitHub user does not exist" across every fetcher.
 *
 * Each package raises its own shape for the same condition:
 * - `stats`/`top-langs` throw `CustomError` with `type === "USER_NOT_FOUND"`
 *   (from `stats/src/common/error.ts`), or `MissingParamError` for bad input.
 * - `streak` and `trophy` fetch through their own services and surface a
 *   generic error.
 *
 * Upstream, a nonexistent username produced `<service>: internal error` on
 * every card: an accurate description of the server, and useless to the person
 * who typo'd a username in their README. Classifying it once here lets the
 * route report `USER_NOT_FOUND` and name the username it could not resolve.
 */

/** `stats/src/common/error.ts` uses these as bare string constants. */
const USER_NOT_FOUND_TYPES = new Set(["USER_NOT_FOUND", "NOT_FOUND"]);

/** Message fragments GitHub returns for an unresolvable login. */
const NOT_FOUND_PATTERNS = [
	/could not resolve to a user/i,
	/could not find user/i,
	/user not found/i,
	/\bNOT_FOUND\b/,
];

export function isUserNotFoundError(err: unknown): boolean {
	if (!err || typeof err !== "object") return false;
	const type = (err as { type?: unknown }).type;
	if (typeof type === "string" && USER_NOT_FOUND_TYPES.has(type)) return true;
	const message = (err as { message?: unknown }).message;
	if (typeof message !== "string" || !message) return false;
	return NOT_FOUND_PATTERNS.some((re) => re.test(message));
}

/**
 * Card text for an unresolvable username. Names the username so the embedder
 * can see which link is wrong without reading server logs.
 */
export function userNotFoundMessage(username?: unknown): string {
	const name = typeof username === "string" ? username.trim() : "";
	return name ? `Could not find user "${name}"` : "Could not find that user";
}
