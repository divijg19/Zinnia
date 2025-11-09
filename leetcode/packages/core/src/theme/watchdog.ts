import { Gradient } from "../elements.js";
import { Item } from "../item.js";
import { Theme } from "./_theme.js";

// Premium Watchdog theme with red-to-blue gradient background
// Matches color palette with Trophy and Streak watchdog themes
export default Theme({
	palette: {
		bg: ["url(#g-watchdog-bg)", "#021D4A", "#1a1f35", "#2a2f45"],
		text: ["#A9FEF7", "#FE428E", "#F8D847", "#E4E2E2"], // Cyan, hot pink, gold, light gray
		color: ["#F8D847", "#5CB85C", "#F0AD4E", "#EF4444"], // Gold, green, orange, red for difficulties
	},
	css: `
		/* Background with gradient - matches Streak/Trophy */
		#background{
			fill:url(#g-watchdog-bg);
			rx:12px;
			stroke:#E4E2E2;
			stroke-width:1.5px;
			stroke-opacity:0.15;
		}
		
		/* Icon - cyan accent matching watchdog theme */
		#L{
			fill:#A9FEF7;
			opacity:1;
			filter:drop-shadow(0 2px 4px rgba(169,254,247,0.4));
		}
		#C{fill:#A9FEF7;opacity:0.9}
		#dash{fill:#EB8C30;opacity:0.85}
		
		/* Username - cyan (matches Streak dates/Trophy text) */
		#username-text{
			font-weight:700;
			font-size:22px;
			letter-spacing:0.8px;
			fill:#A9FEF7;
		}
		#username:hover #username-text{
			fill:#FE428E;
			transition:fill 0.3s ease;
		}
		
		/* Ranking - hot pink accent (matches Streak ring/Trophy title) */
		#ranking{
			font-weight:700;
			font-size:16px;
			letter-spacing:0.5px;
			fill:#FE428E;
			opacity:0.95;
		}
		
		/* Total solved circle - gold (matches Streak current/Trophy icon) */
		#total-solved-text{
			font-weight:900;
			font-size:36px;
			letter-spacing:1px;
			fill:#F8D847;
			filter:drop-shadow(0 2px 6px rgba(248,216,71,0.5));
		}
		#total-solved-ring{
			stroke:#FE428E;
			stroke-width:7px;
			opacity:0.95;
			filter:drop-shadow(0 0 8px rgba(254,66,142,0.6));
		}
		#total-solved-bg{
			stroke:#E4E2E2;
			stroke-width:7px;
			opacity:0.15;
		}
		
		/* Difficulty labels - cyan */
		#easy-solved-type,#medium-solved-type,#hard-solved-type{
			font-weight:700;
			font-size:15px;
			letter-spacing:0.5px;
			fill:#A9FEF7;
			opacity:0.95;
		}
		
		/* Difficulty counts - hot pink */
		#easy-solved-count,#medium-solved-count,#hard-solved-count{
			font-weight:800;
			font-size:17px;
			letter-spacing:0.4px;
			fill:#FE428E;
			opacity:0.98;
		}
		
		/* Progress bars - vibrant colors with glow */
		#easy-solved-progress{
			stroke:#5CB85C;
			stroke-width:5px;
			filter:drop-shadow(0 0 4px rgba(92,184,92,0.6));
		}
		#medium-solved-progress{
			stroke:#EB8C30;
			stroke-width:5px;
			filter:drop-shadow(0 0 4px rgba(235,140,48,0.6));
		}
		#hard-solved-progress{
			stroke:#FE428E;
			stroke-width:5px;
			filter:drop-shadow(0 0 4px rgba(254,66,142,0.6));
		}
		#easy-solved-bg,#medium-solved-bg,#hard-solved-bg{
			opacity:0.18;
			stroke-width:5px;
			stroke:#E4E2E2;
		}
		
		/* Animations - smooth entrance */
		svg{animation:fadeIn 0.8s cubic-bezier(0.4,0,0.2,1)}
		@keyframes fadeIn{
			0%{opacity:0;transform:translateY(-5px)}
			100%{opacity:1;transform:translateY(0)}
		}
		
		/* Hover effects - interactive feedback */
		#solved g:hover #easy-solved-count,
		#solved g:hover #medium-solved-count,
		#solved g:hover #hard-solved-count{
			fill:#F8D847;
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
