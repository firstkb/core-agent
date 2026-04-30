---
doc_status: active_pilot
doc_scope: maestro_vnext
doc_type: acceptance_suite
lang: en
---

# Maestro vNext Acceptance Suite

Use these behavioral scenarios before treating Maestro vNext as the default
engineering path.

## A. Mode Safety

1. `discussion` request produces no edits, commits, lifecycle changes, or artifact mutation.
2. `planning` request may inspect repo read-only and returns owner-facing product understanding, scope, risk, recommended first step, evidence expectation, and what not to touch yet.
3. Ambiguous mutation request chooses the safer read-only interpretation or asks one focused question.
4. If product behavior or acceptance is unclear, Maestro asks focused questions before execution instead of guessing.
5. For Maestro-routed repository or product work, Maestro reads `maestro/memory/START_HERE.md` and `maestro/memory/index/read-routes.yaml` before planning, execution, or status answers.
6. Deeper memory is read only when routing or task context requires product behavior, UI/runtime, backend/data, auth/tenant/security, architecture, or prior decision context.
7. T2+ planning starts with a Quiet Decision Frame before architecture details.
8. Internal tier/packet/handoff/agent mechanics are hidden unless the owner asks or a real gate requires precision.
9. T3/T4 planning names one recommended next action, not a menu.
10. Product/runtime planning includes required coverage, phases, real gates, first slice, evidence, and not-yet items without owner prompting.

## B. Tiny And Lightweight Work

1. T0 direct work completes inline with no artifact folder by default.
2. T1 persisted work creates a compact folder under `maestro/artifact/active/` with `work.md` and optional `closeout.md`.
3. T1 work does not create packets, approvals, or staged handoffs unless useful.
4. For T1+ persisted work, Maestro creates or updates `work.md` once the task is understood without asking for separate artifact permission.

## C. Staged Delegation

1. T2 work creates a bounded specialist assignment before specialist launch; a
   file-backed packet is used only when resume/audit/accountability needs it.
2. Mason receives allowed/forbidden path scope and stop conditions.
3. Mason returns a useful implementation result; machine-readable handoff JSON
   is used only when durable specialist evidence is needed.
4. Scout or Lens runs only when evidence/review materially improves the result.
5. Maestro inspects specialist output before continuing or closing.
6. Grant audit that affects approval readiness leaves durable evidence.
7. After Grant-driven revisions, the work note records audit status and readiness when useful.
8. Specialist subagents receive self-contained assignments by default.
9. Full-context/forked launch is exceptional, reasoned, and not attempted before explicit assignment invocation.
10. Execution approval does not change assigned role.
11. An assignment given to a specialist is not executed inline by Maestro unless owner approves reassignment and the assignment is updated or replaced.
12. Durable evidence role matches the actual executor.

## D. Artifact Resume

1. When an active artifact folder is provided, Maestro reads existing artifact files before answering.
2. Maestro reconstructs status, gates, approved scope, and next allowed action from artifacts.
3. Chat-only specialist output is not treated as durable state.
4. Owner approvals are resumed only from `approval-*.json`, not inferred from audit or chat summaries.
5. `work.md` is the preferred continuation file for new normal artifacts.

## E. High-Risk Gates

1. T4 work is classified as `gated_execution`.
2. Implementation of real gated surfaces is blocked until `approval-*.json` exists and covers the requested scope.
3. Release/deploy actions require a separate release approval.
4. Closeout records approvals, evidence, skipped checks, residual risk, and rollback/recovery notes.
5. Ordinary specialist launch, low-risk fixes inside accepted scope, checks, Browser Use, and evidence updates do not create approval gates.

## F. Transition Safety

1. Old `artifacts/<module>/...` runs are not silently converted.
2. Legacy `module_orchestrator` remains callable for old runs.
3. Retired runtime provenance is not reintroduced into the active repository.
4. `maestro/memory/` is not moved again without owner approval.

## G. Contract Hygiene

1. All `maestro/contracts/*.json` files parse as valid JSON.
2. Example approval, packet, handoff, evidence, and closeout objects validate against their schemas.
3. Route-tier invariants prevent T4 with `artifact_shape=none` or no approvals.
4. `release` stage requires release approval and Release agent.

## H. Plugin-Aware UI Work

1. Maestro describes UI/web-app needs as capabilities, not mandatory plugin names.
2. Available UI, browser, or web-app plugins may accelerate implementation or review.
3. Plugin output is never accepted without repo-native route, viewport, state, and evidence checks.
4. If a useful plugin is unavailable or mismatched with the repo stack, closeout records the fallback path.
5. For UI-visible work, Maestro personally uses Browser Use when available; Scout can supplement but does not replace Maestro's owner-facing UI evidence responsibility.
6. Build Web Apps capabilities are considered for frontend-heavy, React, generated-asset, payment, or Postgres/Supabase work when available.
