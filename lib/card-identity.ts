/**
 * Canonical identity for a card URL, shared by the render cache and the
 * profile README / manifest parity check.
 *
 * `?user=` and `?username=` name the same account - every route accepts both.
 * If the two spellings produce different identities, a harmless rename in the
 * README fails the parity check *and* orphans the warmed render, leaving the
 * embedded card to pay the cold path. Canonicalizing them here keeps one card
 * to one identity in both places.
 */

const USER_KEYS = new Set(["user", "username"]);

/**
 * Two spellings can share an identity only when they do not disagree. When a
 * URL carries both with different values it is ambiguous, so both are kept
 * and remain distinct from either spelling alone.
 */
function canCollapse(users: string[], usernames: string[]): boolean {
	if (users.length === 0 || usernames.length === 0) return true;
	return (
		users.length === usernames.length &&
		users.every((value, index) => value === usernames[index])
	);
}

/**
 * Sorted query entries with the user alias collapsed to `username`.
 *
 * Sorting stays here rather than at each caller so the cache key and the
 * parity check cannot drift on ordering either.
 */
export function cardIdentityParams(
	searchParams: URLSearchParams,
): [string, string][] {
	const users = searchParams.getAll("user");
	const usernames = searchParams.getAll("username");
	const collapse = canCollapse(users, usernames);
	const entries: [string, string][] = [];
	for (const [key, value] of searchParams) {
		const lower = key.toLowerCase();
		// When both spellings agree, `username` wins and the duplicate is
		// dropped; otherwise the identity would carry the same user twice.
		if (collapse && lower === "user" && usernames.length > 0) continue;
		entries.push([collapse && USER_KEYS.has(lower) ? "username" : key, value]);
	}
	return entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * Identity of a card URL: path plus canonical, sorted parameters.
 *
 * Manifest entries are relative to `base`; README entries are absolute.
 * `expectedOrigin` rejects URLs pointing at another deployment.
 */
export function embedIdentity(
	url: string,
	base?: string,
	expectedOrigin?: string,
): string | null {
	let parsed: URL;
	try {
		parsed = base ? new URL(url, base) : new URL(url);
	} catch {
		return null;
	}
	if (expectedOrigin && parsed.origin !== expectedOrigin) return null;
	const query = cardIdentityParams(parsed.searchParams)
		.map(([key, value]) => `${key}=${value}`)
		.join("&");
	return query ? `${parsed.pathname}?${query}` : parsed.pathname;
}
