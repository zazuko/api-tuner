#!/usr/bin/env bash

SCRIPT_DIR=$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)

# find JS entrypoint
tuner="$SCRIPT_DIR/index.js"

# if tsx exists in path
if command -v tsx > /dev/null 2>&1
then
  # use tsx
  node --import tsx --no-warnings "$tuner" "$@"
else
  # use plain node
  node "$tuner" "$@"
fi
