import { Theme } from "./_theme.js";

// Premium Watchdog theme with enhanced styling
// Dark navy background with vibrant accents for a premium look
export default Theme({
	palette: {
		bg: ["#021D4A", "#0a1628"],
		text: ["#FE428E", "#A9FEF7"],
		color: ["#EB8C30", "#F8D847", "#FE428E", "#A9FEF7"],
	},
	css: `
		#L{fill:#fff}
		#background{rx:8px}
		#username-text{font-weight:700;letter-spacing:0.5px}
		#ranking{font-weight:600;opacity:0.9}
		#total-solved-text{font-weight:700}
		#easy-solved-type,#medium-solved-type,#hard-solved-type{font-weight:600}
		#easy-solved-count,#medium-solved-count,#hard-solved-count{font-weight:600;opacity:0.95}
	`,
});
