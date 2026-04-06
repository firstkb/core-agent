#!/usr/bin/env bash
set -euo pipefail

if ! command -v caddy >/dev/null 2>&1; then
  echo "Caddy is not installed. Install it first."
  exit 1
fi

export PATH="/opt/homebrew/bin:$PATH"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MODE="root"
AS_ROOT=0
STARTED_CADDY=0

CADDY_BIN="$(command -v caddy)"

usage() {
  cat <<'EOF'
Usage: dev-trust-caddy.sh [--mode root|user]
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --mode)
      if [ "$#" -lt 2 ]; then
        echo "--mode requires a value."
        exit 1
      fi
      MODE="$2"
      shift 2
      ;;
    --as-root)
      AS_ROOT=1
      shift
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

case "$MODE" in
  root)
    export XDG_DATA_HOME="$ROOT_DIR/.local/root/share"
    export XDG_CONFIG_HOME="$ROOT_DIR/.local/root/config"
    CONFIG_PATH="$ROOT_DIR/dev/caddy/Caddyfile"
    ADMIN_ADDRESS="127.0.0.1:2019"
    REQUIRES_ROOT_FOR_RUNTIME=1
    ;;
  user)
    export XDG_DATA_HOME="$ROOT_DIR/.local/user/share"
    export XDG_CONFIG_HOME="$ROOT_DIR/.local/user/config"
    CONFIG_PATH="$ROOT_DIR/dev/caddy/Caddyfile.high-port"
    ADMIN_ADDRESS="127.0.0.1:2020"
    REQUIRES_ROOT_FOR_RUNTIME=0
    ;;
  *)
    echo "Unsupported mode: $MODE"
    usage
    exit 1
    ;;
esac

mkdir -p "$XDG_DATA_HOME" "$XDG_CONFIG_HOME"

if [ "$REQUIRES_ROOT_FOR_RUNTIME" -eq 1 ] && [ "$AS_ROOT" -ne 1 ] && [ "$(id -u)" -ne 0 ]; then
  exec sudo env \
    PATH="$PATH" \
    XDG_DATA_HOME="$XDG_DATA_HOME" \
    XDG_CONFIG_HOME="$XDG_CONFIG_HOME" \
    "$0" --mode root --as-root
fi

cleanup() {
  if [ "$STARTED_CADDY" -eq 1 ]; then
    "$CADDY_BIN" stop --address "$ADMIN_ADDRESS" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

if ! curl -fsS "http://$ADMIN_ADDRESS/pki/ca/local/certificates" >/dev/null 2>&1; then
  "$CADDY_BIN" start --config "$CONFIG_PATH" --adapter caddyfile >/dev/null
  STARTED_CADDY=1
fi

for _ in $(seq 1 20); do
  if curl -fsS "http://$ADMIN_ADDRESS/pki/ca/local/certificates" >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done

if ! curl -fsS "http://$ADMIN_ADDRESS/pki/ca/local/certificates" >/dev/null 2>&1; then
  echo "Caddy admin API is not reachable at $ADMIN_ADDRESS."
  exit 1
fi

if [ "$MODE" = "root" ]; then
  "$CADDY_BIN" trust --address "$ADMIN_ADDRESS"
else
  sudo env PATH="$PATH" "$CADDY_BIN" trust --address "$ADMIN_ADDRESS"
fi

echo "Trusted local Caddy CA."
