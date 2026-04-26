#!/usr/bin/env bash
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FAILED=0
OPTIONAL_FAILED=0
MODE="lite"

usage() {
  cat <<'USAGE'
Usage: scripts/ai/preflight.sh [--lite|--full|--docs|--help]

Modes:
  --lite  Required docs/memory/env checks plus quick agent-cli tests when available. Default.
  --full  Lite checks plus backend and frontend checks when local tooling is present.
  --docs  Required docs/memory/env checks only.

The script never installs dependencies and is not a GitHub Actions gate.
USAGE
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --lite)
      MODE="lite"
      ;;
    --full)
      MODE="full"
      ;;
    --docs)
      MODE="docs"
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      printf 'Unknown option: %s\n\n' "$1" >&2
      usage >&2
      exit 64
      ;;
  esac
  shift
done

run_required() {
  local label="$1"
  shift
  printf '\n==> %s\n' "$label"
  if (cd "$ROOT" && "$@"); then
    printf 'ok: %s\n' "$label"
  else
    printf 'FAILED: %s\n' "$label" >&2
    FAILED=1
  fi
}

run_optional() {
  local label="$1"
  shift
  printf '\n==> %s\n' "$label"
  if (cd "$ROOT" && "$@"); then
    printf 'ok: %s\n' "$label"
  else
    printf 'OPTIONAL FAILED: %s\n' "$label" >&2
    OPTIONAL_FAILED=1
  fi
}

skip_optional() {
  local reason="$1"
  printf '\nSKIP: %s\n' "$reason" >&2
}

have_cmd() {
  command -v "$1" >/dev/null 2>&1
}

node_supports_frontend() {
  node -e 'const [major, minor] = process.versions.node.split(".").map(Number); process.exit(major > 22 || (major === 22 && minor >= 12) ? 0 : 1);' >/dev/null 2>&1
}

run_required "docs memory check" python3 scripts/ai/docs_memory_check.py --check
run_required "env policy check" python3 scripts/ai/check-env-policy.py --check
run_required "Atlas automation version check" python3 scripts/ai/automation_versions.py --check

if [ "$MODE" = "docs" ]; then
  :
elif have_cmd node; then
  run_optional "agent-cli tests" bash -lc 'cd .agent-cli && node --test test/*.mjs'
else
  skip_optional "agent-cli tests require node"
fi

if [ "$MODE" = "full" ]; then
  if have_cmd go; then
    run_optional "backend tests" bash -lc 'cd platform/backend && GOCACHE="${GOCACHE:-${TMPDIR:-/tmp}/core-agent-go-build}" go test ./...'
    run_optional "backend cmd builds" bash -lc 'cd platform/backend && GOCACHE="${GOCACHE:-${TMPDIR:-/tmp}/core-agent-go-build}" go build ./cmd/...'
  else
    skip_optional "backend checks require go"
  fi

  if have_cmd node && have_cmd pnpm && [ -d "$ROOT/platform/frontend/node_modules" ] && node_supports_frontend; then
    run_optional "frontend lint" bash -lc 'cd platform/frontend && pnpm lint'
    run_optional "frontend typecheck" bash -lc 'cd platform/frontend && pnpm typecheck'
    run_optional "frontend tests" bash -lc 'cd platform/frontend && pnpm test'
    run_optional "frontend build" bash -lc 'cd platform/frontend && pnpm build'
  else
    skip_optional "frontend checks require node >=22.12, pnpm, and existing platform/frontend/node_modules"
  fi
fi

if [ "$FAILED" -ne 0 ]; then
  printf '\nPreflight failed.\n' >&2
  exit 1
fi

if [ "$OPTIONAL_FAILED" -ne 0 ]; then
  printf '\nPreflight required checks passed, but optional checks failed. Report this in closeout.\n' >&2
  exit 2
fi

printf '\nPreflight passed (%s mode).\n' "$MODE"
