import { Gradient } from "../elements.js";
import { Item } from "../item.js";

/**
 * Widget-specific SVG `<defs>` fragments for LeetCode themes whose palette
 * references `url(#...)` gradients. These are widget-specific render details
 * and live here (not in the canonical theme registry) because the registry
 * stores plain string palette values.
 */
export const THEME_EXTENDS: Record<string, Item> = {
	unicorn: new Item("defs", {
		children: [
			Gradient("g-bg", { 0: "#dbeafe", 0.5: "#e0e7ff", 1: "#fae8ff" }),
			Gradient("g-text", { 0: "#2563eb", 0.5: "#4f46e5", 1: "#d946ef" }),
		],
	}),
	watchdog: new Item("defs", {
		children: [
			Gradient(
				"g-watchdog-bg",
				{
					0: "#520806",
					0.25: "#451530",
					0.5: "#2a1745",
					0.75: "#1a1a50",
					1: "#021D4A",
				},
				0.785,
			),
			Gradient(
				"g-ring",
				{
					0: "#43E97B",
					0.5: "#38F9D7",
					1: "#00D9FF",
				},
				1.57,
			),
		],
	}),
};
