import { Gradient } from "../elements.js";
import { Item } from "../item.js";
import { Theme } from "./_theme.js";

// Premium Watchdog theme with red-to-blue gradient background
// Matches color palette with Trophy and Streak watchdog themes
export default Theme({
	palette: {
		bg: ["url(#g-watchdog-bg)", "#021D4A", "#1a1f35", "#2a2f45"],
		text: ["#A9FEF7", "#FE428E", "#F8D847", "#E4E2E2"], // Cyan, hot pink, gold, light gray
		color: ["#F8D847", "#5CB85C", "#EB8C30", "#FE428E"], // Gold, green, orange, hot pink
	},
	css: `
		/* Background with gradient - CRITICAL: fill comes from --bg-0 variable */
		#background{
			rx:12px;
			stroke:#E4E2E2;
			stroke-width:1.5px;
			stroke-opacity:0.15;
		}
		
		/* Icon - cyan accent matching watchdog theme */
		#icon{
			opacity:1;
		}
		#L{
			fill:#A9FEF7!important;
			opacity:1;
			filter:drop-shadow(0 2px 4px rgba(169,254,247,0.4));
		}
		#C{
			fill:#A9FEF7!important;
			opacity:0.9;
		}
		#dash{
			fill:#EB8C30!important;
			opacity:0.85;
		}
		
		/* Username - cyan (matches Streak dates/Trophy text) with hover effect */
		#username-text{
			font-weight:700!important;
			font-size:22px!important;
			letter-spacing:0.8px;
			fill:#A9FEF7!important;
			transition:fill 0.3s ease;
		}
		#username:hover #username-text{
			fill:#FE428E!important;
		}
		
		/* Ranking - hot pink accent (matches Streak ring/Trophy title) */
		#ranking{
			font-weight:700!important;
			font-size:16px!important;
			letter-spacing:0.5px;
			fill:#FE428E!important;
			opacity:0.95;
		}
		
		/* Total solved circle - gold (matches Streak current/Trophy icon) */
		#total-solved-text{
			font-weight:900!important;
			font-size:36px!important;
			letter-spacing:1px;
			fill:#F8D847!important;
			filter:drop-shadow(0 2px 6px rgba(248,216,71,0.5));
		}
		#total-solved-ring{
			stroke:#FE428E!important;
			stroke-width:7px!important;
			opacity:0.95;
			filter:drop-shadow(0 0 8px rgba(254,66,142,0.6));
		}
		#total-solved-bg{
			stroke:#E4E2E2!important;
			stroke-width:7px!important;
			opacity:0.15;
		}
		
		/* Difficulty labels - cyan */
		#easy-solved-type,#medium-solved-type,#hard-solved-type{
			font-weight:700!important;
			font-size:15px!important;
			letter-spacing:0.5px;
			fill:#A9FEF7!important;
			opacity:0.95;
		}
		
		/* Difficulty counts - hot pink */
		#easy-solved-count,#medium-solved-count,#hard-solved-count{
			font-weight:800!important;
			font-size:17px!important;
			letter-spacing:0.4px;
			fill:#FE428E!important;
			opacity:0.98;
		}
		
		/* Progress bars - vibrant colors with glow */
		#easy-solved-progress{
			stroke:#5CB85C!important;
			stroke-width:5px!important;
			filter:drop-shadow(0 0 4px rgba(92,184,92,0.6));
		}
		#medium-solved-progress{
			stroke:#EB8C30!important;
			stroke-width:5px!important;
			filter:drop-shadow(0 0 4px rgba(235,140,48,0.6));
		}
		#hard-solved-progress{
			stroke:#FE428E!important;
			stroke-width:5px!important;
			filter:drop-shadow(0 0 4px rgba(254,66,142,0.6));
		}
		#easy-solved-bg,#medium-solved-bg,#hard-solved-bg{
			opacity:0.18!important;
			stroke-width:5px!important;
			stroke:#E4E2E2!important;
		}
		
		/* Animations - smooth entrance */
		svg{
			animation:fadeIn 0.8s cubic-bezier(0.4,0,0.2,1)!important;
		}
		@keyframes fadeIn{
			0%{opacity:0;transform:translateY(-5px)}
			100%{opacity:1;transform:translateY(0)}
		}
		
		/* Hover effects - interactive feedback */
		#solved g:hover #easy-solved-count,
		#solved g:hover #medium-solved-count,
		#solved g:hover #hard-solved-count{
			fill:#F8D847!important;
			transition:fill 0.25s ease;
		}
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
