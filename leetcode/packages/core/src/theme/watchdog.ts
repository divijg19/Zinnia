import { Theme } from "./_theme";

// Mapping of the provided 'watchdog' colors into the LeetCode Theme shape.
// Assumptions:
// - The original background was a comma-separated string; we use the deepest
//   color (#021D4A) as primary and a dark fallback to form the bg palette.
// - text uses the ring and dates colors.
// - color slices pick fire, currStreakNum, ring and dates so progress rings map nicely.
export default Theme({
	palette: {
		bg: ["#021D4A", "#141321"],
		text: ["#FE428E", "#A9FEF7"],
		color: ["#EB8C30", "#F8D847", "#FE428E", "#A9FEF7"],
	},
	css: `#L{fill:#fff}`,
});
