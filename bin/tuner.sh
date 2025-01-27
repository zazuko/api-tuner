SCRIPT_PATH=$(dirname "$(readlink -f "$0")")

DEBUG=false
PATHS=()
# USAGE: ./tuner.sh --debug --version ...paths
while [ $# -gt 0 ]; do
  case "$1" in
    --debug)
      DEBUG=true
      shift
      ;;
    --version)
      # read from ./package.json
      API_TUNER_VERSION=$(cat "${SCRIPT_PATH}"/../package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')
      echo "API-TUNER v${API_TUNER_VERSION}"
      "${SCRIPT_PATH}"/eye --version
      exit 0
      ;;
    *)
      PATHS+=("$1")
      shift
      ;;
  esac
done

ARGS="--quiet --nope --pass"

if [ "$DEBUG" = true ]; then
  ARGS="$ARGS ${SCRIPT_PATH}/../debug/rules.n3"
fi

"${SCRIPT_PATH}"/eye $ARGS "${SCRIPT_PATH}"/../rules/*.n3 "${PATHS[@]}"
