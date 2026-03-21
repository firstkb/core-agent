#!/usr/bin/env bash
set -euo pipefail

if ! command -v caddy >/dev/null 2>&1; then
  echo "Caddy is not installed. Install it first."
  exit 1
fi

export PATH="/opt/homebrew/bin:$PATH"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
export XDG_DATA_HOME="$ROOT_DIR/.local/share"
export XDG_CONFIG_HOME="$ROOT_DIR/.local/config"
CONFIG_PATH="$ROOT_DIR/dev/caddy/Caddyfile"
ADMIN_ADDRESS="127.0.0.1:2019"
STARTED_CADDY=0

mkdir -p "$XDG_DATA_HOME" "$XDG_CONFIG_HOME"

CADDY_BIN="$(command -v caddy)"

if [ "${1:-}" != "--as-root" ] && [ "$(id -u)" -ne 0 ]; then
  exec sudo env \
    PATH="$PATH" \
    XDG_DATA_HOME="$XDG_DATA_HOME" \
    XDG_CONFIG_HOME="$XDG_CONFIG_HOME" \
    "$0" --as-root
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

"$CADDY_BIN" trust --address "$ADMIN_ADDRESS"
echo "Trusted local Caddy CA."
