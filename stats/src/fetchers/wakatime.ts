import axios from "axios";
import { CustomError, MissingParamError } from "../common/error.js";
import type { WakaTimeData } from "./types";

export const fetchWakatimeStats = async ({
	username,
	api_domain,
}: {
	username?: string;
	api_domain?: string;
}): Promise<WakaTimeData> => {
	if (!username) {
		throw new MissingParamError(["username"]);
	}

	try {
		const { data } = await axios.get(
			`https://${api_domain ? api_domain.replace(/\/$/gi, "") : "wakatime.com"}/api/v1/users/${username}/stats?is_including_today=true`,
		);

		return data.data as WakaTimeData;
	} catch (err: unknown) {
		const e = err as { response?: { status?: number } };
		if (
			(e.response && (e.response.status ?? 0) < 200) ||
			(e.response && (e.response.status ?? 0) > 299)
		) {
			throw new CustomError(
				`Could not resolve to a User with the login of '${username}'`,
				"WAKATIME_USER_NOT_FOUND",
			);
		}
		throw err;
	}
};

export default fetchWakatimeStats;
