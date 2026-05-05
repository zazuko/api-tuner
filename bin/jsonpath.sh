#!/usr/bin/env bash

SCRIPT_DIR=$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)

# find JS entrypoint
executable="$SCRIPT_DIR/../lib/jsonpath.js"

# if tsx exists in path
if command -v tsx > /dev/null 2>&1
then
  # use tsx
  node --import tsx --no-warnings "$executable" "$@"
else
  # use plain node
  node "$executable" "$@"
fi
