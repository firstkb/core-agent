#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG_PATH="$ROOT_DIR/dev/caddy/Caddyfile"
export PATH="/opt/homebrew/bin:$PATH"
export XDG_DATA_HOME="$ROOT_DIR/.local/share"
export XDG_CONFIG_HOME="$ROOT_DIR/.local/config"

mkdir -p "$XDG_DATA_HOME" "$XDG_CONFIG_HOME"

if ! command -v caddy >/dev/null 2>&1; then
  echo "Caddy is not installed. Install it first."
  exit 1
fi

CADDY_BIN="$(command -v caddy)"

if [ "$(id -u)" -ne 0 ]; then
  exec sudo XDG_DATA_HOME="$XDG_DATA_HOME" XDG_CONFIG_HOME="$XDG_CONFIG_HOME" \
    "$CADDY_BIN" run --config "$CONFIG_PATH" --adapter caddyfile
fi

exec "$CADDY_BIN" run --config "$CONFIG_PATH" --adapter caddyfile
