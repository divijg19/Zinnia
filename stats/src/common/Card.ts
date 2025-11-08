import { encodeHTML, flexLayout } from "./utils.ts";

export interface CardColors {
	titleColor: string;
	textColor: string;
	iconColor: string;
	bgColor: string | string[]; // solid color or gradient colors
	borderColor: string;
}

export interface CardOptions {
	width?: number;
	height?: number;
	border_radius?: number;
	colors?: Partial<CardColors>;
	customTitle?: string;
	defaultTitle?: string;
	titlePrefixIcon?: string;
}

export interface AccessibilityLabel {
	title: string;
	desc: string;
}

export class Card {
	width: number;
	height: number;
	hideBorder: boolean;
	hideTitle: boolean;
	border_radius: number;
	colors: Partial<CardColors>;
	title: string;
	css: string;
	paddingX: number;
	paddingY: number;
	titlePrefixIcon?: string;
	animations: boolean;
	a11yTitle: string;
	a11yDesc: string;

	constructor({
		width = 100,
		height = 100,
		border_radius = 4.5,
		colors = {},
		customTitle,
		defaultTitle = "",
		titlePrefixIcon,
	}: CardOptions) {
		this.width = width;
		this.height = height;
		this.hideBorder = false;
		this.hideTitle = false;
		this.border_radius = border_radius;
		this.colors = colors;
		this.title =
			customTitle === undefined
				? encodeHTML(defaultTitle)
				: encodeHTML(customTitle);
		this.css = "";
		this.paddingX = 25;
		this.paddingY = 35;
		this.titlePrefixIcon = titlePrefixIcon;
		this.animations = true;
		this.a11yTitle = "";
		this.a11yDesc = "";
	}

	disableAnimations(): void {
		this.animations = false;
	}

	setAccessibilityLabel({ title, desc }: AccessibilityLabel): void {
		this.a11yTitle = title;
		this.a11yDesc = desc;
	}

	setCSS(value: string): void {
		this.css = value;
	}

	setHideBorder(value: boolean): void {
		this.hideBorder = value;
	}

	setHideTitle(value: boolean): void {
		this.hideTitle = value;
		if (value) {
			this.height -= 30;
		}
	}

	setTitle(text: string): void {
		this.title = text;
	}

	renderTitle(): string {
		const titleText = `
      <text
        x="0"
        y="0"
        class="header"
        data-testid="header"
      >${this.title}</text>
    `;

		const prefixIcon = `
      <svg
        class="icon"
        x="0"
        y="-13"
        viewBox="0 0 16 16"
        version="1.1"
        width="16"
        height="16"
      >
        ${this.titlePrefixIcon}
      </svg>
    `;
		return `
      <g
        data-testid="card-title"
        transform="translate(${this.paddingX}, ${this.paddingY})"
      >
        ${flexLayout({
					items: [...(this.titlePrefixIcon ? [prefixIcon] : []), titleText],
					gap: 25,
				}).join("")}
      </g>
    `;
	}

	renderGradient(): string {
		if (typeof this.colors.bgColor !== "object") {
			return "";
		}

		const gradients = this.colors.bgColor.slice(1);
		return typeof this.colors.bgColor === "object"
			? `
        <defs>
          <linearGradient
            id="gradient"
            gradientTransform="rotate(${this.colors.bgColor[0]})"
            gradientUnits="userSpaceOnUse"
          >
            ${gradients
							.map((grad, index) => {
								const offset = (index * 100) / (gradients.length - 1);
								return `<stop offset="${offset}%" stop-color="#${grad}" />`;
							})
							.join("")}
          </linearGradient>
        </defs>
        `
			: "";
	}

	getAnimations = (): string => {
		return `
      /* Animations */
      @keyframes scaleInAnimation {
        from {
          transform: translate(-5px, 5px) scale(0);
        }
        to {
          transform: translate(-5px, 5px) scale(1);
        }
      }
      @keyframes fadeInAnimation {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `;
	};

	render(body: string): string {
		return `
      <svg
        width="${this.width}"
        height="${this.height}"
        viewBox="0 0 ${this.width} ${this.height}"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-labelledby="descId"
      >
        <title id="titleId">${this.a11yTitle}</title>
        <desc id="descId">${this.a11yDesc}</desc>
        <style>
          .header {
            font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif;
            fill: ${this.colors.titleColor};
            animation: fadeInAnimation 0.8s ease-in-out forwards;
          }
          @supports(-moz-appearance: auto) {
            /* Selector detects Firefox */
            .header { font-size: 15.5px; }
          }
          ${this.css}

          ${process.env.NODE_ENV === "test" ? "" : this.getAnimations()}
          ${
						this.animations === false
							? `* { animation-duration: 0s !important; animation-delay: 0s !important; }`
							: ""
					}
        </style>

        ${this.renderGradient()}

        <rect
          data-testid="card-bg"
          x="0.5"
          y="0.5"
          rx="${this.border_radius}"
          height="99%"
          stroke="${this.colors.borderColor}"
          width="${this.width - 1}"
          fill="${
						typeof this.colors.bgColor === "object"
							? "url(#gradient)"
							: this.colors.bgColor
					}"
          stroke-opacity="${this.hideBorder ? 0 : 1}"
        />

        ${this.hideTitle ? "" : this.renderTitle()}

        <g
          data-testid="main-card-body"
          transform="translate(0, ${
						this.hideTitle ? this.paddingX : this.paddingY + 20
					})"
        >
          ${body}
        </g>
      </svg>
    `;
	}
}
