#!/bin/sh
# Minimal end-to-end smoke check for a locally running deployment.
# Usage: bash scripts/e2e_smoke.sh [base-url]
# Exits non-zero on the first failing check.
set -eu

BASE_URL="${1:-http://localhost:3000}"

check() {
	path="$1"
	must_contain="$2"
	url="${BASE_URL}${path}"
	code=$(curl -s -o /tmp/e2e_body.txt -w "%{http_code}" "$url" 2>/dev/null || true)
	if [ -z "$code" ]; then code="000"; fi
	body=$(cat /tmp/e2e_body.txt 2>/dev/null || true)
	if [ "$code" != "200" ]; then
		echo "FAIL: $url returned HTTP $code (expected 200)"
		exit 1
	fi
	case "$body" in
		*"$must_contain"*)
			echo "OK: $url (200, contains expected content)"
			;;
		*)
			echo "FAIL: $url body missing expected content: $must_contain"
			exit 1
			;;
	esac
}

check "/api/health?text=OK" "<svg"
check "/demo/" "Zinnia Theme Demo"

echo "e2e smoke passed against $BASE_URL"
