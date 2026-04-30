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
gate. Default mode runs docs/memory/env hygiene. Use
`scripts/ai/preflight.sh --full` only when a broader backend and frontend sweep
is needed.

For non-trivial platform closeout or PR text, use
`maestro/templates/evidence.md.tmpl` as the compact evidence shape. Tiny local
edits can use a concise prose closeout instead.

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
- reference-code routing:
  - `maestro/memory/reference-code/**`
- archive / historical context:
  - `maestro/memory/durable/legacy-memory-import.md`
  - owner-managed external retired runtime provenance
  - git history for the former `platform/docs/ai/**` payloads
  - `platform/docs/archive/*`

## Maestro orchestration rule

For new platform work, use Maestro when the task is ambiguous, cross-stack,
multi-session, high-risk, or likely to need durable evidence. Maestro chooses
the smallest useful route:

- `T0_inline` for tiny current-chat work;
- `T1_task` for lightweight persisted work;
- `T2_staged` when evidence or stage handoff matters;
- `T3_multi_step` for one owner goal with several linear steps;
- `T4_gated` for approvals, auth, tenancy, migrations, release, or destructive work.

Direct FE/BE lane work is acceptable for obviously local changes. If routing,
shared contract, memory impact, or task duration is unclear, start with Maestro.

Maestro work artifacts live under:

- `maestro/artifact/active/YYYY-MM-DD-<work-slug>/`
- `maestro/artifact/archive/YYYY-MM-DD-<work-slug>/`

Use `maestro/templates/**` for intent, plan, packet, handoff, evidence, review,
release, and closeout records when persisted artifacts are useful.

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

Update Maestro docs/templates when:

- the Maestro skill behavior contract changes
- a Maestro template structure changes materially
- the native artifact model changes
- a route tier or approval gate changes

Update tracked FE/BE docs when code changes the canonical contract itself.
Run `python3 scripts/ai/docs_memory_check.py --check` before committing docs or memory reorganizations.
The same docs/memory gate runs in `.github/workflows/docs-memory-check.yml` for relevant PRs and pushes.
If no memory update is needed, state that explicitly in the closeout.

## Long-task support

For long-running work, keep the active record under `maestro/artifact/active/`
and use the smallest useful set of `maestro/templates/**`. Keep handoffs compact
and factual. Do not dump whole chat transcripts into durable memory.

## Artifact archive rule

Closed, cancelled, superseded, or frozen Maestro records move from
`maestro/artifact/active/` to `maestro/artifact/archive/`. Legacy run packets
are owner-managed outside the active repository and are not active memory.

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
Use `Archivist` (`$archivist`) for periodic semantic docs/memory audits after
large docs, memory, AGENTS, Maestro, or reference-code changes.
