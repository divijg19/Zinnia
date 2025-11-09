import { Gradient } from "../elements.js";
import { Item } from "../item.js";
import { Theme } from "./_theme.js";

// Premium Watchdog theme with red-to-blue gradient background
// Matching the premium feel of Trophy and Streak themes
export default Theme({
	palette: {
		bg: ["url(#g-watchdog-bg)", "#021D4A"],
		text: ["#FE428E", "#A9FEF7"],
		color: ["#EB8C30", "#F8D847", "#FE428E", "#A9FEF7"],
	},
	css: `
		#L{fill:#fff}
		#background{rx:8px}
		text{font-family:"Segoe UI",Ubuntu,sans-serif}
		#username-text{font-weight:700;letter-spacing:0.5px;font-size:18px}
		#ranking{font-weight:600;opacity:0.95}
		#total-solved-text{font-weight:700;font-size:16px}
		#easy-solved-type,#medium-solved-type,#hard-solved-type{font-weight:600;opacity:0.9}
		#easy-solved-count,#medium-solved-count,#hard-solved-count{font-weight:700;font-size:15px}
		.label{font-weight:400;opacity:0.85}
		.value{font-weight:700}
	`,
	extends: new Item("defs", {
		children: [
			// Red to blue gradient background (matching Streak watchdog theme)
			Gradient("g-watchdog-bg", { 0: "#520806", 0.5: "#2a1745", 1: "#021D4A" }),
		],
	}),
});
