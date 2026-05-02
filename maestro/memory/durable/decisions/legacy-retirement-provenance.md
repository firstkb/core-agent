# Legacy Retirement Provenance Decisions

Status: durable decision topic
Last compacted: 2026-05-01
Index: `maestro/memory/durable/decisions-log.md`

## Purpose

Superseded, historical, and provenance-heavy decisions kept for recovery without making them hot-read defaults.

## Rules

- Decision IDs are stable and must not be renumbered.
- Preserve deleted-path sources as provenance when they explain history.
- Prefer current canonical docs or compact memory routes for active reads.
- DEC-088 is the current active retired-runtime boundary. Older
  retired-runtime decisions are historical or superseded provenance only; they
  must not route new work to `maestro/memory/runs/**`,
  `maestro/memory/retired-runtime/**`, or `platform/docs/ai/**`.
- Add new decisions through `maestro/memory/durable/decisions-log.md` first, then place details in the relevant topic file.

## Decisions

### DEC-001 Platform Stays Monorepo And Modular Monolith

- Date: 2026-03-29
- Status: superseded
- State: superseded by DEC-063 final physical deletion
- Decision: Keep one monorepo and keep backend as a modular monolith with multiple runtime entrypoints. Do not split into early microservices.
- Rationale: Current platform boundaries need shared tenant/auth/schema contracts and fast cross-stack iteration.
- Sources:
  - `platform/docs/ai/platform-contract.md`
  - `platform/docs/ai/repo-map.md`

### DEC-002 Frontend Is Split By Product Surface

- Date: 2026-03-29
- Status: superseded
- State: superseded by DEC-063 final physical deletion
- Decision: Keep `platform-admin-web` and `tenant-web` as separate apps. Do not collapse them into one route-only app.
- Sources:
  - `platform/docs/ai/platform-contract.md`
  - `platform/frontend/docs/app-surfaces.md`

### DEC-003 Migrations Belong To `cmd/migrate`

- Date: 2026-03-29
- Status: superseded
- State: superseded by DEC-063 final physical deletion
- Decision: API runtimes must not run schema migrations during startup.
- Sources:
  - `platform/docs/ai/modules/schema-and-tenancy.md`
  - `platform/backend/docs/contracts/migrations.md`

### DEC-025 Physical Docs Migration Requires Explicit Source-To-Target Mapping

- Date: 2026-04-25
- Status: historical
- State: superseded
- Decision: During the FE/BE docs rewrite, physical doc moves required an explicit source-to-target map. The migration is complete, and the old migration snapshot was removed from the working tree; use active doc maps for current routing and git history only for exact migration ledger text.
- Sources:
  - `maestro/memory/docs/target-docs-structure.md`
  - git history

### DEC-055 retired runtime Workflow Uses Ai-Memory Operational Layer

- Date: 2026-04-25
- Status: superseded
- State: superseded by DEC-088 final retired-runtime provenance removal
- Decision: retired runtime now uses `maestro/memory` as the first retrieval layer, active prompt/template/version metadata under `maestro/memory/retired-runtime`, and run artifacts under `maestro/memory/runs/active`. Old `platform/docs/ai/**` is legacy provenance only until final retirement.
- Sources:
  - `platform/AGENTS.md`
  - `platform/backend/AGENTS.md`
  - `platform/frontend/AGENTS.md`
  - `.agents/skills/retired-runtime/SKILL.md`
  - `maestro/memory/retired-runtime/README.md`
  - `maestro/memory/retired-runtime/migration-audit.md`
  - `scripts/ai/new-run.py`
  - `scripts/ai/automation_versions.py`

### DEC-056 Docs Ref And Legacy Platform AI Use Archive/Retirement Boundaries

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: `maestro/memory/reference-code/README.md` is the stable opt-in reference-code registry. The former root docs archive and `platform/docs/ai/**` layer have moved through retirement into final physical deletion; provenance is now `maestro/memory/durable/legacy-memory-import.md`, compact summaries, and git history.
- Sources:
  - `maestro/memory/reference-code/README.md`
  - `git history`
  - `platform/docs/ai/templates/README.md`
  - `platform/docs/ai/runs/README.md`
  - `maestro/memory/retired-runtime/platform-docs-ai-retirement-plan.md`

### DEC-057 Legacy Platform AI Runs Are Provenance Only

