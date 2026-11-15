import type { DemoTheme } from "../types.js";

/**
 * A widget that renders one of the prerendered card assets.
 *
 * The demo shows the cards the generator prerendered, so a widget is an
 * `<img>` pointing at the asset rather than a live render.
 */
export class GeneratedAssetWidget {
	readonly kind: string;
	readonly theme: DemoTheme;

	constructor(kind: string, theme: DemoTheme) {
		this.kind = kind;
		this.theme = theme;
	}

	render(): string {
		const asset = this.theme?.widgets?.[this.kind];
		if (!asset?.src) {
			return "";
		}
		return `<img src="${asset.src}" alt="${this.theme.displayName || this.theme.name} ${this.kind}" width="${asset.width}" height="${asset.height}" loading="lazy" decoding="async" data-widget="${this.kind}">`;
	}
}
