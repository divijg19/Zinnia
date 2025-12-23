import {
	getGithubPATWithKeyForServiceAsync,
	markPatExhaustedAsync,
} from "../../lib/tokens";
import type { ContributionDay } from "./types.ts";

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

	async function attemptFetch(): Promise<Response> {
		return fetch("https://api.github.com/graphql", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${pat}`,
				"User-Agent": "zinnia/streak-ts",
			},
			body: JSON.stringify({ query, variables }),
			signal: controller.signal,
		});
	}

	try {
		res = await attemptFetch();
	} catch (err: unknown) {
		if (to) clearTimeout(to);
		const maybeName = (err as unknown as { name?: string })?.name;
		if (maybeName === "AbortError") throw new Error("fetch-timeout");
		// Safe retry once for transient network errors (not auth failures)
		const jitterMs = 200 + Math.floor(Math.random() * 201); // 200-400ms
		await new Promise((r) => setTimeout(r, jitterMs));
		try {
			res = await attemptFetch();
		} catch (err2: unknown) {
			throw err2 as Error;
		}
	} finally {
		if (to) clearTimeout(to);
	}
	if (!res) throw new Error("no response from fetch");

	if (!res.ok) {
		if (res.status === 401 || res.status === 403) {
			try {
				const keyHeader = (variables as any).__patKey as string | undefined;
				if (keyHeader) await markPatExhaustedAsync?.(keyHeader, 300);
			} catch {
				// swallow
			}
			throw new Error("rate-limited");
		}
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
	const thisYear = new Date().getUTCFullYear();
	const patInfo = await getGithubPATWithKeyForServiceAsync("streak");

	if (!patInfo) {
		// Fallback: try to scrape the public GitHub contributions calendar
		try {
			const resp = await fetch(
				`https://github.com/users/${username}/contributions`,
			);
			if (!resp.ok) throw new Error("public-contributions-fetch-failed");
			const text = await resp.text();
			const days: ContributionDay[] = [];
			const re =
				/<rect[^>]*data-date="([0-9-]+)"[^>]*data-count="([0-9]+)"[^>]*>/g;
			let match: RegExpExecArray | null = re.exec(text);
			while (match !== null) {
				const date = match[1];
				const countStr = match[2];
				if (date && countStr) days.push({ date, count: Number(countStr) });
				match = re.exec(text);
			}
			if (days.length > 0) {
				days.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
				return days;
			}
			// If parsing failed, fall through to GraphQL path which will error
		} catch (scrapeErr) {
			try {
				if (process.env.STREAK_DEBUG === "1")
					console.warn(
						"streak: public contributions scrape failed",
						String(scrapeErr),
					);
			} catch {}
			throw new Error("no-github-pat-or-scrape-failed");
		}
	}

	// Ensure we have patInfo for GraphQL calls
	if (!patInfo) throw new Error("no-github-pat");

	const json = await doGraphQL(
		yearQuery(thisYear),
		{ login: username, __patKey: patInfo.key },
		patInfo.token,
	);
	const user = json?.data?.user;
	if (!user) {
		const msg = json?.errors?.[0]?.message ?? "no user data";
		throw new Error(msg);
	}

	const createdAt = user.createdAt || null;
	const contributionYears =
		user.contributionsCollection?.contributionYears ?? [];
	let startYear = createdAt ? new Date(createdAt).getUTCFullYear() : thisYear;
	startYear = Math.max(2005, startYear);

	if (Array.isArray(contributionYears) && contributionYears.length > 0) {
		const firstContributionYear =
			Number(contributionYears[contributionYears.length - 1]) || startYear;
		if (firstContributionYear < startYear) startYear = firstContributionYear;
	}

	const yearsToRequest: number[] = [];
	for (let y = startYear; y <= thisYear; y++) yearsToRequest.push(y);

	const days: ContributionDay[] = [];
	for (const y of yearsToRequest) {
		const result = await doGraphQL(
			yearQuery(y),
			{ login: username, __patKey: patInfo.key },
			patInfo.token,
		);
		const weeks =
			result?.data?.user?.contributionsCollection?.contributionCalendar
				?.weeks ?? [];
		for (const week of weeks) {
			for (const d of week.contributionDays) {
				days.push({ date: d.date, count: d.contributionCount });
			}
		}
	}

	const byDate = new Map<string, number>();
	for (const d of days) byDate.set(d.date, d.count);
	const merged = Array.from(byDate.entries()).map(([date, count]) => ({
		date,
		count,
	}));
	merged.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
	return merged;
}