- Date: 2026-04-25
- Status: superseded
- State: superseded by DEC-062 run payload deletion and DEC-063 final pointer deletion
- Decision: Retired runtime runs under `platform/docs/ai/runs/**` are no longer active task state. They are summarized in `maestro/memory/runs/archive/legacy-platform-docs-ai-runs.md`; the old run folders and pointer directory were later deleted after owner approval.
- Sources:
  - `maestro/memory/runs/archive/legacy-platform-docs-ai-runs.md`
  - `maestro/memory/retired-runtime/legacy-runs-triage.md`
  - `platform/docs/ai/runs/README.md`
  - `maestro/memory/retired-runtime/platform-docs-ai-retirement-plan.md`

### DEC-058 Legacy Top-Level AI Memory Files Are Pointers

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Top-level durable, governance, and changelog markdown files under `platform/docs/ai/*.md` are no longer payload-bearing memory. They were pointer-only before deletion; new memory updates must go to `maestro/memory` or the tracked doc owner, not to `platform/docs/ai/*.md`.
- Sources:
  - `platform/docs/ai/current-state.md`
  - `platform/docs/ai/platform-contract.md`
  - `platform/docs/ai/decisions-log.md`
  - `platform/docs/ai/canonical-docs.md`
  - `platform/docs/ai/module-index.md`
  - `platform/docs/ai/repo-map.md`
  - `platform/docs/ai/markdown-governance.md`
  - `platform/docs/ai/orchestration-boundaries.md`
  - `platform/docs/ai/automation-changelog.md`
  - `maestro/memory/retired-runtime/platform-docs-ai-retirement-plan.md`

### DEC-059 Legacy Module AI Memory Files Are Pointers

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Legacy module memory files under `platform/docs/ai/modules/*.md` are no longer payload-bearing module memory. They were pointer-only before deletion; new module memory updates must go to `maestro/memory/modules/**` or the tracked doc owner, not to `platform/docs/ai/modules/*.md`.
- Sources:
  - `platform/docs/ai/modules/README.md`
  - `platform/docs/ai/modules/auth-and-session.md`
  - `platform/docs/ai/modules/schema-and-tenancy.md`
  - `platform/docs/ai/modules/admin-control-plane.md`
  - `platform/docs/ai/modules/admin-module-registry.md`
  - `platform/docs/ai/modules/collection-table.md`
  - `platform/docs/ai/modules/collection-table-and-registry.md`
  - `platform/docs/ai/modules/platform-studio.md`
  - `maestro/memory/durable/module-index.md`
  - `maestro/memory/retired-runtime/platform-docs-ai-retirement-plan.md`

### DEC-060 Retired runtime Operational Payloads Are Pointers

- Date: 2026-04-25
- Status: superseded
- State: superseded by DEC-088 native Maestro runtime
- Decision: Historical: retired runtime prompt/template files under `platform/docs/ai/prompts/**` and `platform/docs/ai/templates/**`, plus `platform/docs/ai/automation-manifest.json`, were pointer-only before deletion. Active vNext prompt, skill, contract, and template edits now use `.agents/skills/**`, `.codex/**`, `AGENTS.md`, `maestro/docs/**`, `maestro/contracts/**`, and `maestro/templates/**`; old retired-runtime payload text is git-history only.
- Sources:
  - git history for former `platform/docs/ai/prompts/**`
  - git history for former `platform/docs/ai/templates/**`
  - git history for former `platform/docs/ai/automation-manifest.json`
  - git history for former `maestro/memory/retired-runtime/**`
  - `AGENTS.md`
  - `maestro/docs/runtime-contract.md`

### DEC-061 Platform Docs AI Physical Deletion Is Owner-Gated

- Date: 2026-04-25
- Status: superseded
- State: superseded by DEC-062 for run payload cleanup and DEC-063 for final pointer-directory deletion
- Decision: `platform/docs/ai/**` had passed hot-read retirement but was not ready for physical deletion until the owner approved legacy run payload cleanup. Non-run files were pointer stubs only. Remaining run payload disposition was unresolved at this decision point and is now closed by DEC-062.
- Sources:
  - `maestro/memory/retired-runtime/platform-docs-ai-retirement-readiness.md`
  - `maestro/memory/runs/archive/legacy-platform-docs-ai-runs.md`
  - `maestro/memory/retired-runtime/legacy-runs-triage.md`
  - `maestro/memory/retired-runtime/platform-docs-ai-retirement-plan.md`

### DEC-062 Legacy Run Payloads Deleted After Summary Acceptance

