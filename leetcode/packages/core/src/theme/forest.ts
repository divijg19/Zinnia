// @deprecated Theme values now live in the canonical registry
// (`lib/themes/registry.ts`), adapted by `toLeetCodeTheme`. This file is
// retained only as a parity fixture for
// `tests/lib/themes/leetcode-adapter.test.ts` and will be removed after the
// deprecation period.

import { Theme } from "./_theme.js";

export default Theme({
	palette: {
		bg: ["#fff9dd", "#ffec96"],
		color: ["#80c600", "#1abc97", "#8ec941", "#a36d00"],
	},
});
