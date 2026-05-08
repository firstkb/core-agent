# Platform Studio Module

Status: active
Owner: frontend
Last audited: 2026-04-25
Canonical scope: Platform Studio module index and suite-level read path

This module doc is the tracked entrypoint for Platform Studio suite-level frontend work.
It keeps the suite boundary small and points to active tool docs without loading every Form Builder detail by default.

## Read Order

For Platform Studio suite questions, read:

1. `platform/frontend/docs/contracts/platform-studio.md`
2. this file
3. the exact tool doc needed for the task

Do not read the whole `platform/frontend/docs/platform-studio/**` tree by default.

## Tool Status

| Tool | Status | Ownership |
| --- | --- | --- |
| Form Builder | active | Model/View authoring, field/layout authoring, authoring save, additive runtime apply, runtime view preparation. |
| Navigation Builder | active V1 | App menu/navigation composition UI, root-only `Menu title` dividers, UI Lab-style runtime section headings with empty/consecutive/trailing title suppression, separate `App menu`/`Utility rail` editor tabs, `Element`/`Access` inspector with no V1 `Advanced` tab, type-aware Element sections, inline Access strategy/rule composer with three editable strategies plus root-only strategy for root users, paged/search table dialogs for users/companies/company types/job types, centered fixed-type add dialog with duplicate target guard for Form view/App page/Link target selection, Form Builder-style delete confirmation, `Show in app menu` toggle for containers and target entries, `Show in utility rail` toggle for rail items, eye-off inactive badges, Dashboard locked without lock badge and not selectable for editing, empty configs starting with only Dashboard and root add affordance, fixed add choices for `Menu title`, `Menu group`, `Form view`, `App page`, and `Link`, disabled future `App module` add choice, Form View labels derived from selected View titles, Form View/App Page/External Link targets, future inactive App Module containers with possible subitems, per-level drag ordering, container/root add controls, optional icon picker for every editable non-title app menu item with `None` and inspection-oriented icons, draft/Save UX, backend persistence, runtime sidebar/utility rail visibility projection for active saved entries, and direct backend guards for Form View, App Page, and Platform Studio targets. |
| Action Builder | planned | Authored events, view-triggered behavior, notifications, conditional changes, post-submit side effects. |
| PDF Builder | planned | PDF template configuration and generated document output. |
| Report Builder | planned | Report definitions and analytical/read-only reporting outputs. |

## Current Code Surfaces

Tenant app Platform Studio UI:

- `platform/frontend/apps/tenant-web/src/features/platform-studio`

Tenant app shell/placement context:

- `platform/frontend/docs/modules/tenant-web.md`

Shared non-UI contracts/helpers:

- `platform/frontend/packages/platform-studio-core`

Current active backend owner for Form Builder:

- `platform/backend/modules/tenant/platformstudioformbuilder`

## Active Suite Contract

- `platform/frontend/docs/contracts/platform-studio.md`

## Active Tool Docs

- `platform/frontend/docs/modules/platform-studio/form-builder.md`: active Form Builder authoring/runtime contract.
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`: active supporting Form Builder field/catalog/rules/view-settings contract.
- `platform/backend/docs/contracts/platform-studio-form-builder.md`: active backend Form Builder API/storage/runtime apply contract.
- `platform/backend/docs/modules/platform-studio/form-builder.md`: active backend Form Builder implementation map and read order.

## Form Builder Historical Inputs

Old pointer-only Form Builder contract slices were compacted into the active
module contract and deleted. Use git history only when auditing exact old text.

Field/catalog/rules/view-settings details now have a compact supporting tracked doc:

- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

Open old field/catalog detail docs only for exact payload audit.

Backend-owned Form Builder details now live in the backend contract and backend module map.
Old frontend backend-facing pointer docs and the old suite-level README pointer
were deleted after compaction.

## Planned Tool Docs

Until dedicated tracked docs exist, planned or UI-first tools are defined by the suite contract:

- Navigation Builder
- Action Builder
- PDF Builder
- Report Builder

Do not infer their implementation model from Form Builder internals.

## Out Of Scope

- full Form Builder field catalog
- backend Form Builder storage/API details
- donor/reference code
- prompt artifacts
- deep Navigation Builder implementation details outside the tracked suite contract
- Action Builder, PDF Builder, or Report Builder implementation details before owner approval
