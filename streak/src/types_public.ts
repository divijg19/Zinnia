import type { Stats } from "./stats.ts";

export type Params = Partial<{
	type: "svg" | "png" | "json";
	locale: string;
	background: string;
	disable_animations: string;
	date_format: string;
	hide_total_contributions: string;
	hide_current_streak: string;
	hide_longest_streak: string;
	short_numbers: string;
	card_width: string | number;
	card_height: string | number;
	border_radius: string | number;
	theme: string;
	exclude_days: string;
	hide_border: string;
}> &
	Record<string, string | number | boolean | null | undefined>;

export type Output = {
	contentType: string;
	body: string | Buffer;
	status?: number;
};

export type { Stats };

// Narrow theme shape used by the renderer. Additional string keys are allowed
// to preserve extensibility from the original implementation.
export interface Theme {
	background?: string;
	border?: string;
	stroke?: string;
	ring?: string;
	fire?: string;
	currStreakNum?: string;
	sideNums?: string;
	currStreakLabel?: string;
	sideLabels?: string;
	dates?: string;
	excludeDaysLabel?: string;
	// Optional gradient information computed at render time
	backgroundGradient?: string;
	_backgroundGradientId?: string;
	[key: string]: string | undefined | boolean | number | undefined;
}

// Simple translations surface used by helpers. Keys are mostly strings, but
// some booleans (like `rtl`) are present in locale files.
export interface Translations {
	rtl?: boolean;
	date_format?: string;
	comma_separator?: string;
	Present?: string;
	[key: string]: string | boolean | undefined;
}
