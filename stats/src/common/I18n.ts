const FALLBACK_LOCALE = "en";

export type Translations = Record<string, Record<string, string>>;

export interface I18nOptions {
	locale?: string;
	translations: Translations;
}

/**
 * I18n translation class.
 */
export class I18n {
	locale: string;
	translations: Translations;

	/**
	 * Constructor.
	 */
	constructor({ locale, translations }: I18nOptions) {
		this.locale = locale || FALLBACK_LOCALE;
		this.translations = translations;
	}

	/**
	 * Get translation.
	 *
	 * @param str String to translate.
	 * @returns Translated string.
	 */
	t(str: string): string {
		if (!this.translations[str]) {
			throw new Error(`${str} Translation string not found`);
		}

		const translation = this.translations[str];
		if (!translation) {
			throw new Error(`${str} Translation string not found`);
		}

		if (!translation[this.locale]) {
			throw new Error(
				`'${str}' translation not found for locale '${this.locale}'`,
			);
		}

		return translation[this.locale] || "";
	}
}
