# Ramp Platform v108 Memory System

Status: active
Bootstrapped from repository inspection and refined for coordinated FE/BE development.

This folder is the durable and operational memory layer for fast agent-assisted development inside `platform/`.

The goal is simple:

- keep one active chat fast
- keep project memory outside the chat
- preserve architecture, contracts, and current state across handoffs
- support a manual control-plane workflow without bloating hot context

## Atlas-default pilot rule

During the v1 pilot, `Atlas` (`$ramp-conductor`) is the default intake layer for new work under `platform/`. Start with Atlas unless you are intentionally bypassing it for an obviously tiny local edit.
Atlas decides:
- whether a run is required
- whether the task should stay in one direct lane or become coordinated work
- which prompt family is appropriate
- how many chats should be opened
- whether the scaffolder should materialize run files
- the ready-to-paste launch prompt for each new lane chat

Atlas may still decide that the best answer is a direct no-run frontend or backend lane.
The point is not to force heavy orchestration for everything.
The point is to centralize routing, memory awareness, and process decisions in one predictable place.

## Layered memory model

### Layer 1 — operating instructions

- `platform/AGENTS.md`
- `platform/backend/AGENTS.md`
- `platform/frontend/AGENTS.md`

These files tell the agent how to work.

### Layer 2 — shared durable memory

- `repo-map.md`
- `platform-contract.md`
- `current-state.md`
- `decisions-log.md`
- `module-index.md`
- `canonical-docs.md`
- `markdown-governance.md`

These files describe what the platform is, which docs are authoritative, and where the product stands now.

### Layer 3 — module memory

- `modules/auth-and-session.md`
- `modules/admin-control-plane.md`
- `modules/admin-module-registry.md`
- `modules/collection-table.md`
- `modules/platform-studio.md`
- `modules/schema-and-tenancy.md`

Read only the modules that matter for the task.

### Layer 4 — prompt contracts

- `prompts/README.md`
- `prompts/control-chat-prompt-v1.md`
- `prompts/frontend-prompt-v1.md`
- `prompts/backend-prompt-v1.md`
- compact lane prompts when you explicitly want a smaller bootstrap

These are stable base prompts.
They are operational contracts, not project truth.
Atlas generates routing decisions, lane packets, and ready-to-paste lane launch prompts on top of them.

### Layer 5 — templates

- `templates/README.md`
- `templates/task-header.md`
- `templates/state-snapshot.md`
- `templates/handoff-packet.md`
- `templates/chat-start.md`
- `templates/chat-start-backend.md`
- `templates/chat-start-frontend.md`
- `templates/control-task.md`
- `templates/lane-report.md`

Use these only when the current workflow step needs a structured artifact.
Templates define shape, not truth.

### Layer 6 — run artifacts

- `runs/README.md`
- `runs/<task-id>/task.md`
- `runs/<task-id>/frontend.md`
- `runs/<task-id>/backend.md`
- `runs/<task-id>/final.md`

These are execution artifacts for a concrete task.
They are not canonical memory.
Closed runs are historical context and should move out of `runs/` once they stop being active.

### Layer 7 — automation metadata

- `automation-manifest.json`
- `automation-changelog.md`
- `.agents/skills/ramp-conductor/*`
- `scripts/ai/new-run.py`
- `scripts/ai/new-run.sh`
- `scripts/ai/automation_versions.py`
- `orchestration-boundaries.md`

These files define the workflow contract, versioning, routing, and helper tooling.
The manifest is the authoritative editable version source for prompts, templates, skill, and scaffolder. Mirrored version fields in prompts, templates, and the skill file must stay in sync via `python3 scripts/ai/automation_versions.py --check` or `--write`.

## Confidence model

Use these labels mentally when reading durable memory:
- `code-confirmed` = directly supported by code, config, imports, or runnable tree structure
- `doc-confirmed` = supported by canonical current docs, but not directly re-verified in code in this snapshot
- `inferred` = strong synthesis, but still an interpretation
- `planned` = intended direction, not yet implemented

`current-state.md` now separates these classes more explicitly.

## Default read sets

### Atlas intake

Read:
1. `platform/AGENTS.md`
2. `current-state.md`
3. `canonical-docs.md`
4. relevant module docs
5. `orchestration-boundaries.md` only if orchestration scope is unclear

### For backend work

Read:
1. `platform/AGENTS.md`
2. `current-state.md`
3. `canonical-docs.md`
4. relevant module docs
5. `platform/backend/AGENTS.md`
6. `platform/backend/docs/README.md`

Open prompt contracts or templates only if the workflow step needs them.

### For frontend work

Read:
1. `platform/AGENTS.md`
2. `current-state.md`
3. `canonical-docs.md`
4. relevant module docs
5. `platform/frontend/AGENTS.md`
6. `platform/frontend/docs/README.md`

Open prompt contracts or templates only if the workflow step needs them.

### For cross-stack work

Start with:

- `platform-contract.md`
- `current-state.md`
- `canonical-docs.md`
- `modules/auth-and-session.md`
- `modules/admin-control-plane.md`
- `modules/admin-module-registry.md`
- `modules/collection-table.md`
- `modules/schema-and-tenancy.md`

Then invoke:

- `Atlas` (`$ramp-conductor`)

## Update policy

- update `current-state.md` after meaningful delivery progress
- append to `decisions-log.md` when a durable decision is made
- update a module file if the contract or boundary changed
- update `canonical-docs.md` or `markdown-governance.md` if doc authority or roles changed
- update `automation-changelog.md` only when a prompt, skill, template, or scaffolder behavior contract changes materially
- update `automation-manifest.json` when version values change
- do not store one-off prompt experiments as canonical memory
- do not treat templates or run artifacts as durable memory

## Fast rule

Use chat for execution.
Use this folder for memory and workflow scaffolding.
Use Atlas for routing and process decisions.
Use app/service docs only when the task needs their detail.
