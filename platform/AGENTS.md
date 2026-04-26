# Platform Product Guidance

Scope: everything under `platform/`.

This file is the shared product-development instruction layer for Ramp Platform v108.
It sits between the repo-level `AGENTS.md` and the local `platform/backend/AGENTS.md` or `platform/frontend/AGENTS.md` files.

## Read order

Before doing product work, read in this order:

1. `platform/AGENTS.md`
2. `ai-memory/START_HERE.md`
3. `ai-memory/index/read-routes.yaml`
4. `ai-memory/durable/current-state.md`
5. the relevant module pack under `ai-memory/modules/**`
6. `ai-memory/index/memory-index.yaml` only when broader routing is needed
7. `ai-memory/durable/module-index.md` when module ownership is unclear
8. the local runtime file:
   - `platform/backend/AGENTS.md` for backend work
   - `platform/frontend/AGENTS.md` for frontend work
9. only then the implementation-specific docs in `platform/backend/docs/` or `platform/frontend/docs/`

## What this memory system is for

The platform is being built through fast chat-driven development.
The memory system exists so the active chat is not the only source of durable state.

Use the chat for execution.
Use `ai-memory/` by role.
Use the local `AGENTS.md` files for lane-specific operating rules.
Do not use the former `platform/docs/ai/**` path for reads or writes; it has been deleted after migration. Use `ai-memory/durable/legacy-memory-import.md`, compact archive summaries, and git history for old provenance.

## Local preflight

Use `scripts/ai/preflight.sh` as the lightweight local preflight before closing
non-trivial implementation work.

The script does not install dependencies and is not a required GitHub Actions
gate. Default mode runs docs/memory/env hygiene and quick agent-cli checks when
available. Use `scripts/ai/preflight.sh --full` only when a broader backend and
frontend sweep is needed.

For non-trivial platform closeout or PR text, use
`ai-memory/atlas/templates/agent-evidence.md` as a compact evidence block.
Tiny local edits can use a concise prose closeout instead.

## Memory roles

Use `ai-memory/` by role:

- durable memory:
  - `ai-memory/durable/repo-map.md`
  - `ai-memory/durable/platform-contract.md`
  - `ai-memory/durable/current-state.md`
  - `ai-memory/durable/decisions-log.md`
  - `ai-memory/durable/module-index.md`
  - `ai-memory/durable/canonical-docs.md`
- domain and lane memory:
  - `ai-memory/modules/domains/**`
  - `ai-memory/modules/frontend/**`
  - `ai-memory/modules/backend/**`
- docs governance:
  - `ai-memory/docs/**`
- prompt contracts:
  - `ai-memory/atlas/prompts/*`
- operational templates:
  - `ai-memory/atlas/templates/*`
- run artifacts:
  - `ai-memory/runs/active/*`
  - `ai-memory/runs/archive/*`
- automation metadata:
  - `ai-memory/atlas/automation-manifest.json`
  - `ai-memory/atlas/automation-changelog.md`
  - `.agents/skills/ramp-conductor/*`
  - `.agents/skills/scribe/*`
  - `scripts/ai/new-run.py`
  - `scripts/ai/new-run.sh`
  - `scripts/ai/automation_versions.py`
  - `scripts/ai/docs_memory_check.py`
- archive / historical context:
  - `ai-memory/durable/legacy-memory-import.md`
  - `ai-memory/runs/archive/legacy-platform-docs-ai-runs.md`
  - git history for the former `platform/docs/ai/**` payloads
  - `platform/docs/archive/*`

## Canonical durable memory surfaces

Shared durable memory lives here:

- `ai-memory/durable/repo-map.md`
- `ai-memory/durable/platform-contract.md`
- `ai-memory/durable/current-state.md`
- `ai-memory/durable/decisions-log.md`
- `ai-memory/durable/module-index.md`
- `ai-memory/durable/canonical-docs.md`
- `ai-memory/modules/**`

## Operational scaffolds

These are workflow scaffolds, not canonical memory:

- `ai-memory/atlas/prompts/*`
- `ai-memory/atlas/templates/*`
- `ai-memory/runs/active/*`
- `ai-memory/runs/archive/*`
- `ai-memory/atlas/automation-manifest.json`
- `ai-memory/atlas/automation-changelog.md`
- `.agents/skills/ramp-conductor/*`
- `scripts/ai/new-run.py`
- `scripts/ai/new-run.sh`

## Atlas orchestration rule

During the current platform workflow, `Atlas` (`$ramp-conductor`) is the default first-touch assistant for new work under `platform/`. Route new platform tasks through Atlas unless you are intentionally bypassing it for an obviously tiny local edit.
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

For any cross-stack, shared-contract, package-boundary, auth/session, tenancy-sensitive, or multi-session task, explicitly invoke `Atlas` (`$ramp-conductor`).

Do not rely on implicit activation for this workflow.

The control skill:
- decides whether the task should be direct/no-run or run-backed
- selects the route and mode
- creates or updates `ai-memory/runs/active/<task-id>/` when a run is needed
- writes `task.md`
- writes `frontend.md` and/or `backend.md` when lanes exist
- returns ready-to-paste FE/BE launch prompts in the same response when new lane chats are needed
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
- `ai-memory/atlas/templates/control-task.md`
- `ai-memory/atlas/templates/lane-report.md`

Use the scaffolder only after Atlas has chosen:
- the task id
- the primary mode
- the active lanes

The scaffolder is mechanical only.
It creates the file skeletons and stamps versions from `ai-memory/atlas/automation-manifest.json`.
It does not decide task intent or memory updates.

FE and BE lanes may propose memory deltas, but only Atlas finalizes updates to shared memory files.
Do not make the user ask a second time for lane prompts after Atlas has already chosen the route and prompt plan.

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
- deleted legacy AI memory path `platform/docs/ai/**`; use `ai-memory` and git history instead
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

Use `ai-memory/agent-workflow.md` as the canonical maintenance matrix.

Update `ai-memory/durable/current-state.md` when:

- a workstream meaningfully advances
- a gap is closed
- a new risk appears
- a runtime/app/package/module becomes active or retired

Update `ai-memory/durable/decisions-log.md` when:

- a durable architecture or contract decision is made
- an older decision is superseded

Update the relevant module pack under `ai-memory/modules/**` when:

- a cross-stack contract changes
- a module boundary changes
- a new integration seam becomes important

Update `ai-memory/durable/canonical-docs.md` and docs maps under `ai-memory/docs/**` when:

- a doc becomes canonical
- a plan/audit/handoff doc should be demoted to supporting or historical status
- a new domain gets its own doc cluster

Update `ai-memory/atlas/automation-changelog.md` when:

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

- `ai-memory/atlas/templates/task-header.md`
- `ai-memory/atlas/templates/state-snapshot.md`
- `ai-memory/atlas/templates/handoff-packet.md`
- `ai-memory/atlas/templates/chat-start.md`
- `ai-memory/atlas/templates/chat-start-backend.md`
- `ai-memory/atlas/templates/chat-start-frontend.md`
- `ai-memory/atlas/templates/control-task.md`
- `ai-memory/atlas/templates/lane-report.md`

Keep handoffs compact and factual.
Do not dump whole chat transcripts into durable memory.

## Run archive rule

Closed and superseded runs are historical execution artifacts.
Move them out of `ai-memory/runs/active/` once they stop being part of active work.
Use `ai-memory/runs/archive/` as the default archive target.

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
