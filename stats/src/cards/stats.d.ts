import type { StatsData } from "../fetchers/types";
import type { StatCardOptions } from "./types";

/**
 * Render the stats card SVG as a string.
 * Kept as a declaration file to provide types for the existing JS runtime file.
 */
export function renderStatsCard(
	stats: StatsData,
	options?: Partial<StatCardOptions>,
): string;

export default renderStatsCard;
