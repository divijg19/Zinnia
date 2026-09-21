// API Client
// Minimal fetch wrapper for API calls (not used in static demo but available for future)

const _API_BASE = "/api";

async function fetchText(url, options = {}) {
	const response = await fetch(url, {
		...options,
		headers: {
			Accept: "image/svg+xml, text/html, */*",
			...options.headers,
		},
	});

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}: ${response.statusText}`);
	}

	return response.text();
}

async function fetchJson(url, options = {}) {
	const response = await fetch(url, {
		...options,
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			...options.headers,
		},
	});

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}: ${response.statusText}`);
	}

	return response.json();
}

// Stats API
async function getStatsCard(username, options = {}) {
	const params = new URLSearchParams({
		username,
		theme: options.theme || "default",
		hide_border: "true",
		...options,
	});
	return fetchText(`/api/stats?${params}`);
}

// Streak API
async function getStreakCard(username, options = {}) {
	const params = new URLSearchParams({
		user: username,
		theme: options.theme || "default",
		hide_border: "true",
		...options,
	});
	return fetchText(`/api/streak?${params}`);
}

// Trophy API
async function getTrophyCard(username, options = {}) {
	const params = new URLSearchParams({
		username,
		theme: options.theme || "flat",
		columns: options.columns || "4",
		...options,
	});
	return fetchText(`/api/trophy?${params}`);
}

// LeetCode API
async function getLeetCodeCard(username, options = {}) {
	const params = new URLSearchParams({
		username,
		theme: options.theme || "default",
		site: options.site || "us",
		...options,
	});
	return fetchText(`/api/leetcode?${params}`);
}

export {
	fetchJson,
	fetchText,
	getLeetCodeCard,
	getStatsCard,
	getStreakCard,
	getTrophyCard,
};
