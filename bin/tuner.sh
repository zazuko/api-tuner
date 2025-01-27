#!/bin/bash
SCRIPT_PATH=$(dirname "$(readlink -f "$0")")

eye="swipl -x ${SCRIPT_PATH}/../lib/eye.pvm --"

# function prints version
function version() {
  # read from ./package.json
  API_TUNER_VERSION=$(cat "${SCRIPT_PATH}"/../package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')
  echo "API-TUNER v${API_TUNER_VERSION}"
  $eye --version
}

DEBUG=false
SUMMARY="tee"
PATHS=()
# USAGE: ./tuner.sh --debug --version ...paths
while [ $# -gt 0 ]; do
  case "$1" in
    --debug)
      DEBUG=true
      shift
      ;;
    --summary)
      SUMMARY="node ${SCRIPT_PATH}/../lib/summarise-results.js"
      shift
      ;;
    --version)
      version
      exit 0
      ;;
    *)
      PATHS+=("$1")
      shift
      ;;
  esac
done

# if no paths
if [ ${#PATHS[@]} -eq 0 ]; then
  version
  exit 1
fi

ARGS="--quiet --nope --pass"

if [ "$DEBUG" = true ]; then
  ARGS="$ARGS ${SCRIPT_PATH}/../debug/rules.n3"
fi

$eye $ARGS "${SCRIPT_PATH}"/../rules/*.n3 "${PATHS[@]}" | $SUMMARY
