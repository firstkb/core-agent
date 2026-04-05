# Markdown Governance

Status: active
Date: 2026-04-05

This file explains how markdown under `platform/` should be treated by agents and humans.

## Governance classes

### 1. Canonical durable memory

Canonical docs are the default durable source of truth for a domain.
They should be listed in:

- `platform/docs/ai/canonical-docs.md`
- `platform/backend/docs/README.md`
- `platform/frontend/docs/README.md`

Canonical docs should be stable, current, and referenced by other docs rather than duplicated.

### 2. Supporting docs

Supporting docs add implementation detail, runbook steps, or deeper explanation.
They are valid inputs, but they do not overrule the canonical contract for the domain.

### 3. Prompt contracts

Prompt contracts live under:

- `platform/docs/ai/prompts/*`

They are stable operational behavior contracts.
They are not project truth.
Task-specific customization should happen through packets, not by rewriting the base prompts every time.

### 4. Operational templates

Templates live under:

- `platform/docs/ai/templates/*`

Templates define output shape for transitions such as:

- new task intake
- state snapshot
- handoff
- control task contract
- lane report

Templates are not canonical memory.

### 5. Run artifacts

Run artifacts live under:

- `platform/docs/ai/runs/*`

These files record execution for one task.
They are useful for reconciliation, restart, and audit, but they are not the durable source of truth for the platform.
Closed runs are historical context.

### 6. Automation metadata

Automation metadata lives under:

- `platform/docs/ai/automation-manifest.json`
- `platform/docs/ai/automation-changelog.md`
- `.agents/skills/ramp-conductor/*`
- `scripts/ai/new-run.py`
- `scripts/ai/new-run.sh`
- `platform/docs/ai/orchestration-boundaries.md`

These files define workflow behavior, versioning, routing, or helper tooling.
They are operational scaffolding, not product truth.
The manifest is the live version source.
The changelog records behavioral changes over time.

### 7. Working / transitional docs

Working docs include:

- plans
- gap reviews
- handoffs
- follow-up lists
- refactor plans

These are allowed, but they must declare which docs remain canonical.
If a working doc stops being useful, archive it or mark it historical.

### 8. Archived / historical docs

Archived docs live under:

- `platform/docs/archive/**`
- legacy folders such as `platform/backend/docs/legacy/**`
- historical donor/reference folders such as `platform/frontend/docs/vendor/**`

They can be read when history matters, but they are never the default source of truth.

## Default agent rule

When entering a new task:

1. start with `Atlas` if routing is unclear or the task is not obviously tiny and local
2. read `platform/docs/ai/current-state.md`
3. read `platform/docs/ai/canonical-docs.md`
4. read the relevant module memory file
5. only then read supporting docs
6. open prompts, templates, runs, or automation files only if the workflow step actually needs them

## Required doc hygiene

New or updated docs must:

- use repo-relative links or relative local links
- avoid machine-local absolute paths
- avoid copying the same contract into multiple files
- state clearly if they are canonical, supporting, working, operational, or historical
- link back to the canonical doc when they are not the source of truth

## Current high-value canonical clusters

See `canonical-docs.md` for the authoritative list.
The current highest-value clusters are:

- shared platform memory in `platform/docs/ai/*`
- backend auth/session docs
- backend admin control-plane docs
- backend schema/tenancy docs
- frontend auth/runtime docs
- frontend collection-table runtime and package-boundary docs
- frontend admin module-registry proving-surface docs
- frontend UI foundation docs
- Platform Builder V2 docs

## Docs that are explicitly not canonical today

Examples that should not be treated as sole truth sources:

- `platform/backend/docs/GO_AGENT_RULES.md`
- `platform/backend/docs/ramp_v_108_backend_standard_v_2.md`
- `platform/backend/docs/backend-admin-module-registry-refactor-plan.md`
- `platform/backend/docs/backend-auth-cookie-migration-plan.md`
- `platform/backend/docs/backend-export-architecture-agent-prompt.md`
- `platform/frontend/docs/admin-module-registry-backend-handoff.md`
- `platform/frontend/docs/auth-runtime-followups.md`
- `platform/frontend/docs/collection-table-shared-readiness-plan.md`
- `platform/frontend/docs/foundation-rollout-plan.md`
- `platform/frontend/docs/phase-e-gap-review.md`
- `platform/frontend/docs/platform-builder-v2/agent-prompts.md`
- `platform/frontend/docs/platform-builder-v2/promt-continue.md`
- `platform/frontend/docs/platform-builder-v2/promt-continue-short.md`
- `platform/docs/archive/agent-prompts/**`
- any closed run under `platform/docs/ai/runs/**`
- anything under `platform/docs/archive/runs/**`

## Archive policy

Move a doc to archive when it is mainly:

- a one-off prompt
- a finished handoff
- a superseded planning artifact
- a donor/reference note that should not appear in default read sets
- a closed run that no longer needs to stay hot in `runs/`

Closed and superseded runs should leave `platform/docs/ai/runs/` once they stop being part of active work.
Recommended timing is after roughly 14 days without meaningful updates, or earlier when `runs/` becomes noisy.
Archive destination for runs:
- `platform/docs/archive/runs/`

When archiving, leave a short pointer stub only if the original location is still likely to be referenced by habit.


## Automation version mirrors

`platform/docs/ai/automation-manifest.json` is the authoritative editable source for workflow asset versions.
Version fields inside prompts, templates, and the Atlas skill file are readable mirrors and must be synchronized with `python3 scripts/ai/automation_versions.py --write` and validated with `--check`.
