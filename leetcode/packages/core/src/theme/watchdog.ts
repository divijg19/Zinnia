import { Gradient } from "../elements.js";
import { Item } from "../item.js";
import { Theme } from "./_theme.js";

// Premium Watchdog theme with sophisticated gradient background and refined color palette
// Designed for maximum visual impact and readability against dark gradient
export default Theme({
	palette: {
		bg: ["url(#g-watchdog-bg)", "#021D4A", "#1a1f35", "#2a2f45"],
		text: ["#FFFFFF", "#A9FEF7", "#FE428E", "#E4E2E2"], // White, cyan, hot pink, light gray
		color: ["url(#g-ring)", "#43E97B", "#FFBB00", "#FF4757"], // Gradient ring, vibrant green, gold, coral red
	},
	css: `
		/* Background with gradient - premium red-to-blue diagonal sweep */
		#background{
			rx:12px;
			stroke:rgba(255,255,255,0.08);
			stroke-width:1.5px;
		}
		
		/* Icon - sophisticated multi-tone design */
		#icon{
			opacity:1;
		}
		#L{
			fill:#00D9FF!important;
			opacity:1;
			filter:drop-shadow(0 2px 8px rgba(0,217,255,0.5));
		}
		#C{
			fill:#00D9FF!important;
			opacity:0.85;
		}
		#dash{
			fill:#FFBB00!important;
			opacity:0.95;
			filter:drop-shadow(0 1px 4px rgba(255,187,0,0.4));
		}
		
		/* Username - crisp white with cyan glow, hot pink hover */
		#username-text{
			font-weight:700!important;
			font-size:24px!important;
			letter-spacing:0.5px;
			fill:#FFFFFF!important;
			filter:drop-shadow(0 2px 4px rgba(169,254,247,0.3));
			transition:all 0.3s cubic-bezier(0.4,0,0.2,1);
		}
		#username:hover #username-text{
			fill:#FE428E!important;
			filter:drop-shadow(0 2px 8px rgba(254,66,142,0.6));
			transform:translateY(-1px);
		}
		
		/* Ranking - elegant cyan with subtle emphasis */
		#ranking{
			font-weight:600!important;
			font-size:18px!important;
			letter-spacing:0.3px;
			fill:#A9FEF7!important;
			opacity:0.92;
		}
		
		/* Total solved circle - premium gradient ring with white text */
		#total-solved-text{
			font-weight:900!important;
			font-size:38px!important;
			letter-spacing:-0.5px;
			fill:#FFFFFF!important;
			filter:drop-shadow(0 3px 8px rgba(0,0,0,0.5)) drop-shadow(0 0 12px rgba(255,255,255,0.3));
		}
		#total-solved-ring{
			stroke:url(#g-ring)!important;
			stroke-width:8px!important;
			opacity:1;
			filter:drop-shadow(0 0 12px rgba(67,233,123,0.6));
		}
		#total-solved-bg{
			stroke:rgba(255,255,255,0.12)!important;
			stroke-width:8px!important;
			opacity:1;
		}
		
		/* Difficulty labels - refined white with subtle opacity */
		#easy-solved-type,#medium-solved-type,#hard-solved-type{
			font-weight:600!important;
			font-size:16px!important;
			letter-spacing:0.3px;
			fill:#FFFFFF!important;
			opacity:0.85;
		}
		
		/* Difficulty counts - cyan emphasis for readability */
		#easy-solved-count,#medium-solved-count,#hard-solved-count{
			font-weight:700!important;
			font-size:16px!important;
			letter-spacing:0.2px;
			fill:#A9FEF7!important;
			opacity:1;
		}
		
		/* Progress bars - vibrant semantic colors with enhanced glows */
		#easy-solved-progress{
			stroke:#43E97B!important;
			stroke-width:6px!important;
			filter:drop-shadow(0 0 6px rgba(67,233,123,0.7));
		}
		#medium-solved-progress{
			stroke:#FFBB00!important;
			stroke-width:6px!important;
			filter:drop-shadow(0 0 6px rgba(255,187,0,0.7));
		}
		#hard-solved-progress{
			stroke:#FF4757!important;
			stroke-width:6px!important;
			filter:drop-shadow(0 0 6px rgba(255,71,87,0.7));
		}
		#easy-solved-bg,#medium-solved-bg,#hard-solved-bg{
			opacity:1!important;
			stroke-width:6px!important;
			stroke:rgba(255,255,255,0.1)!important;
		}
		
		/* Animations - smooth entrance */
		@keyframes fadeIn{
			0%{opacity:0;transform:translateY(-5px)}
			100%{opacity:1;transform:translateY(0)}
		}
		
		/* Hover effects - gold highlight for interactivity */
		#solved g:hover #easy-solved-count,
		#solved g:hover #medium-solved-count,
		#solved g:hover #hard-solved-count{
			fill:#FFBB00!important;
			transition:fill 0.3s cubic-bezier(0.4,0,0.2,1);
		}
		
		#solved g:hover #easy-solved-type,
		#solved g:hover #medium-solved-type,
		#solved g:hover #hard-solved-type{
			fill:#FFFFFF!important;
			opacity:1!important;
		}
	`,
	extends: new Item("defs", {
		children: [
			// Background: Diagonal gradient (red to blue) at 45-degree angle
			Gradient(
				"g-watchdog-bg",
				{
					"0": "#520806", // Deep crimson red (top-left)
					"0.25": "#451530", // Wine red-purple
					"0.5": "#2a1745", // Deep violet (center)
					"0.75": "#1a1a50", // Royal purple-blue
					"1": "#021D4A", // Navy blue (bottom-right)
				},
				0.785, // 45-degree angle (π/4 radians)
			),
			// Ring: Vibrant green-to-cyan gradient for completion circle
			Gradient(
				"g-ring",
				{
					"0": "#43E97B", // Vibrant green
					"0.5": "#38F9D7", // Turquoise
					"1": "#00D9FF", // Bright cyan
				},
				1.57, // 90-degree angle (vertical gradient)
			),
		],
	}),
});
