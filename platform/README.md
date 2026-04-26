# Platform

`platform/` holds the product runtime surfaces for Ramp Platform v108.

## Read order for product work

- `platform/AGENTS.md`
- `ai-memory/START_HERE.md`
- `ai-memory/index/read-routes.yaml`
- `ai-memory/durable/current-state.md`
- the relevant local `AGENTS.md` file under `backend/` or `frontend/`
- `ai-memory/index/memory-index.yaml` only when broader routing is needed

For cross-stack or multi-session work, invoke:

- `$ramp-conductor` (display name: `Atlas`)

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
- shared durable project memory is maintained under `ai-memory/durable/` and `ai-memory/modules/`
- stable Atlas prompt contracts live under `ai-memory/atlas/prompts/`
- workflow templates live under `ai-memory/atlas/templates/`
- coordinated task run artifacts live under `ai-memory/runs/`
- former `platform/docs/ai/` memory has been migrated into `ai-memory` and deleted; it is historical provenance only
- archived one-off prompt artifacts live under `platform/docs/archive/`
- manual orchestration skill lives at `.agents/skills/ramp-conductor/`

## Frontend decisions

- admin surface is `platform-admin-web`
- tenant surface is `tenant-web`
- `tenant-pwa` remains deferred
- shared packages remain capability-based, not generic dumping grounds

## Docs

- AI memory start point: `ai-memory/START_HERE.md`
- shared AI memory: `ai-memory/README.md`
- canonical docs registry: `ai-memory/durable/canonical-docs.md`
- prompt registry: `ai-memory/atlas/prompts/README.md`
- template registry: `ai-memory/atlas/templates/README.md`
- run-artifact guide: `ai-memory/runs/README.md`
- legacy memory import audit: `ai-memory/durable/legacy-memory-import.md`
- backend docs index: `platform/backend/docs/README.md`
- frontend docs index: `platform/frontend/docs/README.md`
