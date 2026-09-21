// @deprecated Theme values now live in the canonical registry
// (`lib/themes/registry.ts`), adapted by `toLeetCodeTheme`. This file is
// retained only as a parity fixture for
// `tests/lib/themes/leetcode-adapter.test.ts` and will be removed after the
// deprecation period.

import { Theme } from "./_theme.js";

export default Theme({
	css: `#root { animation: wtf_animation 1s linear 0s infinite forwards } @keyframes wtf_animation {from { filter: hue-rotate(0deg) } to { filter: hue-rotate(360deg) }}`,
});
