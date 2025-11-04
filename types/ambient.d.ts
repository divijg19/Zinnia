declare module "leetcode-query" {
	export type ContestInfo = any;
	export type ContestRanking = any;
	export class LeetCode {
		constructor(...args: any[]);
		graphql(...args: any[]): Promise<any>;
		once(event: string, handler: (...args: any[]) => any): void;
		user_contest_info(...args: any[]): Promise<ContestInfo>;
		user_contest_ranking(...args: any[]): Promise<ContestRanking[]>;
	}
}

declare module "nano-font/fonts/*" {
	const fontData: { name: string; base64: string };
	export default fontData;
}
