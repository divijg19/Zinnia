// @deprecated Theme values now live in the canonical registry
// (`lib/themes/registry.ts`), adapted by `toLeetCodeTheme`. This file is
// retained only as a parity fixture for
// `tests/lib/themes/leetcode-adapter.test.ts` and will be removed after the
// deprecation period.

import { Theme } from "./_theme.js";

export default Theme({
	palette: {
		bg: ["#101010", "#ffff"],
		text: ["#fe428e", "#a9fef7"],
		color: ["#ffa116", "#5cb85c", "#f0ad4e", "#d9534f"],
	},
	css: `#L{fill:#fff}`,
});
