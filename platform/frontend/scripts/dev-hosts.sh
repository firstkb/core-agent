#!/usr/bin/env bash
set -euo pipefail

HOSTS_LINE="127.0.0.1 admin.platform.local demo.platform.local acme.platform.local"
export PATH="/opt/homebrew/bin:$PATH"

if grep -q "admin.platform.local" /etc/hosts && grep -q "demo.platform.local" /etc/hosts && grep -q "acme.platform.local" /etc/hosts; then
  echo "Hosts entries already present."
  exit 0
fi

printf '\n%s\n' "$HOSTS_LINE" | sudo tee -a /etc/hosts >/dev/null
echo "Added hosts entries for admin.platform.local, demo.platform.local, and acme.platform.local."
