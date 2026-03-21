#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="/opt/homebrew/bin:$PATH"
export XDG_DATA_HOME="$ROOT_DIR/.local/share"
export XDG_CONFIG_HOME="$ROOT_DIR/.local/config"
ADMIN_APP_PORT=5173
TENANT_APP_PORT=5174

mkdir -p "$XDG_DATA_HOME" "$XDG_CONFIG_HOME"

port_is_listening() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

cleanup() {
  if [ -n "${DEV_PID:-}" ] && kill -0 "$DEV_PID" >/dev/null 2>&1; then
    kill "$DEV_PID" >/dev/null 2>&1 || true
    wait "$DEV_PID" >/dev/null 2>&1 || true
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

"$ROOT_DIR/scripts/dev-proxy.sh"
