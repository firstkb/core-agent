---
doc_status: proposal
doc_scope: maestro_vnext
doc_type: product_root
lang: en
---

# Maestro

Maestro is the proposed orchestration product surface for the next generation
control plane.

This directory is a foundation surface, not a replacement for the current live
runtime yet. The current live Maestro contract remains under:

- `docs/maestro/module-orchestrator-v2-spec-pack/`
- `.codex/contracts/module_orchestrator/`
- `.codex/templates/module_orchestrator/`
- `.agents/skills/maestro/`

## Target Role

Maestro vNext is the owner-facing entrypoint for work ranging from tiny direct
changes to full module-sized initiatives.

The owner should be able to ask Maestro for work in natural task terms. Maestro
then decides:

- whether formal state is required;
- whether a run artifact tree is required;
- which stage chain is needed;
- which specialist agents should be used;
- which approval gates must be satisfied;
- which evidence is required before closeout.

Atlas remains an independent personal helper and does not become part of the
formal Maestro chain.

## Directory Layout

```text
maestro/
  AGENTS.md
  README.md
  docs/
    README.md
    operating-charter.md
    maestro-character.md
    orchestration-contract.md
    routing-tier-contract.md
    agent-contracts.md
    agent-sequences.md
    security-permissions-contract.md
    artifact-model.md
    artifact-file-contract.md
    stage-contract.md
    ui-cockpit-contract.md
    run-control-contract.md
    phase-1-implementation-brief.md
    agent-roles.md
    state-model.md
    db-model.md
    api-contract.md
    maestroctl-contract.md
  contracts/
    README.md
    orchestration-plan.schema.json
    task-packet.schema.json
    stage-handoff.schema.json
    evidence.schema.json
  cli/
    README.md
    package.json
    bin/maestroctl
    src/maestroctl.mjs
  env/
    dev.env.example
    local.env.example
  scripts/
    dev-local.mjs
    smoke-local.mjs
  frontend/
    package.json
    src/
  templates/
    task.md.tmpl
    stage-attempt.md.tmpl
    closeout.md.tmpl
```

Implementation directories:

```text
maestro/backend/
maestro/cli/
maestro/frontend/
maestro/artifacts/
```

`maestro/frontend/` uses React, TypeScript, Vite, and MUI Material for the
local Cockpit UI.

## Local Environment

Tracked example:

```text
maestro/env/dev.env.example
maestro/env/local.env.example
```

Ignored local files:

```text
maestro/env/*.env
maestro/.env
maestro/.env.*
```

Use `maestro_local` for daily Cockpit state and keep `maestro_smoke` as a
separate disposable database for smoke runs. The smoke runner refuses to touch
an existing Maestro schema unless `MAESTRO_SMOKE_RESET_DATABASE=true` is set in
the ignored local env.

## Local Dev Stack

```bash
node maestro/scripts/dev-local.mjs --env maestro/env/dev.env
```

The dev runner applies migrations, starts the Go API, starts the Vite/MUI
frontend, and stops both processes on `Ctrl+C`. Before starting, it frees the
configured API/frontend ports by stopping existing listeners. Use
`--no-kill-ports` when you want the command to fail instead of stopping another
local process.

## Local Smoke

```bash
node maestro/scripts/smoke-local.mjs --env maestro/env/local.env
```

The smoke runner starts the Go API, drives the first vertical flow through
`maestroctl`, writes API-owned artifacts, restarts the API, and verifies that
state persisted in PostgreSQL.

## Source Of Truth Boundary

Target boundary:

- Maestro API/DB is the live operational state owner.
- `maestro/artifacts/` stores portable snapshots, evidence, handoffs, and
  append-only run records.
- `.agent-cli` remains a local compatibility, validation, import, and export
  bridge while the current artifact model is migrated.
- `ai-memory/` remains durable compressed memory, not live task state.
