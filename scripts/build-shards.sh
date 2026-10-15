#!/bin/bash
# Parallel bun build shards. Each shard writes a distinct out-dir, so
# concurrent execution is safe. Every out-dir is wiped first (tsup used
# --clean) so stale chunks from earlier builds cannot survive into a deploy.
# Fails if any shard fails.
#
#   --packages=external   keep package.json deps (notably `sharp`) out of the
#                         bundles; tsup externalized dependencies by default.
#   --splitting           code-split dynamic imports into shared chunks.
#   --minify              production bundles.
#   --sourcemap=external  ship .js.map next to each bundle for stacked traces.
set -u

COMMON="--format esm --target node --minify --sourcemap=external --splitting --packages=external"

pids=()
fail=0

# build <entry> <outdir>
build() {
	rm -rf "$2"
	bun build "$1" $COMMON --outdir "$2"
}

build leetcode/packages/core/src/index.ts leetcode/packages/core/dist &
pids+=($!)
build trophy/src/renderer.ts api/_build/trophy &
pids+=($!)
build streak/src/index.ts streak/dist &
pids+=($!)
build streak/src/index.ts api/_build/streak &
pids+=($!)
build stats/src/index.ts stats/api &
pids+=($!)

for pid in "${pids[@]}"; do
	if ! wait "$pid"; then
		fail=1
	fi
done

exit "$fail"
