export class GeneratedAssetWidget {
	constructor(kind, theme) {
		this.kind = kind;
		this.theme = theme;
	}

	render() {
		const asset = this.theme?.widgets?.[this.kind];
		if (!asset?.src) {
			return "";
		}
		return `<img src="${asset.src}" alt="${this.theme.displayName || this.theme.name} ${this.kind}" width="${asset.width}" height="${asset.height}" loading="lazy" decoding="async" data-widget="${this.kind}">`;
	}
}
