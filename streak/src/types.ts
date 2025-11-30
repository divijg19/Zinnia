export type ContributionDay = { date: string; count: number };

export interface RenderOptions {
	width?: number;
	height?: number;
	colors?: { bg: string; fg: string };
}

export type Theme = Record<string, string>;
export type Themes = Record<string, Theme>;

export type LocaleTranslations = Record<string, string | boolean> | string;
export type Translations = Record<string, LocaleTranslations>;
