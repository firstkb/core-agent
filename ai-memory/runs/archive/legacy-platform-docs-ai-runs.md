# Legacy Platform Docs AI Runs

Status: final archive summary
Last updated: 2026-04-25

This file summarizes legacy run artifacts under `platform/docs/ai/runs/**`.
It exists so agents do not need to open old run folders by default.

The old raw run payloads were deleted from `platform/docs/ai/runs/**` after
this summary was accepted as the durable archive record.
Use git history if exact old run text is required.

## Triage Rules

- `summary-retained`: durable outcome is captured below and in current memory/docs.
- `deleted-after-summary`: old raw payload was removed after summary acceptance.
- `deleted-empty-draft`: old raw payload was removed as an incomplete draft scaffold.

## Run Index

| Legacy run | Status in run | Triage | Durable outcome | Remaining value |
| --- | --- | --- | --- | --- |
| `2026-04-05_frontend_workspace-shell-collapsed-hover-preview` | reconciled | deleted-after-summary | Shared `WorkspaceShell` desktop collapsed-rail hover preview landed behind an opt-in prop; no durable memory update was required. | Summary retained here; exact old payload only in git history. |
| `2026-04-06_cross-stack_employees-admin-users-list` | closed | deleted-after-summary | Employees root-admin list rollout and second admin Collection Table consumer landed; current admin/control-plane and Collection Table memory covers the durable result. | Summary retained here; exact old payload only in git history. |
| `2026-04-06_module-collection-table_admin-tenant-shared-readiness` | closed | deleted-after-summary | Research found frontend/backend Collection Table readiness gaps before broad tenant reuse; later Collection Table docs supersede the old readiness state. | Summary retained here; exact old payload only in git history. |
| `2026-04-07_cross-stack_platform-studio-naming-contract-lock` | checkpointed | deleted-after-summary | Platform Studio naming/taxonomy lock informed current suite docs and Form Builder contracts. | Summary retained here; exact old payload only in git history. |
| `2026-04-08_research_form-builder-field-catalog-analysis` | closed | deleted-after-summary | EXTDB/ezform/smartapp research informed Form Builder field catalog and supporting detail triage. | Summary retained here; exact old payload only in git history. |
| `2026-04-13_cross-stack_form-builder-model-view-authoring-start` | closed | deleted-after-summary | Model/view authoring endpoints, stable-key routing, first-view creation, and lock semantics informed current Form Builder contracts. | Summary retained here; exact old payload only in git history. |
| `2026-04-13_cross-stack_form-builder-three-schema-rollout-start` | completed | deleted-after-summary | Three-schema rollout landed around model-owned `dataSchema + layoutBlueprint` and view-owned `uiSchema`; current Form Builder docs own the contract. | Summary retained here; exact old payload only in git history. |
| `2026-04-13_cross-stack_form-builder-three-schema-stabilization` | active/draft with completed lane reports | deleted-after-summary | Backend and frontend stabilization lanes completed strict `viewId` identity, explicit `isDefault`, default/non-default view behavior, and three-schema route/hydration fixes; current Form Builder docs and memory own those facts. | Summary retained here; exact old payload only in git history. |
| `2026-04-16_cross-stack_admin-tenant-list-navigation` | draft | deleted-empty-draft | Draft scaffold only; no lane packets, no closeout, and no memory update. | Removed as low-value scaffold after owner approval. |
| `2026-04-16_cross-stack_collection-table-or-filter-groups` | closed | deleted-after-summary | Repeated same-field `contains` filters now have implicit OR semantics while saved filters preserve the original `quickFilters` array. | Summary retained here; exact old payload only in git history. |

## Hot Read Policy

Do not open `platform/docs/ai/runs/**` by default.

Read this summary first. Recover old run text from git history only when:

- reconstructing provenance for a specific landed decision,
- investigating a specific historical conflict,
- verifying the exact language of an old prompt or lane packet.

## Retirement Result

- Raw legacy run payloads are deleted.
- No legacy run remains active or marked for special provenance retention.
- New Atlas runs must use `ai-memory/runs/active/**`.
