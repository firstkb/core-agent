# Repository Map

Status: compact active snapshot
Last compacted: 2026-05-01

## Top-Level Runtime

```text
AGENTS.md
README.md
.github/
  workflows/docs-memory-check.yml
.agents/
  skills/
    maestro/
    charlie/
    grant/
    mason/
    scout/
    lens/
    release/
    scribe/
    archivist/
.codex/
  agents/
  contracts/
  standards/
  templates/

artifacts/
platform/
maestro/
  docs/
  contracts/
  templates/
  artifact/
maestro/memory/
  durable/
    decisions/
```

## Codex-Native Runtime

- `.agents/skills/maestro`: owner-facing native-first solution architect and engineering partner.
- `.agents/skills/charlie`: grounded codebase and documentation research workflow.
- `.agents/skills/grant`: plan, brief, dependency, risk, and acceptance audit workflow.
- `.agents/skills/mason`: scoped implementation workflow.
- `.agents/skills/scout`: verification, checks, CI, browser, migration, and security evidence workflow.
- `.agents/skills/lens`: read-only diff, evidence, acceptance, and residual-risk review workflow.
- `.agents/skills/release`: gated release, deployment, promotion, and rollback evidence workflow.
- `.agents/skills/scribe`: durable closeout and evidence summary workflow.
- `.agents/skills/archivist`: semantic docs and durable memory audit workflow.
- retired runtime provenance: owner-managed outside the active repository; not active runtime.
- `.codex/contracts`: machine-readable contracts and schemas.
- `.codex/templates`: canonical templates for module brief, feature README, research attempt, handoff, and reviewer note.
- `.codex/standards`: repository, engineering, frontend, backend, infra, library, and security standards.
- `maestro/docs`, `maestro/contracts`, and `maestro/templates`: active Maestro native-first runtime contracts.
- `maestro/memory/durable/decisions-log.md`: compact durable-decision index.
- `maestro/memory/durable/decisions/`: route-specific full durable decision bodies.

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
- `platform/backend/modules/tenant/businesstree`: tenant Business Tree static
  module API and lazy tree node service.
- `platform/backend/modules/shared`: shared backend infrastructure modules.

## Frontend Runtime

- `platform/frontend/apps/platform-admin-web`: platform/backoffice app.
- `platform/frontend/apps/tenant-web`: tenant app.
- `platform/frontend/apps/tenant-web/src/features/static-modules`: tenant
  app-local static modules; first module is Business Tree.
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
- former legacy platform memory under `platform/docs/ai/**`; the path is deleted, so use `maestro/memory/durable/legacy-memory-import.md` and git history only when explicitly needed
- former closed run folders under `platform/docs/ai/runs/**`; use owner-managed external provenance or git history only if required
