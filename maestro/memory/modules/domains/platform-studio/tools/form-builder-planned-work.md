# Form Builder Planned Work

Status: active planned-work memory
Last verified: 2026-04-25
Verification mode: read-only scan of tracked docs and current FE/BE code surfaces

This file preserves Form Builder planned work without turning it into active
implementation scope. Use it after the active Form Builder contracts, not
instead of them.

## Read First

- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`
- `platform/backend/docs/contracts/platform-studio-form-builder.md`
- `maestro/memory/modules/domains/platform-studio/tools/form-builder.md`

## Code-Confirmed Current State

- Authoring model endpoints exist for list, create, detail, delete, view list, view create, view detail, view copy, view delete, authoring load/save.
- `/authoring` is canonical; `/draft` remains a compatibility alias.
- Managed model export endpoints exist for model bundle and data export.
- Runtime/preview list endpoints exist for meta, query, search suggestions, saved filters, favorite toggle, and record detail.
- `/app/me/favorites` lists runtime favorites.
- Runtime and preview APIs are separate route namespaces.
- Runtime ACL is still on the current tenant-auth baseline until Navigation Builder ACL exists.
- Runtime apply remains additive-only and lives in `platformstudioformbuilder`.
- Managed multiple lookup fields and non-lookup `multi_select`/`tags` have code-backed multivalue bridge-table support.
- Static/external model work is partially code-backed, but exact table-by-table/static lookup details still require retained exact-detail docs.

## Planned / Open Work

- Navigation Builder must own runtime exposure, sidebar placement, and runtime grant assignment for `{ targetType: form_builder_view, modelId, viewId }`.
- Platform Studio preview runtime endpoints still need a dedicated preview access guard.
- Larger runtime record/list/create/edit/save behavior should move to future `platformstudioformruntime`; do not keep expanding `platformstudioformbuilder` by default.
- Post-submit side effects, notifications, integrations, workflow triggers, async retries, and side-effect failure reporting should move to future `platformstudioformactions`.
- Runtime create/edit/save record flows are future runtime package work; current code has runtime list/read scaffolding.
- Import model is planned from the managed export bundle, but no active import route/service exists yet.
- Import data is planned for managed models, but no active import route/service exists yet.
- Final `Export data` product semantics remain open: raw table, authored/runtime view, or both.
- Static/external multivalue storage remains deferred to a future explicit slice.
- Choice field authoring should default `single_select` and `multi_select` Orientation to `Horizontal`.
- View tab Grid settings should add a bool switch above the field list to show only active/list-visible fields for easier sorting of large views.
- Destructive/data-preserving runtime migration mode is future scope; ordinary runtime apply remains additive-only.
- Lookup-heavy filter compiler improvements remain follow-up for `Contact`, `Project`, `Company`, `Reported By`, and similar lookup presets.
- The 14 retained exact-detail docs remain until typed schemas, tests, generated registries, or code-backed docs replace their payload detail.

## Do Not Misread

- `Save` is not site publication.
- Runtime routes existing today does not mean runtime grants are solved.
- Export bundle support does not mean import implementation exists.
- `platform-studio-core` existing today does not mean Form Builder field registry/schema replacement is complete.
- Retained exact-detail docs are opt-in payload references, not active ownership docs.

## Verification Sources

- `platform/backend/cmd/api-tenant/internal/server/routes_platform_studio_form_builder.go`
- `platform/backend/modules/tenant/platformstudioformbuilder/**`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/**`
- `platform/frontend/packages/platform-studio-core/**`
- `platform/backend/docs/contracts/platform-studio-form-builder.md`
- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `maestro/memory/docs/frontend/platform-studio/form-builder-exact-detail-replacement-roadmap.md`
