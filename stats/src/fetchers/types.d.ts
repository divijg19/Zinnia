export type GistData = {
	name: string;
	nameWithOwner: string;
	description: string | null;
	language: string | null;
	starsCount: number;
	forksCount: number;
};

export type RepositoryData = {
	name: string;
	nameWithOwner: string;
	isPrivate: boolean;
	isArchived: boolean;
	isTemplate: boolean;
	stargazers: { totalCount: number };
	description: string;
	primaryLanguage: {
		color: string;
		id: string;
		name: string;
	};
	forkCount: number;
	starCount: number;
};

export type StatsData = {
	name: string;
	totalPRs: number;
	totalPRsMerged: number;
	mergedPRsPercentage: number;
	totalReviews: number;
	totalCommits: number;
	totalIssues: number;
	totalStars: number;
	totalDiscussionsStarted: number;
	totalDiscussionsAnswered: number;
	contributedTo: number;
	rank: { level: string; percentile: number };
};

export type Lang = {
	name: string;
	color: string;
	size: number;
};

export type TopLangData = Record<string, Lang>;

// WakaTime types removed as feature is not used in this repository anymore.
