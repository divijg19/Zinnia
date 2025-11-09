import { Gradient } from "../elements.js";
import { Item } from "../item.js";
import { Theme } from "./_theme.js";

// Premium Watchdog theme with red-to-blue gradient background
// Enhanced typography and visual effects matching Trophy and Streak themes
export default Theme({
	palette: {
		bg: ["url(#g-watchdog-bg)", "#021D4A", "#1a1f35", "#2a2f45"],
		text: ["#FFFFFF", "#A9FEF7", "#E0E7FF", "#CBD5E1"],
		color: ["#F8D847", "#5CB85C", "#F0AD4E", "#EF4444"],
	},
	css: `
		/* Background with gradient */
		#background{fill:url(#g-watchdog-bg);rx:12px;stroke:rgba(255,255,255,0.18);stroke-width:2px}
		
		/* Icon */
		#L{fill:#fff;opacity:0.98;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.4))}
		
		/* Username */
		#username-text{font-weight:800;font-size:24px;letter-spacing:1px;fill:#FFFFFF}
		#username:hover #username-text{filter:brightness(1.15)}
		
		/* Ranking */
		#ranking{font-weight:700;font-size:17px;opacity:0.95;letter-spacing:0.6px}
		
		/* Total solved */
		#total-solved-text{font-weight:900;font-size:38px;letter-spacing:1.2px}
		#total-solved-ring{stroke-width:8px;filter:drop-shadow(0 0 8px currentColor)}
		#total-solved-bg{stroke-width:8px;opacity:0.25}
		
		/* Difficulty labels */
		#easy-solved-type,#medium-solved-type,#hard-solved-type{font-weight:700;font-size:16px;opacity:0.96;letter-spacing:0.6px}
		
		/* Difficulty counts */
		#easy-solved-count,#medium-solved-count,#hard-solved-count{font-weight:800;font-size:19px;opacity:0.98;letter-spacing:0.5px}
		
		/* Progress bars */
		#easy-solved-progress{stroke:#5CB85C;stroke-width:6px;filter:drop-shadow(0 0 6px #5CB85C)}
		#medium-solved-progress{stroke:#F0AD4E;stroke-width:6px;filter:drop-shadow(0 0 6px #F0AD4E)}
		#hard-solved-progress{stroke:#EF4444;stroke-width:6px;filter:drop-shadow(0 0 6px #EF4444)}
		#easy-solved-bg,#medium-solved-bg,#hard-solved-bg{opacity:0.22;stroke-width:6px}
		
		/* Animations */
		svg{animation:fadeIn 0.9s ease}
		@keyframes fadeIn{0%{opacity:0}100%{opacity:1}}
	`,
	extends: new Item("defs", {
		children: [
			// Diagonal gradient (red to blue) at 45-degree angle
			// ratio = 0.785 (π/4 radians) creates dramatic diagonal sweep
			Gradient(
				"g-watchdog-bg",
				{
					"0": "#520806", // Deep crimson red (top-left)
					"0.25": "#451530", // Wine red-purple
					"0.5": "#2a1745", // Deep violet (center)
					"0.75": "#1a1a50", // Royal purple-blue
					"1": "#021D4A", // Navy blue (bottom-right)
				},
				0.785, // 45-degree angle
			),
		],
	}),
});
