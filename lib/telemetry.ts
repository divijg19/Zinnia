// Simple in-memory telemetry counters for runtime observability.
// This is intentionally minimal and designed for local/ephemeral metrics
// that can be read during smoke checks. For production, wire this to a
// proper metrics backend.

let _fallbackServed = 0;
let _upstreamErrors = 0;
let _cacheFallbacks = 0;

export function incrementFallbackServed() {
	_fallbackServed += 1;
}

export function incrementUpstreamError() {
	_upstreamErrors += 1;
}

export function incrementCacheFallback() {
	_cacheFallbacks += 1;
}

export function getTelemetry() {
	return {
		fallbackServed: _fallbackServed,
		upstreamErrors: _upstreamErrors,
		cacheFallbacks: _cacheFallbacks,
	};
}

export default {
	incrementFallbackServed,
	incrementUpstreamError,
	incrementCacheFallback,
	getTelemetry,
};
