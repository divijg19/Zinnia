let _pngFallback = 0;

export function incrementPngFallback() {
	_pngFallback += 1;
}

export function getTelemetry() {
	return { pngFallback: _pngFallback };
}

// Prefer named exports: `incrementPngFallback` and `getTelemetry`.
