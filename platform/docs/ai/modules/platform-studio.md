# Module Memory — Platform Studio

Status: active
Date: 2026-04-07

## Read this when

- working on Platform Studio UI
- changing builder routes in `tenant-web`
- changing `platform-studio-core`
- changing the Forms / Navigation builder direction

## Current source of truth surfaces

- `platform/frontend/docs/platform-studio/README.md`
- `platform/frontend/docs/platform-studio/taxonomy-and-naming.md`
- `platform/frontend/docs/platform-studio/form-builder-first-contract.md`
- `platform/frontend/docs/platform-studio/v2-foundation-brief.md`
- `platform/frontend/docs/platform-studio/forms-foundation-a-technical-map.md`
- `platform/frontend/docs/platform-studio/data-schema-storage-rules.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-boundary.md`
- `platform/frontend/docs/platform-studio/form-builder-field-catalog.md`

## Confirmed code surfaces

- `platform/frontend/apps/tenant-web/src/features/platform-studio/**`
- `platform/frontend/packages/platform-studio-core/**`

## Locked invariants

- Platform Studio is the umbrella builder surface in `tenant-web`
- Form Builder is the first active Platform Studio tool
- Navigation Builder and Action Builder are planned Platform Studio tools, but not implementation-active yet
- Platform Studio UI stays app-local in `tenant-web`
- shared extraction is limited to typed contracts and validation helpers in `platform-studio-core`
- do not turn old builder UI into the baseline again
- `ezform` is an interaction reference only, not code to copy
- old-code reference is opt-in historical material, not default source of truth
- backend owns physical storage naming, DDL generation, and persistence validation
- builder UI authors business-level model and layout intent, not raw database schema implementation
- user-facing Form Builder language is `Model` and `View`
- active Form Builder route params are `modelId` and `viewId`
- legacy `EntityDefinition` and `FieldDefinition` names may remain only as compatibility aliases during migration

## Product direction

Platform Studio tool map:

- Form Builder
- Navigation Builder
- Action Builder
- future tools may be added later

Current working route model from docs:

- `/builder/forms`
- `/builder/forms/:modelId`
- `/builder/forms/:modelId/views/:viewId`

Legacy compatibility remains acceptable for:

- `/builder/forms/:modelId/screens/:viewId`
- `/builder/forms/:dataSchemaId/ui/:uiSchemaId`

Visible copy and UX can evolve, but active contract naming must now stay stable enough to support backend integration.

## Important cross-stack rule

The frontend may change visible product language.
The backend contract should keep stable internal domain naming.
Do not bind backend persistence design directly to temporary UI copy.

The first backend-ready Form Builder contract is locked around:

- model list/detail
- view list/detail
- layout draft tree
- lock state
- save semantics

## Important docs to treat as reference-only

Read only if the task really needs them:

- `platform/frontend/docs/platform-studio/old-code-reference/**`
- `platform/frontend/docs/vendor/**`
- `platform/docs/archive/agent-prompts/platform-studio-continue*.md`

## When to update memory

Update this file when:

- route model changes
- shared builder contract layer changes
- backend boundary for builder persistence becomes concrete
- a second builder becomes implementation-active beyond Form Builder
