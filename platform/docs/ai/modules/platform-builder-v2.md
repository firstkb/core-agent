# Module Memory — Platform Builder V2

Status: active
Date: 2026-04-05

## Read this when

- working on Platform Builder V2 UI
- changing builder routes in `tenant-web`
- changing `platform-builder-core`
- changing the Forms / Navigation builder direction

## Current source of truth surfaces

- `platform/frontend/docs/platform-builder-v2/README.md`
- `platform/frontend/docs/platform-builder-v2/v2-foundation-brief.md`
- `platform/frontend/docs/platform-builder-v2/forms-foundation-a-technical-map.md`
- `platform/frontend/docs/platform-builder-v2/data-schema-storage-rules.md`
- `platform/frontend/docs/platform-builder-v2/ui-builder-backend-boundary.md`
- `platform/frontend/docs/platform-builder-v2/form-builder-field-catalog.md`

## Confirmed code surfaces

- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/**`
- `platform/frontend/packages/platform-builder-core/**`

## Locked invariants

- Builder V2 stays app-local in `tenant-web`
- shared builder extraction is limited to typed contracts and validation helpers in `platform-builder-core`
- do not turn old builder UI into the baseline again
- `ezform` is an interaction reference only, not code to copy
- old-code reference is opt-in historical material, not default source of truth
- backend owns physical storage naming, DDL generation, and persistence validation
- builder UI authors business-level model and layout intent, not raw database schema implementation

## Product direction

Current primary builders:

- Forms
- Navigation

Current working route model from docs:

- `/builder/forms`
- `/builder/forms/:objectId`
- `/builder/forms/:objectId/screens/:screenId`

Visible copy and UX can evolve, but internal contract naming must stay stable enough to support future backend work.

## Important cross-stack rule

The frontend may change visible product language.
The backend contract should keep stable internal domain naming.
Do not bind backend persistence design directly to temporary UI copy.

## Important docs to treat as reference-only

Read only if the task really needs them:

- `platform/frontend/docs/platform-builder-v2/old-code-reference/**`
- `platform/frontend/docs/vendor/**`
- `platform/docs/archive/agent-prompts/platform-builder-v2-continue*.md`

## When to update memory

Update this file when:

- route model changes
- shared builder contract layer changes
- backend boundary for builder persistence becomes concrete
- a second builder becomes active beyond Forms and Navigation
