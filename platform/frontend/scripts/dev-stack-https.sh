#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$(cd "$ROOT_DIR/../backend" && pwd)"
export PATH="/opt/homebrew/bin:$PATH"

ADMIN_APP_PORT=5173
TENANT_APP_PORT=5174
TENANT_API_PORT=8080
ADMIN_API_PORT=8081
AUTH_API_PORT=8082
PROXY_MODE="root"
KEEPAWAKE_ENABLED="${DEV_SESSION_KEEPAWAKE:-1}"

PIDS=()

usage() {
  cat <<'EOF'
Usage: dev-stack-https.sh [--proxy-mode root|user|launchd]
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

start_process() {
  (
    cd "$1"
    shift
    "$@"
  ) &
  PIDS+=("$!")
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
  local exit_code=0

  if [ "${#PIDS[@]}" -gt 0 ]; then
    for pid in "${PIDS[@]}"; do
      if wait "$pid"; then
        :
      else
        exit_code=$?
      fi
    done
    return "$exit_code"
  fi

  echo "Reused existing frontend/backend runtimes. Press Ctrl-C when you want to release caffeinate."
  tail -f /dev/null &
  HOLD_PID=$!
  wait "$HOLD_PID"
}

cleanup() {
  if [ -n "${HOLD_PID:-}" ] && kill -0 "$HOLD_PID" >/dev/null 2>&1; then
    kill "$HOLD_PID" >/dev/null 2>&1 || true
    wait "$HOLD_PID" >/dev/null 2>&1 || true
  fi

  for pid in "${PIDS[@]:-}"; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
      wait "$pid" >/dev/null 2>&1 || true
    fi
  done

  if [ -n "${CAFFEINATE_PID:-}" ] && kill -0 "$CAFFEINATE_PID" >/dev/null 2>&1; then
    kill "$CAFFEINATE_PID" >/dev/null 2>&1 || true
    wait "$CAFFEINATE_PID" >/dev/null 2>&1 || true
  fi
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

start_keepawake

echo "Starting local HTTPS proxy..."
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
