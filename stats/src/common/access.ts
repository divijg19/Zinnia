// @ts-check

import { blacklist } from "./blacklist.js";
import { gistWhitelist, whitelist } from "./envs.js";
import { renderError } from "./utils.ts";

type Colors = {
	title_color?: string;
	text_color?: string;
	bg_color?: string;
	border_color?: string;
	theme?: string;
};

type GuardArgs = {
	res: { send: (body: string) => Response } | unknown;
	id: string;
	type: "username" | "gist";
	colors?: Colors;
};

const NOT_WHITELISTED_USERNAME_MESSAGE = "This username is not whitelisted";
const NOT_WHITELISTED_GIST_MESSAGE = "This gist ID is not whitelisted";
const BLACKLISTED_MESSAGE = "This username is blacklisted";

/**
 * Guards access using whitelist/blacklist.
 */
export const guardAccess = ({
	res,
	id,
	type,
	colors,
}: GuardArgs): { isPassed: true } | { isPassed: false; result: Response } => {
	if (!["username", "gist"].includes(type)) {
		throw new Error('Invalid type. Expected "username" or "gist".');
	}

	const currentWhitelist = type === "gist" ? gistWhitelist : whitelist;
	const notWhitelistedMsg =
		type === "gist"
			? NOT_WHITELISTED_GIST_MESSAGE
			: NOT_WHITELISTED_USERNAME_MESSAGE;

	if (Array.isArray(currentWhitelist) && !currentWhitelist.includes(id)) {
		const r = res as { send: (body: string) => Response };
		const result = r.send(
			renderError({
				message: notWhitelistedMsg,
				secondaryMessage: "Please deploy your own instance",
				renderOptions: {
					...colors,
					show_repo_link: false,
				},
			}),
		);
		return { isPassed: false, result };
	}

	if (
		type === "username" &&
		currentWhitelist === undefined &&
		(blacklist as string[]).includes(id)
	) {
		const r = res as { send: (body: string) => Response };
		const result = r.send(
			renderError({
				message: BLACKLISTED_MESSAGE,
				secondaryMessage: "Please deploy your own instance",
				renderOptions: {
					...colors,
					show_repo_link: false,
				},
			}),
		);
		return { isPassed: false, result };
	}

	return { isPassed: true };
};
