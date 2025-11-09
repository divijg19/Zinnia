import { Gradient } from "../elements.js";
import { Item } from "../item.js";
import { Theme } from "./_theme.js";

// Premium Watchdog theme with red-to-blue gradient background
// Refined styling matching Trophy and Streak premium aesthetics
export default Theme({
	palette: {
		bg: ["url(#g-watchdog-bg)", "#021D4A", "#1a1f35", "#2a2f45"],
		text: ["#FFFFFF", "#A9FEF7", "#E0E7FF", "#CBD5E1"],
		color: ["#F8D847", "#5CB85C", "#F0AD4E", "#EF4444"],
	},
	css: `
		/* Global font styling */
		text{font-family:"Segoe UI",Ubuntu,"Helvetica Neue",sans-serif;letter-spacing:0.3px}
		
		/* Background refinements */
		#background{rx:10px;stroke:rgba(255,255,255,0.1);stroke-width:1.5px}
		
		/* LeetCode icon */
		#L{fill:#fff;opacity:0.95}
		
		/* Username styling */
		#username-text{
			font-weight:700;
			font-size:22px;
			letter-spacing:0.8px;
			fill:#FFFFFF;
			opacity:1
		}
		#username:hover #username-text{opacity:0.85;transition:opacity 0.2s}
		
		/* Ranking badge */
		#ranking{
			font-weight:600;
			font-size:16px;
			opacity:0.9;
			letter-spacing:0.5px
		}
		
		/* Total solved circle */
		#total-solved-text{
			font-weight:700;
			font-size:32px;
			letter-spacing:0.5px
		}
		#total-solved-ring{stroke-width:7px}
		#total-solved-bg{stroke-width:7px;opacity:0.3}
		
		/* Difficulty labels */
		#easy-solved-type,#medium-solved-type,#hard-solved-type{
			font-weight:600;
			font-size:16px;
			opacity:0.95;
			letter-spacing:0.4px
		}
		
		/* Difficulty counts */
		#easy-solved-count,#medium-solved-count,#hard-solved-count{
			font-weight:700;
			font-size:15px;
			opacity:0.9;
			letter-spacing:0.3px
		}
		
		/* Progress bars */
		#easy-solved-progress{stroke:#5CB85C;stroke-width:5px}
		#medium-solved-progress{stroke:#F0AD4E;stroke-width:5px}
		#hard-solved-progress{stroke:#EF4444;stroke-width:5px}
		#easy-solved-bg,#medium-solved-bg,#hard-solved-bg{opacity:0.25;stroke-width:5px}
		
		/* Animations */
		svg{animation:fadeIn 0.8s ease-in-out}
		@keyframes fadeIn{from{opacity:0}to{opacity:1}}
		
		/* Smooth transitions */
		*{transition:opacity 0.3s ease}
	`,
	extends: new Item("defs", {
		children: [
			// Enhanced red-to-blue gradient with more depth
			Gradient("g-watchdog-bg", {
				0: "#520806",
				0.3: "#3d1535",
				0.6: "#2a1745",
				1: "#021D4A"
			}),
		],
	}),
});
