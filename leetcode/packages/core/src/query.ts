/* eslint-disable @typescript-eslint/no-explicit-any */
import { LeetCode } from "./shims/leetcode-query.js";
import type { FetchedData } from "./types.js";

interface ProblemCount {
	difficulty: string;
	count: number;
}

interface DifficultyStats {
	solved: number;
	total: number;
}

function getProblemStats(
	difficulty: string,
	acCounts: ProblemCount[],
	totalCounts: ProblemCount[],
): DifficultyStats {
	return {
		solved: acCounts.find((x) => x.difficulty === difficulty)?.count || 0,
		total: totalCounts.find((x) => x.difficulty === difficulty)?.count || 0,
	};
}

// CN support removed

export class Query {
	async us(
		username: string,
		headers?: Record<string, string>,
	): Promise<FetchedData> {
		const lc = new LeetCode();
		const { data } = await lc.graphql({
			operationName: "data",
			variables: { username },
			query: `
            query data($username: String!) {
                problems: allQuestionsCount { 
                    difficulty 
                    count 
                }
                user: matchedUser(username: $username) {
                    username
                    profile { 
                        realname: realName 
                        about: aboutMe 
                        avatar: userAvatar 
                        skills: skillTags 
                        country: countryName 
                        ranking
                    }
                    submits: submitStatsGlobal {
                        ac: acSubmissionNum { difficulty count }
                    }
                }
                submissions: recentSubmissionList(username: $username, limit: 10) {
                    id
                    title 
                    slug: titleSlug 
                    time: timestamp 
                    status: statusDisplay 
                    lang
                }
                contest: userContestRanking(username: $username) {
                    rating
                    ranking: globalRanking
                    badge {
                        name
                    }
                }
            }`,
			headers,
		});

		if (!data?.user) {
			throw new Error("User Not Found");
		}

		const result: FetchedData = {
			profile: {
				username: data.user.username,
				realname: data.user.profile.realname,
				about: data.user.profile.about,
				avatar: data.user.profile.avatar,
				skills: data.user.profile.skills,
				country: data.user.profile.country,
			},
			problem: {
				easy: getProblemStats("Easy", data.user.submits.ac, data.problems),
				medium: getProblemStats("Medium", data.user.submits.ac, data.problems),
				hard: getProblemStats("Hard", data.user.submits.ac, data.problems),
				ranking: data.user.profile.ranking,
			},
			submissions: data.submissions.map((x: { time: string }) => ({
				...x,
				time: parseInt(x.time, 10) * 1000,
			})),
			contest: data.contest && {
				rating: data.contest.rating,
				ranking: data.contest.ranking,
				badge: data.contest.badge?.name || "",
			},
		};

		return result;
	}
}

export default new Query();
