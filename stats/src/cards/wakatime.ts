import type { WakaTimeData } from "../fetchers/types";
import type { WakaTimeOptions } from "./types";
import { renderWakaTimeCard as renderWakaTimeCardJs } from "./wakatime.js";

type RenderWakaFn = (
	waka: WakaTimeData,
	options?: Partial<WakaTimeOptions>,
) => string;

export function renderWakaTimeCard(
	waka: WakaTimeData,
	options?: Partial<WakaTimeOptions>,
): string {
	const fn = renderWakaTimeCardJs as unknown as RenderWakaFn;
	return fn(waka, options);
}

export default renderWakaTimeCard;
