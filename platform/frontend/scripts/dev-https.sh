#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="/opt/homebrew/bin:$PATH"
ADMIN_APP_PORT=5173
TENANT_APP_PORT=5174
PROXY_MODE="root"
KEEPAWAKE_ENABLED="${DEV_SESSION_KEEPAWAKE:-1}"

usage() {
  cat <<'EOF'
Usage: dev-https.sh [--proxy-mode root|user|launchd]
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --proxy-mode)
      if [ "$#" -lt 2 ]; then
        echo "--proxy-mode requires a value."
        exit 1
      fi
      PROXY_MODE="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1"
      usage
      exit 1
      ;;
  esac
done

port_is_listening() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

start_keepawake() {
  if [ "$KEEPAWAKE_ENABLED" = "0" ] || ! command -v caffeinate >/dev/null 2>&1; then
    return
  fi

  caffeinate -ims &
  CAFFEINATE_PID=$!
  echo "Holding a caffeinate assertion while this dev session is active."
}

wait_for_session() {
  if [ -n "${DEV_PID:-}" ]; then
    wait "$DEV_PID"
    return
  fi

  echo "Reused existing frontend dev servers. Press Ctrl-C when you want to release caffeinate."
  tail -f /dev/null &
  HOLD_PID=$!
  wait "$HOLD_PID"
}

cleanup() {
  if [ -n "${HOLD_PID:-}" ] && kill -0 "$HOLD_PID" >/dev/null 2>&1; then
    kill "$HOLD_PID" >/dev/null 2>&1 || true
    wait "$HOLD_PID" >/dev/null 2>&1 || true
  fi

  if [ -n "${DEV_PID:-}" ] && kill -0 "$DEV_PID" >/dev/null 2>&1; then
    kill "$DEV_PID" >/dev/null 2>&1 || true
    wait "$DEV_PID" >/dev/null 2>&1 || true
  fi

  if [ -n "${CAFFEINATE_PID:-}" ] && kill -0 "$CAFFEINATE_PID" >/dev/null 2>&1; then
    kill "$CAFFEINATE_PID" >/dev/null 2>&1 || true
    wait "$CAFFEINATE_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

if port_is_listening "$ADMIN_APP_PORT" && port_is_listening "$TENANT_APP_PORT"; then
  echo "Detected existing frontend dev servers on ports $ADMIN_APP_PORT and $TENANT_APP_PORT. Reusing them."
elif ! port_is_listening "$ADMIN_APP_PORT" && ! port_is_listening "$TENANT_APP_PORT"; then
  cd "$ROOT_DIR"
  pnpm dev &
  DEV_PID=$!

  for _ in $(seq 1 40); do
    if port_is_listening "$ADMIN_APP_PORT" && port_is_listening "$TENANT_APP_PORT"; then
      break
    fi

    if ! kill -0 "$DEV_PID" >/dev/null 2>&1; then
      echo "Frontend dev servers exited before ports $ADMIN_APP_PORT and $TENANT_APP_PORT were ready."
      exit 1
    fi

    sleep 0.25
  done

  if ! port_is_listening "$ADMIN_APP_PORT" || ! port_is_listening "$TENANT_APP_PORT"; then
    echo "Frontend dev servers did not become ready on ports $ADMIN_APP_PORT and $TENANT_APP_PORT."
    exit 1
  fi
else
  echo "Detected a partial frontend startup state."
  echo "Either stop existing dev servers or start both apps before running pnpm dev:https."
  exit 1
fi

start_keepawake

case "$PROXY_MODE" in
  root|user)
    "$ROOT_DIR/scripts/dev-proxy.sh" --mode "$PROXY_MODE"
    ;;
  launchd)
    "$ROOT_DIR/scripts/dev-proxy-launchd.sh" ensure
    wait_for_session
    ;;
  *)
    echo "Unsupported proxy mode: $PROXY_MODE"
    usage
    exit 1
    ;;
esac
