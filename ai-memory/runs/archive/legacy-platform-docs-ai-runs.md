# Legacy Platform Docs AI Runs

Status: archive summary
Last triaged: 2026-04-25

This file summarizes legacy run artifacts under `platform/docs/ai/runs/**`.
It exists so agents do not need to open old run folders by default.

The old run payloads remain in place for provenance until the owner approves a
final deletion or archival move.

## Triage Rules

- `archive-summary`: durable outcome is already captured in current memory/docs; old payload is provenance only.
- `keep-provenance`: old payload may still contain useful unresolved implementation detail.
- `delete-after-owner-confirm`: payload appears low-value or incomplete, but deletion needs owner approval.

## Run Index

| Legacy run | Status in run | Triage | Durable outcome | Remaining value |
| --- | --- | --- | --- | --- |
| `2026-04-05_frontend_workspace-shell-collapsed-hover-preview` | reconciled | archive-summary | Shared `WorkspaceShell` desktop collapsed-rail hover preview landed behind an opt-in prop; no durable memory update was required. | Provenance for shell hover behavior and checks only. |
| `2026-04-06_cross-stack_employees-admin-users-list` | closed | archive-summary | Employees root-admin list rollout and second admin Collection Table consumer landed; current admin/control-plane and Collection Table memory covers the durable result. | Provenance for migration/check details and missing create/edit/non-root follow-ups. |
| `2026-04-06_module-collection-table_admin-tenant-shared-readiness` | closed | archive-summary | Research found frontend/backend Collection Table readiness gaps before broad tenant reuse; later Collection Table docs supersede the old readiness state. | Historical evidence for why generic table and Module Registry consumer behavior stay separated. |
| `2026-04-07_cross-stack_platform-studio-naming-contract-lock` | checkpointed | archive-summary | Platform Studio naming/taxonomy lock informed current suite docs and Form Builder contracts. | Provenance for old naming decisions only; current docs own the suite boundary. |
| `2026-04-08_research_form-builder-field-catalog-analysis` | closed | archive-summary | EXTDB/ezform/smartapp research informed Form Builder field catalog and supporting detail triage. | Source-provenance for field id decisions such as `202`, `2031`, `201`, and `90`. |
| `2026-04-13_cross-stack_form-builder-model-view-authoring-start` | closed | archive-summary | Model/view authoring endpoints, stable-key routing, first-view creation, and lock semantics informed current Form Builder contracts. | Provenance for authoring endpoint lineage and temporary `/draft` alias risk. |
| `2026-04-13_cross-stack_form-builder-three-schema-rollout-start` | completed | archive-summary | Three-schema rollout landed around model-owned `dataSchema + layoutBlueprint` and view-owned `uiSchema`; current Form Builder docs own the contract. | Provenance for rollout checks and local typecheck wrapper gap. |
| `2026-04-13_cross-stack_form-builder-three-schema-stabilization` | active/draft | keep-provenance | Backend strict `viewId` hardening was recorded, but frontend stabilization and final reconciliation were not closed in the run. | Keep until current code/docs confirm whether all stabilization findings are closed or moved to a new task. |
| `2026-04-16_cross-stack_admin-tenant-list-navigation` | draft | delete-after-owner-confirm | Draft scaffold only; no lane packets, no closeout, and no memory update. | Candidate for deletion after owner confirms tenant-list navigation is covered elsewhere or no longer needed. |
| `2026-04-16_cross-stack_collection-table-or-filter-groups` | closed | archive-summary | Repeated same-field `contains` filters now have implicit OR semantics while saved filters preserve the original `quickFilters` array. | Provenance for grouped token removal limitation and future boolean-builder backlog. |

## Hot Read Policy

Do not open `platform/docs/ai/runs/**` by default.

Read this summary first. Open a legacy run only when:

- reconstructing provenance for a specific landed decision,
- investigating an unresolved risk listed above,
- preparing final deletion of that run payload.

## Next Retirement Step

Before deleting old run folders:

1. Confirm `2026-04-13_cross-stack_form-builder-three-schema-stabilization` is either superseded by current Form Builder docs or migrated into a new active task.
2. Ask the owner whether `2026-04-16_cross-stack_admin-tenant-list-navigation` can be deleted as an empty draft scaffold.
3. Decide whether archive-summary runs should be physically moved to `ai-memory/runs/archive/legacy-platform-docs-ai-runs/` or deleted after this summary is accepted.
