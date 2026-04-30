# Platform Product Guidance

Scope: everything under `platform/`.

This file is the shared product-development instruction layer for VSM v1.0.0.
It sits between the repo-level `AGENTS.md` and the local `platform/backend/AGENTS.md` or `platform/frontend/AGENTS.md` files.

## Read order

Before doing product work, read in this order:

1. `platform/AGENTS.md`
2. `maestro/memory/START_HERE.md`
3. `maestro/memory/index/read-routes.yaml`
4. `maestro/memory/durable/current-state.md`
5. the relevant module pack under `maestro/memory/modules/**`
6. `maestro/memory/index/memory-index.yaml` only when broader routing is needed
7. `maestro/memory/durable/module-index.md` when module ownership is unclear
8. the local runtime file:
   - `platform/backend/AGENTS.md` for backend work
   - `platform/frontend/AGENTS.md` for frontend work
9. only then the implementation-specific docs in `platform/backend/docs/` or `platform/frontend/docs/`

## What this memory system is for

The platform is being built through fast chat-driven development.
The memory system exists so the active chat is not the only source of durable state.

Use the chat for execution.
Use `maestro/memory/` by role.
Use the local `AGENTS.md` files for lane-specific operating rules.
Do not use the former `platform/docs/ai/**` path for reads or writes; it has been deleted after migration. Use `maestro/memory/durable/legacy-memory-import.md`, compact archive summaries, and git history for old provenance.

## Local preflight

Use `scripts/ai/preflight.sh` as the lightweight local preflight before closing
non-trivial implementation work.

The script does not install dependencies and is not a required GitHub Actions
gate. Default mode runs docs/memory/env hygiene and quick agent-cli checks when
available. Use `scripts/ai/preflight.sh --full` only when a broader backend and
frontend sweep is needed.

For non-trivial platform closeout or PR text, use
`maestro/memory/atlas/templates/agent-evidence.md` as a compact evidence block.
Tiny local edits can use a concise prose closeout instead.

## Memory roles

Use `maestro/memory/` by role:

- durable memory:
  - `maestro/memory/durable/repo-map.md`
  - `maestro/memory/durable/platform-contract.md`
  - `maestro/memory/durable/current-state.md`
  - `maestro/memory/durable/decisions-log.md`
  - `maestro/memory/durable/module-index.md`
  - `maestro/memory/durable/canonical-docs.md`
- domain and lane memory:
  - `maestro/memory/modules/domains/**`
  - `maestro/memory/modules/frontend/**`
  - `maestro/memory/modules/backend/**`
- docs governance:
  - `maestro/memory/docs/**`
- prompt contracts:
  - `maestro/memory/atlas/prompts/*`
- operational templates:
  - `maestro/memory/atlas/templates/*`
- run artifacts:
  - `maestro/memory/runs/active/*`
  - `maestro/memory/runs/archive/*`
- automation metadata:
  - `maestro/memory/atlas/automation-manifest.json`
  - `maestro/memory/atlas/automation-changelog.md`
  - `.agents/skills/atlas/*`
  - `.agents/skills/scribe/*`
  - `scripts/ai/new-run.py`
  - `scripts/ai/new-run.sh`
  - `scripts/ai/automation_versions.py`
  - `scripts/ai/docs_memory_check.py`
- archive / historical context:
  - `maestro/memory/durable/legacy-memory-import.md`
  - `maestro/memory/runs/archive/legacy-platform-docs-ai-runs.md`
  - git history for the former `platform/docs/ai/**` payloads
  - `platform/docs/archive/*`

## Canonical durable memory surfaces

Shared durable memory lives here:

- `maestro/memory/durable/repo-map.md`
- `maestro/memory/durable/platform-contract.md`
- `maestro/memory/durable/current-state.md`
- `maestro/memory/durable/decisions-log.md`
- `maestro/memory/durable/module-index.md`
- `maestro/memory/durable/canonical-docs.md`
- `maestro/memory/modules/**`

## Operational scaffolds

These are workflow scaffolds, not canonical memory:

- `maestro/memory/atlas/prompts/*`
- `maestro/memory/atlas/templates/*`
- `maestro/memory/runs/active/*`
- `maestro/memory/runs/archive/*`
- `maestro/memory/atlas/automation-manifest.json`
- `maestro/memory/atlas/automation-changelog.md`
- `.agents/skills/atlas/*`
- `scripts/ai/new-run.py`
- `scripts/ai/new-run.sh`

## Atlas orchestration rule

During the current platform workflow, `Atlas` (`$atlas`) is the default first-touch assistant for new work under `platform/`. Route new platform tasks through Atlas unless you are intentionally bypassing it for an obviously tiny local edit.
Atlas owns:
- intake
- route selection
- decision on whether a run is required
- task-id selection when a run exists
- prompt selection
- chat topology
- scaffolder invocation when a run should be materialized
- reconciliation
- final shared-memory updates

Direct FE/BE lane use is still acceptable only as an intentional fast-path for obviously tiny local work.
If there is any doubt about routing, shared contract, memory updates, or task duration, start with Atlas.

## Control orchestration skill

For any cross-stack, shared-contract, package-boundary, auth/session, tenancy-sensitive, or multi-session task, explicitly invoke `Atlas` (`$atlas`).

Do not rely on implicit activation for this workflow.

The control skill:
- decides whether the task should be current-chat direct/no-run or run-backed
- selects the route and mode
- creates or updates `maestro/memory/runs/active/<task-id>/` when a run is needed
- writes `task.md`
- writes `frontend.md` and/or `backend.md` when lanes exist
- executes small direct no-run tasks in the current chat when implementation was requested
- returns ready-to-paste FE/BE launch prompts in the same response when run-backed lane chats are needed
- returns manual no-run handoff prompts only when the owner explicitly asks for a separate chat without a run
- writes the same launch prompts into the lane files when a run exists
- reconciles lane reports
- owns final shared-memory updates

