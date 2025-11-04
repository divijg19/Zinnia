const source = {
	cors: {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "*",
		"Access-Control-Allow-Headers": "*",
		"Access-Control-Allow-Credentials": "true",
	},
	json: {
		"Content-Type": "application/json",
	},
	html: {
		"Content-Type": "text/html",
	},
	text: {
		"Content-Type": "text/plain",
	},
	svg: {
		"Content-Type": "image/svg+xml",
	},
};

// Lightweight headers accumulator that returns a plain object suitable for
// the Web Response init. Avoids depending on DOM "Headers" in Node builds.
export default class Header {
	private store: Record<string, string> = {};

	add(...types: (keyof typeof source)[]): this {
		for (const type of types) {
			for (const [key, value] of Object.entries(source[type])) {
				this.set(key, value);
			}
		}
		return this;
	}

	set(key: string, value: string): this {
		this.store[key] = value;
		return this;
	}

	toObject(): Record<string, string> {
		return { ...this.store };
	}
}
