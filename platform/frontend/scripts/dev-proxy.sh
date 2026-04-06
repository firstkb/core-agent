#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="/opt/homebrew/bin:$PATH"
MODE="root"

usage() {
  cat <<'EOF'
Usage: dev-proxy.sh [--mode root|user]

Modes:
  root  Run the privileged Caddy config on port 443.
  user  Run the user-level Caddy config on port 8443 without sudo.
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
    --root)
      MODE="root"
      shift
      ;;
    --user)
      MODE="user"
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
    CONFIG_PATH="$ROOT_DIR/dev/caddy/Caddyfile"
    XDG_DATA_HOME="$ROOT_DIR/.local/root/share"
    XDG_CONFIG_HOME="$ROOT_DIR/.local/root/config"
    URLS=(
      "https://admin.platform.local"
      "https://demo.platform.local"
      "https://acme.platform.local"
    )
    REQUIRES_ROOT=1
    ;;
  user)
    CONFIG_PATH="$ROOT_DIR/dev/caddy/Caddyfile.high-port"
    XDG_DATA_HOME="$ROOT_DIR/.local/user/share"
    XDG_CONFIG_HOME="$ROOT_DIR/.local/user/config"
    URLS=(
      "https://admin.platform.local:8443"
      "https://demo.platform.local:8443"
      "https://acme.platform.local:8443"
    )
    REQUIRES_ROOT=0
    ;;
  *)
    echo "Unsupported mode: $MODE"
    usage
    exit 1
    ;;
esac

export XDG_DATA_HOME
export XDG_CONFIG_HOME

mkdir -p "$XDG_DATA_HOME" "$XDG_CONFIG_HOME"

if ! command -v caddy >/dev/null 2>&1; then
  echo "Caddy is not installed. Install it first."
  exit 1
fi

CADDY_BIN="$(command -v caddy)"

printf 'Starting Caddy in %s mode:\n' "$MODE"
printf '  %s\n' "${URLS[@]}"

if [ "$REQUIRES_ROOT" -eq 1 ] && [ "$(id -u)" -ne 0 ]; then
  exec sudo XDG_DATA_HOME="$XDG_DATA_HOME" XDG_CONFIG_HOME="$XDG_CONFIG_HOME" \
    "$CADDY_BIN" run --config "$CONFIG_PATH" --adapter caddyfile
fi

exec "$CADDY_BIN" run --config "$CONFIG_PATH" --adapter caddyfile
