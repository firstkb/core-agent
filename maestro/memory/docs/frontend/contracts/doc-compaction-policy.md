# Frontend Docs Compaction Policy

Status: active local policy
Last compacted: 2026-04-25

This policy applies to `platform/frontend/docs/**`.

## Goal

Frontend docs should become a small source-doc set with clear roles:

- durable contracts,
- active module docs,
- guides/runbooks,
- reference/donor material,
- archive.

They should not remain a flat folder of mixed contracts, historical work plans, donor notes, and stale follow-ups.

## Active Doc Types

Keep active:

- app/package boundary contracts,
- auth/runtime bootstrap contracts,
- collection-table contract after stale extraction wording is removed,
- UI foundation and `ui-kit` boundary contracts,
- Platform Studio hot contracts,
- current guides that describe active runtime behavior.

Compact or archive:

- closed rollout plans,
- gap reviews after durable decisions are extracted,
- old handoffs after code and compact memory reflect the outcome,
- prompt artifacts,
- donor/reference docs,
- stale follow-up lists.

## Target Per Domain

For each mature frontend domain, aim for:

- `README.md`
- `contract.md`
- `state.md`
- `lessons.md`

For large domains, a small `doc-map.md` may remain.

## Conflict Resolution

Priority order:

1. Current code.
2. Root repo guidance and `maestro/memory`.
3. Current tracked contracts.
4. Working plans.
5. Donor/reference docs.
6. Prompt artifacts and archives.

If a tracked doc says a feature is not extracted but code and `maestro/memory` say it is extracted, code and compact memory win.

## Physical Reorg Gate

Do not physically move tracked frontend docs until:

- every source doc has a classification,
- known drift is recorded,
- old path references are mapped,
- owner approves the tracked docs migration plan.
