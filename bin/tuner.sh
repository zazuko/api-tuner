#!/usr/bin/env bash

WORKING_DIR=$(pwd)

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
cd "$SCRIPT_DIR" || exit

# find JS entrypoint
tuner=$(node -e "console.log(require.resolve('api-tuner/bin/index.js'))" 2> /dev/null)

cd "$WORKING_DIR" || exit

# if tsx exists in path
if command -v tsx > /dev/null 2>&1
then
  # use tsx
  node --import tsx --no-warnings "$tuner" "$@"
else
  # use plain node
  node "$tuner" "$@"
fi
