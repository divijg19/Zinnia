#!/bin/bash
# Parallel tsup shards. Each shard writes a distinct out-dir (with its own
# --clean), so concurrent execution is safe. Fails if any shard fails.
set -u

COMMON="--format esm --platform node --target node24"

pids=()
fail=0

tsup leetcode/packages/core/src/index.ts $COMMON --out-dir leetcode/packages/core/dist --sourcemap --clean &
pids+=($!)
tsup trophy/src/renderer.ts $COMMON --out-dir api/_build/trophy --sourcemap --clean &
pids+=($!)
tsup streak/src/index.ts $COMMON --out-dir streak/dist --sourcemap --clean &
pids+=($!)
tsup streak/src/index.ts $COMMON --out-dir api/_build/streak --external sharp --minify --clean &
pids+=($!)
tsup stats/src/index.ts $COMMON --out-dir stats/api --sourcemap --clean &
pids+=($!)

for pid in "${pids[@]}"; do
	if ! wait "$pid"; then
		fail=1
	fi
done

exit "$fail"
