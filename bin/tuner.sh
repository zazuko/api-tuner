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

BASE_IRI=""
DEBUG=false
SUMMARY="node ${SCRIPT_PATH}/../lib/summarise-results.js"
PATHS=()
# USAGE: ./tuner.sh --debug --version ...paths
while [ $# -gt 0 ]; do
  case "$1" in
    --debug)
      DEBUG=true
      shift
      ;;
    --summary)
      SUMMARY="node ${SCRIPT_PATH}/../lib/summarise-results.js --summary"
      shift
      ;;
    --base-iri)
      BASE_IRI="$2"
      shift
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

MERGED="$(mktemp)"
if [ -n "$BASE_IRI" ]; then
  echo "base <$BASE_IRI>" > "$MERGED"
fi

for path in "${PATHS[@]}"; do
  cat "$path" >> "$MERGED"
done

$eye $ARGS "${SCRIPT_PATH}"/../rules/*.n3 "${MERGED}" | $SUMMARY
