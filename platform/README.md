# Platform

`platform/` holds the product runtime surfaces for Ramp Platform v108.

## Read order for product work

- `platform/AGENTS.md`
- `platform/docs/ai/README.md`
- `platform/docs/ai/current-state.md`
- `platform/docs/ai/canonical-docs.md`
- the relevant local `AGENTS.md` file under `backend/` or `frontend/`

For cross-stack or multi-session work, invoke:

- `$ramp-conductor` (display name: `Atlas`)

## Current layout

```text
platform/
  AGENTS.md
  README.md
  CHANGELOG.md

  docs/
    ai/
      prompts/
      templates/
      runs/
      modules/
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
- shared durable project memory is maintained under `platform/docs/ai/`
- stable prompt contracts live under `platform/docs/ai/prompts/`
- workflow templates live under `platform/docs/ai/templates/`
- coordinated task run artifacts live under `platform/docs/ai/runs/`
- archived one-off prompt artifacts live under `platform/docs/archive/`
- manual orchestration skill lives at `.agents/skills/ramp-conductor/`

## Frontend decisions

- admin surface is `platform-admin-web`
- tenant surface is `tenant-web`
- `tenant-pwa` remains deferred
- shared packages remain capability-based, not generic dumping grounds

## Docs

- shared AI memory: `platform/docs/ai/README.md`
- canonical docs registry: `platform/docs/ai/canonical-docs.md`
- prompt registry: `platform/docs/ai/prompts/README.md`
- template registry: `platform/docs/ai/templates/README.md`
- run-artifact guide: `platform/docs/ai/runs/README.md`
- backend docs index: `platform/backend/docs/README.md`
- frontend docs index: `platform/frontend/docs/README.md`
