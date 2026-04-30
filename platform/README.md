# Platform

`platform/` holds the product runtime surfaces for VSM (Virtual Safety
Manager) v1.0.0.

## Read order for product work

- `platform/AGENTS.md`
- `maestro/memory/START_HERE.md`
- `maestro/memory/index/read-routes.yaml`
- `maestro/memory/durable/current-state.md`
- the relevant local `AGENTS.md` file under `backend/` or `frontend/`
- `maestro/memory/index/memory-index.yaml` only when broader routing is needed

For cross-stack or multi-session work, invoke:

- `$atlas` (display name: `Atlas`)

## Current layout

```text
platform/
  AGENTS.md
  README.md
  CHANGELOG.md

  docs/
    archive/

  backend/
    AGENTS.md
    README.md
    docs/
    env/
    cmd/
    internal/
    modules/
    migrations/
    seeds/
    scripts/

  frontend/
    AGENTS.md
    README.md
    docs/
    apps/
    packages/
    scripts/
    tooling/
```

## Product decisions

- backend lives under `platform/backend` as a modular monolith with multiple runtimes
- frontend lives under `platform/frontend` as separate product applications plus shared packages
- shared durable project memory is maintained under `maestro/memory/durable/` and `maestro/memory/modules/`
- stable Atlas prompt contracts live under `maestro/memory/atlas/prompts/`
- workflow templates live under `maestro/memory/atlas/templates/`
- coordinated task run artifacts live under `maestro/memory/runs/`
- former `platform/docs/ai/` memory has been migrated into `maestro/memory` and deleted; it is historical provenance only
- archived one-off prompt artifacts live under `platform/docs/archive/`
- manual orchestration skill lives at `.agents/skills/atlas/`

## Frontend decisions

- admin surface is `platform-admin-web`
- tenant surface is `tenant-web`
- `tenant-pwa` remains deferred
- shared packages remain capability-based, not generic dumping grounds

## Docs

- AI memory start point: `maestro/memory/START_HERE.md`
- shared AI memory: `maestro/memory/README.md`
- canonical docs registry: `maestro/memory/durable/canonical-docs.md`
- prompt registry: `maestro/memory/atlas/prompts/README.md`
- template registry: `maestro/memory/atlas/templates/README.md`
- run-artifact guide: `maestro/memory/runs/README.md`
- legacy memory import audit: `maestro/memory/durable/legacy-memory-import.md`
- backend docs index: `platform/backend/docs/README.md`
- frontend docs index: `platform/frontend/docs/README.md`
