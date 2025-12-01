import { getGithubPATAsync, markPatExhaustedAsync } from "../../lib/tokens.ts";
import type { ContributionDay } from "./types.js";

// Build GraphQL query for a year's contribution calendar and optional fields
const yearQuery = (year: number) =>
	`query($login: String!) { user(login: $login) { createdAt contributionsCollection(from: "${year}-01-01T00:00:00Z", to: "${year}-12-31T23:59:59Z") { contributionYears contributionCalendar { weeks { contributionDays { date contributionCount } } } } }`;

type GraphQLVariables = Record<string, string | number | boolean | null>;

async function doGraphQL(
	query: string,
	variables: GraphQLVariables,
	pat: string,
) {
	const timeoutMs = Number(process.env.STREAK_FETCH_TIMEOUT_MS || 8000);
	const controller = new AbortController();
	const to =
		timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;
	let res: Response | undefined;
	try {
		res = await fetch("https://api.github.com/graphql", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${pat}`,
				"User-Agent": "zinnia/streak-ts",
			},
			body: JSON.stringify({ query, variables }),
			signal: controller.signal,
		});
	} catch (err: unknown) {
		if (to) clearTimeout(to);
		const maybeName = (err as unknown as { name?: string })?.name;
		if (maybeName === "AbortError") throw new Error("fetch-timeout");
		throw err as Error;
	} finally {
		if (to) clearTimeout(to);
	}
	if (!res) throw new Error("no response from fetch");

	if (!res.ok) {
		if (res.status === 401 || res.status === 403) {
			try {
				await markPatExhaustedAsync?.(pat, 300);
			} catch {
				// swallow
			}
			throw new Error("rate-limited");
		}
		// propagate a helpful message
		const text = await res
			.text()
			.catch(() => res.statusText || String(res.status));
		throw new Error(`graphql-failed:${res.status}:${text}`);
	}
	return res.json();
}

export async function fetchContributions(
	username: string,
): Promise<ContributionDay[]> {
	// Strategy:
	// 1) Query current year for createdAt and contributionYears
	// 2) Determine additional years to request (user-created -> previous years)
	// 3) Request each year's calendar and merge contributionDays

	const thisYear = new Date().getUTCFullYear();
	const pat = await getGithubPATAsync();
	if (!pat) throw new Error("no-github-pat");

	const json = await doGraphQL(yearQuery(thisYear), { login: username }, pat);
	const user = json?.data?.user;
	if (!user) {
		// propagate upstream message
		const msg = json?.errors?.[0]?.message ?? "no user data";
		throw new Error(msg);
	}

	// Determine created year and contribution years (best-effort)
	const createdAt = user.createdAt || null;
	const contributionYears =
		user.contributionsCollection?.contributionYears ?? [];
	let startYear = createdAt ? new Date(createdAt).getUTCFullYear() : thisYear;
	// ensure minimum year not before 2005
	startYear = Math.max(2005, startYear);

	// If contributionYears present, use its earliest value as a hint
	if (Array.isArray(contributionYears) && contributionYears.length > 0) {
		const firstContributionYear =
			Number(contributionYears[contributionYears.length - 1]) || startYear;
		if (firstContributionYear < startYear) startYear = firstContributionYear;
	}

	const yearsToRequest = [];
	for (let y = startYear; y <= thisYear; y++) yearsToRequest.push(y);

	const days: ContributionDay[] = [];

	// For each year, perform a query and extract days
	for (const y of yearsToRequest) {
		const result = await doGraphQL(yearQuery(y), { login: username }, pat);
		const weeks =
			result?.data?.user?.contributionsCollection?.contributionCalendar
				?.weeks ?? [];
		for (const week of weeks) {
			for (const d of week.contributionDays) {
				days.push({ date: d.date, count: d.contributionCount });
			}
		}
	}

	// Deduplicate by date (if overlapping years) and keep latest count
	const byDate = new Map();
	for (const d of days) {
		byDate.set(d.date, d.count);
	}
	const merged = Array.from(byDate.entries()).map(([date, count]) => ({
		date,
		count,
	}));
	merged.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
	return merged;
}
