# Repository Map

Status: compact active snapshot
Last compacted: 2026-04-25

## Top-Level Runtime

```text
AGENTS.md
README.md
docs/
  codex-native-repo.md
  maestro/module-orchestrator-v2-spec-pack/
  ref/reference-code.md
.github/
  workflows/docs-memory-check.yml
.agents/
  skills/
    scribe/
.codex/
  agents/
  contracts/
  standards/
  templates/
.agent-cli/
artifacts/
platform/
ai-memory/
```

## Codex-Native Runtime

- `.agents/skills/maestro`: owner-facing module orchestration workflow.
- `.agents/skills/charlie`: grounded codebase research workflow.
- `.agents/skills/grant`: optional technical brief review workflow.
- `.agents/skills/scribe`: manual semantic docs and ai-memory audit workflow.
- `.agents/skills/atlas`: product-level Atlas workflow for platform FE/BE orchestration; useful as product memory context but not the root Codex-native runtime.
- `.codex/contracts`: machine-readable contracts and schemas.
- `.codex/templates`: canonical templates for module brief, feature README, research attempt, handoff, and reviewer note.
- `.codex/standards`: repository, engineering, frontend, backend, infra, library, and security standards.
- `.agent-cli`: typed lifecycle gateway. Do not hand-edit CLI-owned JSON state.

## Product Runtime

```text
platform/
  AGENTS.md
  README.md
  docs/
    archive/
  backend/
    AGENTS.md
    docs/
    cmd/
    modules/
    internal/
    migrations/
    bundle/
    seeds/
  frontend/
    AGENTS.md
    docs/
    apps/
    packages/
    tooling/
```

## Backend Runtime

- `platform/backend/cmd/api-admin`: admin control-plane API.
- `platform/backend/cmd/api-tenant`: tenant-scoped application API.
- `platform/backend/cmd/auth`: OTP auth, refresh/logout, JWKS.
- `platform/backend/cmd/migrate`: master and tenant migration runtime.
- `platform/backend/modules/admin`: admin control-plane modules.
- `platform/backend/modules/tenant`: tenant-facing modules.
- `platform/backend/modules/shared`: shared backend infrastructure modules.

## Frontend Runtime

- `platform/frontend/apps/platform-admin-web`: platform/backoffice app.
- `platform/frontend/apps/tenant-web`: tenant app.
- `platform/frontend/packages/collection-table`: reusable collection table runtime/package.
- `platform/frontend/packages/platform-studio-core`: UI-free Platform Studio contracts/helpers.
- `platform/frontend/packages/auth-core`: auth state and recovery model.
- `platform/frontend/packages/api-client`: shared transport client.
- `platform/frontend/packages/ui-kit`: stable shared UI primitives.

## High-Noise Surfaces

Avoid unless the task explicitly needs them:

- `platform/frontend/docs/vendor/**`
- `reference-code/**`
- `platform/backend/docs/archive/**`
- `platform/backend/docs/legacy/**`
- `platform/backend/migrations/postgres/archive/**`
- `platform/docs/archive/**`
- former legacy platform memory under `platform/docs/ai/**`; the path is deleted, so use `ai-memory/durable/legacy-memory-import.md` and git history only when explicitly needed
- former closed run folders under `platform/docs/ai/runs/**`; read `ai-memory/runs/archive/legacy-platform-docs-ai-runs.md` first and recover exact old text from git history only if required
