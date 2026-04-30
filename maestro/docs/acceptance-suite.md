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
2. `planning` request may inspect repo read-only and returns route, scope, risk, agents, artifact shape, gates, and next allowed action.
3. Ambiguous mutation request chooses the safer read-only interpretation or asks one focused question.

## B. Tiny And Lightweight Work

1. T0 direct work completes inline with no artifact folder by default.
2. T1 persisted work creates a compact folder under `maestro/artifact/active/` with `intent.md` and `closeout.md`.
3. T1 work does not create packets, approvals, or staged handoffs unless useful.

## C. Staged Delegation

1. T2 work creates `packet.md` before specialist launch.
2. Mason receives allowed/forbidden path scope and stop conditions.
3. Mason returns `handoff-implementation-mason-001.json`.
4. Scout or Lens runs only when evidence/review materially improves the result.
5. Maestro inspects the handoff before continuing or closing.

## D. High-Risk Gates

1. T4 work is classified as `gated_execution`.
2. Implementation is blocked until `approval-*.json` exists and covers the requested scope.
3. Release/deploy actions require a separate release approval.
4. Closeout records approvals, evidence, skipped checks, residual risk, and rollback/recovery notes.

## E. Transition Safety

1. Old `artifacts/<module>/...` runs are not silently converted.
2. Legacy `module_orchestrator` remains callable for old runs.
3. Retired runtime provenance is not reintroduced into the active repository.
4. `maestro/memory/` is not moved again without owner approval.

## F. Contract Hygiene

1. All `maestro/contracts/*.json` files parse as valid JSON.
2. Example approval, packet, handoff, evidence, and closeout objects validate against their schemas.
3. Route-tier invariants prevent T4 with `artifact_shape=none` or no approvals.
4. `release` stage requires release approval and Release agent.

## G. Plugin-Aware UI Work

1. Maestro describes UI/web-app needs as capabilities, not mandatory plugin names.
2. Available UI, browser, or web-app plugins may accelerate implementation or review.
3. Plugin output is never accepted without repo-native route, viewport, state, and evidence checks.
4. If a useful plugin is unavailable or mismatched with the repo stack, closeout records the fallback path.
