#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$(cd "$ROOT_DIR/../backend" && pwd)"
export PATH="/opt/homebrew/bin:$PATH"
export XDG_DATA_HOME="$ROOT_DIR/.local/share"
export XDG_CONFIG_HOME="$ROOT_DIR/.local/config"

ADMIN_APP_PORT=5173
TENANT_APP_PORT=5174
TENANT_API_PORT=8080
ADMIN_API_PORT=8081
AUTH_API_PORT=8082

PIDS=()

mkdir -p "$XDG_DATA_HOME" "$XDG_CONFIG_HOME"

port_is_listening() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

start_process() {
  (
    cd "$1"
    shift
    "$@"
  ) &
  PIDS+=("$!")
}

cleanup() {
  for pid in "${PIDS[@]:-}"; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
      wait "$pid" >/dev/null 2>&1 || true
    fi
  done
}

trap cleanup EXIT INT TERM

start_frontend_if_needed() {
  if port_is_listening "$ADMIN_APP_PORT" && port_is_listening "$TENANT_APP_PORT"; then
    echo "Detected existing frontend dev servers on ports $ADMIN_APP_PORT and $TENANT_APP_PORT. Reusing them."
    return
  fi

  if port_is_listening "$ADMIN_APP_PORT" || port_is_listening "$TENANT_APP_PORT"; then
    echo "Detected a partial frontend startup state."
    echo "Either stop existing frontend dev servers or start both apps before running pnpm dev:stack:https."
    exit 1
  fi

  echo "Starting frontend dev servers..."
  start_process "$ROOT_DIR" pnpm dev

  for _ in $(seq 1 60); do
    if port_is_listening "$ADMIN_APP_PORT" && port_is_listening "$TENANT_APP_PORT"; then
      echo "Frontend dev servers are ready."
      return
    fi
    sleep 0.5
  done

  echo "Frontend dev servers did not become ready on ports $ADMIN_APP_PORT and $TENANT_APP_PORT."
  exit 1
}

start_backend_if_needed() {
  if port_is_listening "$TENANT_API_PORT" && port_is_listening "$ADMIN_API_PORT" && port_is_listening "$AUTH_API_PORT"; then
    echo "Detected existing backend runtimes on ports $TENANT_API_PORT, $ADMIN_API_PORT, and $AUTH_API_PORT. Reusing them."
    return
  fi

  if port_is_listening "$TENANT_API_PORT" || port_is_listening "$ADMIN_API_PORT" || port_is_listening "$AUTH_API_PORT"; then
    echo "Detected a partial backend startup state."
    echo "Either stop existing backend runtimes or start all three before running pnpm dev:stack:https."
    exit 1
  fi

  echo "Starting backend runtimes..."
  start_process "$BACKEND_DIR" go run ./cmd/api-tenant --env ./env/api-tenant.local-bearer.env
  start_process "$BACKEND_DIR" go run ./cmd/api-admin --env ./env/api-admin.local-bearer.env
  start_process "$BACKEND_DIR" go run ./cmd/auth --env ./env/auth.local.env.example

  for _ in $(seq 1 60); do
    if port_is_listening "$TENANT_API_PORT" && port_is_listening "$ADMIN_API_PORT" && port_is_listening "$AUTH_API_PORT"; then
      echo "Backend runtimes are ready."
      return
    fi
    sleep 0.5
  done

  echo "Backend runtimes did not become ready on ports $TENANT_API_PORT, $ADMIN_API_PORT, and $AUTH_API_PORT."
  exit 1
}

start_frontend_if_needed
start_backend_if_needed

echo "Starting local HTTPS proxy..."
"$ROOT_DIR/scripts/dev-proxy.sh"