Task-id format:
- `YYYY-MM-DD_<scope>_<short-kebab-purpose>`
- append `-02`, `-03`, ... only for same-day collisions
- reuse the same task-id across sessions while the objective stays the same

Run file roles:
- `task.md` = control contract
- `frontend.md` = FE packet snapshot + FE report
- `backend.md` = BE packet snapshot + BE report
- `final.md` = control closeout

Use these templates for coordinated work:
- `maestro/memory/atlas/templates/control-task.md`
- `maestro/memory/atlas/templates/lane-report.md`

Use the scaffolder only after Atlas has chosen:
- the task id
- the primary mode
- the active lanes

The scaffolder is mechanical only.
It creates the file skeletons and stamps versions from `maestro/memory/atlas/automation-manifest.json`.
It does not decide task intent or memory updates.

FE and BE lanes may propose memory deltas, but only Atlas finalizes updates to shared memory files.
Do not make the user ask a second time for lane prompts after Atlas has already chosen the route and prompt plan.
If Atlas chooses a separate FE/BE chat itself, it should normally create a run.
No-run separate-chat handoff must be explicit owner intent and labeled `MANUAL_HANDOFF_NO_RUN`.

## Ignore by default

Do not read these unless the task explicitly needs them:

- `platform/frontend/**/node_modules/**`
- `platform/frontend/**/dist/**`
- `platform/frontend/**/.turbo/**`
- `platform/frontend/docs/vendor/**`
- `platform/frontend/docs/platform-studio/old-code-reference/**`
- `platform/backend/docs/legacy/**`
- `platform/backend/migrations/postgres/archive/**`
- `platform/backend/bundle/tenant_schema_full.sql` unless the task is bundle or migration related
- `platform/backend/certs/**`
- deleted legacy AI memory path `platform/docs/ai/**`; use `maestro/memory` and git history instead
- `platform/docs/archive/**`

These are large, generated, donor, or historical surfaces and they slow down agent work.

## Product invariants

- The platform is a monorepo.
- The backend is a modular monolith with multiple runtimes, not early microservices.
- The frontend is split into separate product applications.
- Multi-tenant isolation is non-negotiable.
- Admin and tenant semantics must stay explicit.
- Auth and refresh behavior must stay aligned across backend and frontend.
- Shared contracts must not drift silently between frontend and backend.
- Same-site `/auth/v1/*` and `/api/v1/*` routing is the browser-facing baseline.
- New docs must use repo-relative paths, not machine-local absolute paths.
- `collection-table` and `admin-module-registry` must remain separate memory domains.

## Development workflow

Use this workflow for all non-trivial work:

1. Restate the task.
2. List the locked invariants.
3. State assumptions explicitly.
4. Propose the smallest safe plan.
5. Implement.
6. Self-review for architecture, tenancy, auth, and contract drift.
7. Update memory if the work changed durable state.

## When memory must be updated

Use `maestro/memory/agent-workflow.md` as the canonical maintenance matrix.

Update `maestro/memory/durable/current-state.md` when:

- a workstream meaningfully advances
- a gap is closed
- a new risk appears
- a runtime/app/package/module becomes active or retired

Update `maestro/memory/durable/decisions-log.md` when:

- a durable architecture or contract decision is made
- an older decision is superseded

Update the relevant module pack under `maestro/memory/modules/**` when:

- a cross-stack contract changes
- a module boundary changes
- a new integration seam becomes important

Update `maestro/memory/durable/canonical-docs.md` and docs maps under `maestro/memory/docs/**` when:

- a doc becomes canonical
- a plan/audit/handoff doc should be demoted to supporting or historical status
- a new domain gets its own doc cluster

Update `maestro/memory/atlas/automation-changelog.md` when:

- a prompt version changes
- the Atlas skill behavior contract changes
- a template structure changes materially
- the scaffolder behavior changes materially

Update tracked FE/BE docs when code changes the canonical contract itself.
Run `python3 scripts/ai/docs_memory_check.py --check` before committing docs or memory reorganizations.
The same docs/memory gate runs in `.github/workflows/docs-memory-check.yml` for relevant PRs and pushes.
If no memory update is needed, state that explicitly in the closeout.

## Long-task support

For long-running work, use these templates:

- `maestro/memory/atlas/templates/task-header.md`
- `maestro/memory/atlas/templates/state-snapshot.md`
- `maestro/memory/atlas/templates/handoff-packet.md`
- `maestro/memory/atlas/templates/chat-start.md`
- `maestro/memory/atlas/templates/chat-start-backend.md`
- `maestro/memory/atlas/templates/chat-start-frontend.md`
- `maestro/memory/atlas/templates/control-task.md`
- `maestro/memory/atlas/templates/lane-report.md`

Keep handoffs compact and factual.
Do not dump whole chat transcripts into durable memory.

## Run archive rule

Closed and superseded runs are historical execution artifacts.
Move them out of `maestro/memory/runs/active/` once they stop being part of active work.
Use `maestro/memory/runs/archive/` as the default archive target.

## High-risk changes

Require explicit confirmation before finalizing changes that affect:

- auth/session semantics
- tenant resolution or tenant isolation
- permissions or root/non-root rules
- migrations or bundle generation
- destructive data operations
- billing, export, or irreversible admin actions
- cross-app shared package boundaries

## Documentation rule

If code changes a shared contract and the docs are not updated, the task is not actually complete.
Use `Scribe` (`$scribe`) for periodic semantic docs/memory audits after large docs, memory, AGENTS, Atlas, or reference-code changes.
