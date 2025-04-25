#!/usr/bin/env bash

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

# find JS entrypoint
script="$SCRIPT_DIR/merge-curl-output.js"

# if tsx exists in path
if command -v tsx > /dev/null 2>&1
then
  # use tsx
  node --import tsx --no-warnings "$script" "$@"
else
  # use plain node
  node "$script" "$@"
fi
