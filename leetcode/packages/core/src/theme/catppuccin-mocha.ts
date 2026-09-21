// @deprecated Theme values now live in the canonical registry
// (`lib/themes/registry.ts`), adapted by `toLeetCodeTheme`. This file is
// retained only as a parity fixture for
// `tests/lib/themes/leetcode-adapter.test.ts` and will be removed after the
// deprecation period.

import { Theme } from "./_theme.js";

export default Theme({
	palette: {
		bg: ["#1e1e2e", "#45475a", "#45475a"],
		text: ["#cdd6f4", "#bac2de"],
		color: ["#fab387", "#a6e3a1", "#f9e2af", "#f38ba8"],
	},
});
