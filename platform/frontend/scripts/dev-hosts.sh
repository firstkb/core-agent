#!/usr/bin/env bash
set -euo pipefail

cat <<'EOF'
No /etc/hosts changes are required.

Local dev domains now use the .localhost suffix:
  https://admin.platform.localhost
  https://demo.platform.localhost
  https://acme.platform.localhost

.localhost resolves to loopback without a hosts entry and avoids macOS .local
mDNS/Bonjour resolution stalls.
EOF
