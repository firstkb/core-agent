#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$(cd "$ROOT_DIR/../backend" && pwd)"
export PATH="/opt/homebrew/bin:$PATH"

DRY_RUN=0
FORCE=0
GRACE_SECONDS=2

PORTS=(
  80
  443
  2019
  2020
  5173
  5174
  8080
  8081
  8082
  8443
)

PIDS=()
DESCRIPTIONS=()

usage() {
  cat <<'EOF'
Usage: dev-stop-stack.sh [--dry-run] [--force]

Stops the local frontend/backend stack used by this repository:
  - launchd-managed Caddy on 443
  - direct-run Caddy on 2019/2020/8443
  - frontend Vite/Turbo processes on 5173/5174
  - backend local APIs on 8080/8081/8082

Options:
  --dry-run  Show what would be stopped without sending signals
  --force    Escalate to SIGKILL if a graceful stop does not work
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --force)
      FORCE=1
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

pid_in_list() {
  local candidate="$1"
  local existing
  for existing in "${PIDS[@]:-}"; do
    if [ "$existing" = "$candidate" ]; then
      return 0
    fi
  done
  return 1
}

add_pid() {
  local pid="$1"
  local description="$2"

  if ! pid_in_list "$pid"; then
    PIDS+=("$pid")
    DESCRIPTIONS+=("$description")
  fi
}

matches_repo_stack_listener() {
  local port="$1"
  local command_name="$2"

  case "$port:$command_name" in
    80:caddy|443:caddy|2019:caddy|2020:caddy|8443:caddy|5173:node|5174:node|8080:api-tenan|8080:api-tenant|8081:api-admin|8082:auth)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

listeners_for_port() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN 2>/dev/null | awk 'NR > 1 {print $1 "|" $2}' | sort -u
}

report_remaining_ports() {
  local remaining

  remaining="$(lsof -nP -iTCP:80 -iTCP:443 -iTCP:2019 -iTCP:2020 -iTCP:5173 -iTCP:5174 -iTCP:8080 -iTCP:8081 -iTCP:8082 -iTCP:8443 -sTCP:LISTEN 2>/dev/null || true)"

  echo
  echo "Remaining listeners on known stack ports:"
  if [ -n "$remaining" ]; then
    printf '%s\n' "$remaining"
  else
    echo "  none"
  fi
}

try_launchd_stop() {
  if ! "$ROOT_DIR/scripts/dev-proxy-launchd.sh" status 2>/dev/null | grep -q "state = running"; then
    return
  fi

  if [ "$DRY_RUN" -eq 1 ]; then
    echo "Would stop launchd-managed Caddy on 443."
    return
  fi

  echo "Stopping launchd-managed Caddy on 443..."
  "$ROOT_DIR/scripts/dev-proxy-launchd.sh" stop
}

try_caddy_admin_stop() {
  local address

  if ! command -v caddy >/dev/null 2>&1; then
    return
  fi

  for address in 127.0.0.1:2020 127.0.0.1:2019; do
    if [ "$DRY_RUN" -eq 1 ]; then
      echo "Would try 'caddy stop --address $address'."
      continue
    fi

    if caddy stop --address "$address" >/dev/null 2>&1; then
      echo "Stopped Caddy admin endpoint at $address."
    fi
  done
}

collect_port_pids() {
  local port
  local listener
  local pid
  local command_name

  for port in "${PORTS[@]}"; do
    while IFS= read -r listener; do
      [ -n "$listener" ] || continue
      command_name="${listener%%|*}"
      pid="${listener##*|}"
      if [ -z "$pid" ] || [ -z "$command_name" ]; then
        continue
      fi
      if matches_repo_stack_listener "$port" "$command_name"; then
        add_pid "$pid" "command=$command_name port=$port"
      fi
    done <<EOF
$(listeners_for_port "$port")
EOF
  done
}

pid_is_alive() {
  kill -0 "$1" >/dev/null 2>&1 || sudo kill -0 "$1" >/dev/null 2>&1
}

signal_pid() {
  local signal="$1"
  local pid="$2"

  kill "-$signal" "$pid" >/dev/null 2>&1 || sudo kill "-$signal" "$pid" >/dev/null 2>&1
}

stop_pid() {
  local pid="$1"
  local description="$2"
  local deadline

  if [ "$DRY_RUN" -eq 1 ]; then
    echo "Would stop pid=$pid"
    echo "  $description"
    return
  fi

  echo "Stopping pid=$pid"
  echo "  $description"

  if ! signal_pid TERM "$pid"; then
    echo "  failed to send SIGTERM"
    return
  fi

  deadline=$((GRACE_SECONDS * 10))
  while [ "$deadline" -gt 0 ]; do
    if ! pid_is_alive "$pid"; then
      echo "  stopped"
      return
    fi
    sleep 0.1
    deadline=$((deadline - 1))
  done

  if [ "$FORCE" -eq 1 ]; then
    echo "  still running after ${GRACE_SECONDS}s, sending SIGKILL"
    if signal_pid KILL "$pid"; then
      echo "  killed"
    else
      echo "  failed to send SIGKILL"
    fi
    return
  fi

  echo "  still running after ${GRACE_SECONDS}s"
  echo "  rerun with --force if you want SIGKILL"
}

try_launchd_stop
try_caddy_admin_stop
collect_port_pids

if [ "${#PIDS[@]}" -eq 0 ]; then
  echo "No matching frontend/backend stack listeners found."
  report_remaining_ports
  exit 0
fi

echo "Found ${#PIDS[@]} stack process(es) to stop."

for index in "${!PIDS[@]}"; do
  stop_pid "${PIDS[$index]}" "${DESCRIPTIONS[$index]}"
done

report_remaining_ports