- Date: 2026-04-25
- Status: superseded
- State: superseded by DEC-088 final retired-runtime provenance removal
- Decision: Historical: raw retired runtime run payloads under `platform/docs/ai/runs/**` were deleted after owner approval. The former local run summary path is no longer active; retired run provenance is owner-managed outside the active repository or recoverable through git history. Exact old run text is git-history only.
- Sources:
  - git history for former `maestro/memory/runs/archive/legacy-platform-docs-ai-runs.md`
  - git history for former `maestro/memory/retired-runtime/legacy-runs-triage.md`
  - git history for former `platform/docs/ai/runs/README.md`
  - git history for former `maestro/memory/retired-runtime/platform-docs-ai-retirement-readiness.md`
  - `AGENTS.md`
  - `maestro/docs/runtime-contract.md`

### DEC-063 Platform Docs AI Directory Physically Deleted

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: The remaining `platform/docs/ai/**` compatibility pointer files were deleted after active reference checks. Active memory and retired runtime workflow must use `maestro/memory/**`, current AGENTS files, tracked FE/BE docs, and scripts. Exact old `platform/docs/ai/**` payload text is available only through git history; do not recreate the deleted path.
- Sources:
  - `maestro/memory/retired-runtime/platform-docs-ai-retirement-readiness.md`
  - `maestro/memory/retired-runtime/platform-docs-ai-retirement-plan.md`
  - `maestro/memory/durable/legacy-memory-import.md`
  - `AGENTS.md`
  - `platform/AGENTS.md`

### DEC-064 Compacted Pointer Files Deleted

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: `maestro/memory/AGENTS.override.md` and pointer-only FE/BE docs carrying compacted-pointer headers, moved-pointer headers, or no-longer-active auth follow-up wording were deleted after active references were updated. Active docs/maps now route directly to canonical contracts/modules. Exact old pointer text is available only through git history.
- Sources:
  - `platform/frontend/docs/README.md`
  - `platform/backend/docs/README.md`
  - `maestro/memory/docs/frontend/doc-map.md`
  - `maestro/memory/docs/backend/doc-map.md`
  - git history

### DEC-078 Direct No-Run Means Current-Chat Execution

- Date: 2026-04-26
- Status: superseded
- State: superseded by DEC-088 native Maestro artifact model
- Decision: retired runtime direct no-run routes mean current-chat execution by default. If retired runtime decides a separate FE/BE chat should be opened, the task should normally become run-backed with a task id and `maestro/memory/runs/active/<task-id>/` artifacts. A separate no-run prompt is allowed only when the owner explicitly requests `MANUAL_HANDOFF_NO_RUN`; that handoff is owner-managed and not retired runtime lane orchestration.
- Sources:
  - `.agents/skills/retired-runtime/SKILL.md`
  - `maestro/memory/retired-runtime/prompts/control-chat-prompt-v1.md`
  - `platform/AGENTS.md`

### DEC-086 Active Runs Must Have Explicit Closure

- Date: 2026-04-28
- Status: superseded
- State: superseded by DEC-088 native Maestro artifact model
- Decision: `maestro/memory/runs/active/` must stay small and operational. Completed, closeout-ready, or review-ready runs move to `maestro/memory/runs/archive/<task-id>/`. A run may remain in `active/` with a `final.md` only when `final.md` explicitly declares `Status: awaiting-owner-review`, `Next owner action:`, and `Last updated:`. `scripts/ai/docs_memory_check.py --check` enforces this rule.
- Sources:
  - `maestro/memory/runs/README.md`
  - `scripts/ai/docs_memory_check.py`
  - `maestro/memory/runs/archive/2026-04-27_frontend_collection-table-page-decomposition/`
  - `maestro/memory/runs/archive/2026-04-27_frontend_ui-kit-styles-decomposition/`
  - `maestro/memory/runs/archive/2026-04-27_frontend_ui-lab-form-controls-decomposition/`

### DEC-088 Retired Runtime Provenance Removed From Active Tree

- Date: 2026-04-30
- Status: active
- State: landed
- Decision: Retired runtime provenance is owner-managed outside the active repository. New owner-led engineering work routes through Maestro and the native vNext skills. Durable memory remains under `maestro/memory/`; active task state uses `maestro/artifact/active/` and `maestro/artifact/archive/`, not `maestro/memory/runs/**`. Retired run packets, prompts, templates, manifest, and scaffolder scripts are retained only outside the active repository or in git history.
- Sources:
  - `AGENTS.md`
  - `maestro/docs/runtime-contract.md`
  - `maestro/docs/memory-migration-plan.md`
  - `maestro/memory/START_HERE.md`
  - `scripts/ai/docs_memory_check.py`
