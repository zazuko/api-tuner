SCRIPT_PATH=$(dirname "$(readlink -f "$0")")

DEBUG=false
PATHS=()
# USAGE: ./tuner.sh --debug --keep ...paths
while [ $# -gt 0 ]; do
  case "$1" in
    --debug)
      DEBUG=true
      shift
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

eye $ARGS "${SCRIPT_PATH}"/../rules/*.n3 "${PATHS[@]}"
