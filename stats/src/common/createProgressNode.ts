import { clampValue } from "./utils.ts";

export interface ProgressNodeOptions {
	x: number;
	y: number;
	width: number;
	color: string;
	progress: number;
	progressBarBackgroundColor: string;
	delay: number;
}

/**
 * Create a node to indicate progress in percentage along a horizontal line.
 */
export const createProgressNode = ({
	x,
	y,
	width,
	color,
	progress,
	progressBarBackgroundColor,
	delay,
}: ProgressNodeOptions): string => {
	const progressPercentage = clampValue(progress, 2, 100);

	return `
    <svg width="${width}" x="${x}" y="${y}">
      <rect rx="5" ry="5" x="0" y="0" width="${width}" height="8" fill="${progressBarBackgroundColor}"></rect>
      <svg data-testid="lang-progress" width="${progressPercentage}%">
        <rect
            height="8"
            fill="${color}"
            rx="5" ry="5" x="0" y="0"
            class="lang-progress"
            style="animation-delay: ${delay}ms;"
        />
      </svg>
    </svg>
  `;
};
