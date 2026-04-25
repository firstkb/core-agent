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
| Navigation Builder | planned | Sidebar/navigation composition, module assembly from views, runtime exposure, likely access assignment unless split later. |
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

## Form Builder Compatibility Pointers

The old Form Builder source docs below have been compacted into the active module contract.
Use them only when auditing historical detail:

- `platform/frontend/docs/platform-studio/form-builder-first-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-three-schema-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-runtime-naming-contract-v1-1.md`
- `platform/frontend/docs/platform-studio/form-builder-runtime-view-strategy-v1.md`
- `platform/frontend/docs/platform-studio/form-builder-runtime-routes-contract-v1.md`
- `platform/frontend/docs/platform-studio/form-builder-runtime-access-and-entry-context-v1.md`
- `platform/frontend/docs/platform-studio/form-builder-package-boundary-plan-v1.md`
- `platform/frontend/docs/platform-studio/form-builder-static-models-schema-contract-v1.md`
- `platform/frontend/docs/platform-studio/form-builder-import-bundle-contract-v1.md`

Field/catalog/rules/view-settings details now have a compact supporting tracked doc:

- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

Open old field/catalog detail docs only for exact payload audit.

Backend-owned Form Builder details now live in the backend contract and backend module map.
Old frontend backend-facing docs under `platform/frontend/docs/platform-studio/form-builder-backend*.md`, `platform/frontend/docs/platform-studio/form-builder-storage-and-sql-view-contract.md`, and `platform/frontend/docs/platform-studio/form-builder-runtime-storage-review-brief.md` are compatibility pointers.

## Planned Tool Docs

Until dedicated tracked docs exist, planned tools are defined only by the suite contract:

- Navigation Builder
- Action Builder
- PDF Builder
- Report Builder

Do not infer their implementation model from Form Builder internals.

## Compatibility Pointers

Old suite-level paths now point here or to the suite contract:

- `platform/frontend/docs/platform-studio/README.md`
- `platform/frontend/docs/platform-studio/taxonomy-and-naming.md`

## Out Of Scope

- full Form Builder field catalog
- backend Form Builder storage/API details
- donor/reference code
- prompt artifacts
- Navigation Builder, Action Builder, PDF Builder, or Report Builder implementation details before owner approval
