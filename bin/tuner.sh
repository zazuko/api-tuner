#!/bin/bash
SCRIPT_PATH=$(dirname "$(readlink -f "$0")")

eye="swipl -x ${SCRIPT_PATH}/../eye/lib/eye.pvm --"

# function prints version
function version() {
  # read from ./package.json
  API_TUNER_VERSION=$(cat "${SCRIPT_PATH}"/../package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')
  echo "API-TUNER v${API_TUNER_VERSION}"
  $eye --version
}

 function usage() {
   echo "Usage: api-tuner [options] <path>..."
   echo ""
   echo "Options:"
   echo "  --lib <path>       Specify rules to include in all tests"
   echo "  --silent           Less output"
   echo "  --debug            Enable debug output"
   echo "  --raw              Output raw results from eye"
   echo "  --base-iri <iri>   Specify the base IRI for parsing the test case files"
   echo "  --version          Show version information"
   echo "  --help             Show this help message"
 }

SILENT=false
BASE_IRI=""
DEBUG=false
SUMMARY="node ${SCRIPT_PATH}/../lib/summarise-results.js --summary"
PATHS=()
LIBS=()
# USAGE: ./tuner.sh --debug --version ...paths
while [ $# -gt 0 ]; do
  case "$1" in
    --debug)
      DEBUG=true
      shift
      ;;
    --silent)
      SILENT=true
      shift
      ;;
    --raw)
      SUMMARY="node ${SCRIPT_PATH}/../lib/summarise-results.js"
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
    --help)
      usage
      exit 0
      ;;
    --lib)
      LIBS+=("$2")
      shift
      shift
      ;;
    *)
      PATHS+=("$1")
      shift
      ;;
  esac
done

# if no paths
if [ ${#PATHS[@]} -eq 0 ]; then
  usage
  exit 1
fi

ARGS="--quiet --nope --pass"

if [ "$DEBUG" = true ]; then
  ARGS="$ARGS ${SCRIPT_PATH}/../logging/debug.n3"
fi

if [ "$SILENT" != true ]; then
  ARGS="$ARGS ${SCRIPT_PATH}/../logging/info.n3"
fi

set -o pipefail
for path in "${PATHS[@]}"; do
  (
    node "${SCRIPT_PATH}/../lib/parse-test-case.js" --base-iri "$BASE_IRI" -- "${path}" \
      | $eye $ARGS "${SCRIPT_PATH}"/../rules/*.n3 "${LIBS[*]}" -
  ) ;
done | $SUMMARY
