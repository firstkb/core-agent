#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="/opt/homebrew/bin:$PATH"

LABEL="dev.firstkb.platform-frontend.caddy"
PLIST_PATH="/Library/LaunchDaemons/${LABEL}.plist"
CONFIG_PATH="$ROOT_DIR/dev/caddy/Caddyfile"
STATE_ROOT="$ROOT_DIR/.local/root"
XDG_DATA_HOME="$STATE_ROOT/share"
XDG_CONFIG_HOME="$STATE_ROOT/config"
LOG_DIR="$STATE_ROOT/log"
STDOUT_LOG="$LOG_DIR/caddy.stdout.log"
STDERR_LOG="$LOG_DIR/caddy.stderr.log"
ACTION="${1:-status}"

usage() {
  cat <<EOF
Usage: dev-proxy-launchd.sh [install|ensure|start|stop|restart|status|uninstall]

Launchd label: $LABEL
Plist path:    $PLIST_PATH
EOF
}

if ! command -v caddy >/dev/null 2>&1; then
  echo "Caddy is not installed. Install it first."
  exit 1
fi

CADDY_BIN="$(command -v caddy)"

require_root() {
  if [ "$(id -u)" -ne 0 ]; then
    exec sudo env PATH="$PATH" "$0" "$@"
  fi
}

render_plist() {
  cat <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${CADDY_BIN}</string>
    <string>run</string>
    <string>--config</string>
    <string>${CONFIG_PATH}</string>
    <string>--adapter</string>
    <string>caddyfile</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    <key>XDG_DATA_HOME</key>
    <string>${XDG_DATA_HOME}</string>
    <key>XDG_CONFIG_HOME</key>
    <string>${XDG_CONFIG_HOME}</string>
  </dict>
  <key>KeepAlive</key>
  <true/>
  <key>RunAtLoad</key>
  <true/>
  <key>WorkingDirectory</key>
  <string>${ROOT_DIR}</string>
  <key>StandardOutPath</key>
  <string>${STDOUT_LOG}</string>
  <key>StandardErrorPath</key>
  <string>${STDERR_LOG}</string>
</dict>
</plist>
EOF
}

sync_plist() {
  local tmp_file
  tmp_file="$(mktemp)"
  render_plist > "$tmp_file"

  if [ ! -f "$PLIST_PATH" ] || ! cmp -s "$tmp_file" "$PLIST_PATH"; then
    mkdir -p "$XDG_DATA_HOME" "$XDG_CONFIG_HOME" "$LOG_DIR"
    mv "$tmp_file" "$PLIST_PATH"
    chmod 644 "$PLIST_PATH"
    return 0
  fi

  rm -f "$tmp_file"
  return 1
}

is_loaded() {
  launchctl print "system/${LABEL}" >/dev/null 2>&1
}

bootout_label() {
  launchctl bootout "system/${LABEL}" >/dev/null 2>&1 || true
  launchctl bootout system "$PLIST_PATH" >/dev/null 2>&1 || true
}

bootstrap_label() {
  launchctl bootstrap system "$PLIST_PATH"
  launchctl enable "system/${LABEL}" >/dev/null 2>&1 || true
}

print_urls() {
  cat <<'EOF'
Managed URLs:
  https://admin.platform.local
  https://demo.platform.local
  https://acme.platform.local
EOF
}

install_or_ensure() {
  local changed=0

  if sync_plist; then
    changed=1
  fi

  if is_loaded; then
    if [ "$changed" -eq 1 ]; then
      bootout_label
      bootstrap_label
    fi
  else
    bootstrap_label
  fi
}

case "$ACTION" in
  install)
    require_root install
    install_or_ensure
    launchctl kickstart -k "system/${LABEL}" >/dev/null
    echo "Installed launchd Caddy daemon at $PLIST_PATH."
    print_urls
    ;;
  ensure)
    require_root ensure
    install_or_ensure
    echo "Launchd Caddy daemon is available."
    print_urls
    ;;
  start)
    require_root start
    install_or_ensure
    launchctl kickstart -k "system/${LABEL}" >/dev/null
    echo "Started launchd Caddy daemon."
    print_urls
    ;;
  stop)
    require_root stop
    if is_loaded; then
      bootout_label
      echo "Stopped launchd Caddy daemon."
    else
      echo "Launchd Caddy daemon is not loaded."
    fi
    ;;
  restart)
    require_root restart
    install_or_ensure
    launchctl kickstart -k "system/${LABEL}" >/dev/null
    echo "Restarted launchd Caddy daemon."
    print_urls
    ;;
  uninstall)
    require_root uninstall
    bootout_label
    rm -f "$PLIST_PATH"
    echo "Removed $PLIST_PATH."
    ;;
  status)
    if is_loaded; then
      launchctl print "system/${LABEL}" | sed -n '1,120p'
    else
      echo "Launchd Caddy daemon is not loaded."
      echo "Run: pnpm dev:proxy:launchd:install"
    fi
    echo "stdout log: $STDOUT_LOG"
    echo "stderr log: $STDERR_LOG"
    print_urls
    ;;
  -h|--help)
    usage
    ;;
  *)
    echo "Unknown action: $ACTION"
    usage
    exit 1
    ;;
esac
