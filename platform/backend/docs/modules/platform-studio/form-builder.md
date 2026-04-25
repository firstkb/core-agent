# Platform Studio Form Builder Backend Module

Status: active
Owner: backend
Last audited: 2026-04-25
Canonical scope: backend Form Builder implementation map and read order

This module doc is the backend implementation entrypoint for Form Builder.
It points to the active contract and code surfaces without repeating API, storage, validation, or runtime apply details.

## Read Order

For backend Form Builder work, read:

1. this file
2. `platform/backend/docs/contracts/platform-studio-form-builder.md`
3. `platform/backend/docs/contracts/runtime-wiring.md` when touching route wiring or runtime composition
4. `platform/backend/docs/contracts/migrations.md` when touching tenant schema or generated bundle behavior
5. `platform/frontend/docs/modules/platform-studio/form-builder.md` when the change affects frontend authoring/runtime behavior

Do not read old frontend backend-handoff docs by default.
Those pointer files were deleted after the backend contract slice.

## Runtime Ownership

Form Builder backend currently runs inside:

- `cmd/api-tenant`

Route and wiring surfaces:

- `platform/backend/cmd/api-tenant/internal/server/routes_platform_studio_form_builder.go`
- `platform/backend/cmd/api-tenant/internal/server/wiring_platform_studio_form_builder.go`

Tenant module surface:

- `platform/backend/modules/tenant/platformstudioformbuilder`

Tenant schema surfaces:

- `platform/backend/migrations/postgres/tenant/000_tenant_baseline.sql`
- `platform/backend/bundle/tenant_schema_full.sql`

## Current Module Responsibility

`platformstudioformbuilder` owns the current tenant backend for:

- Form Builder authoring transport
- `ps_model` and `ps_view` persistence
- model/view create, read, save, copy, delete, and export behavior
- authoring compatibility, normalization, validation, and compaction
- stable model/view identity enforcement
- model/view lock and optimistic version checks
- runtime metadata derivation and naming
- additive runtime apply
- early runtime meta/query/record/filter/favorite/saved-filter scaffolding

The detailed API, storage, generated-object, validation, and migration rules are defined in `contracts/platform-studio-form-builder.md`.

## Code Surface Map

Transport:

- `handler.go`

Service orchestration:

- `service.go`
- `service_models.go`
- `service_views.go`
- `service_draft.go`
- `service_export.go`
- `service_support.go`

Authoring contract processing:

- `authoring_schema.go`
- `authoring_helpers.go`
- `authoring_compat.go`
- `authoring_normalize.go`
- `authoring_validate.go`
- `authoring_derive.go`
- `authoring_compact.go`

Persistence:

- `repository.go`
- `repository_tx.go`
- `repository_models.go`
- `repository_views.go`
- `repository_mutation.go`
- `repository_runtime_query.go`
- `repository_runtime_favorites.go`
- `repository_runtime_saved_filters.go`

Runtime behavior:

- `runtime_naming.go`
- `runtime_apply.go`
- `runtime_apply_repository.go`
- `runtime_conflicts.go`
- `runtime_list.go`
- `runtime_record.go`
- `runtime_filters.go`
- `runtime_favorites.go`

Shared shapes:

- `model.go`

## Boundary Guardrails

- Keep handlers thin.
- Keep SQL and persistence in repositories.
- Keep authoring normalization and validation out of handlers.
- Runtime apply remains additive-only.
- Save remains authoring persistence plus additive runtime apply, not site publication.
- Do not fall back from `viewId` to `view_key`.
- Do not let non-default views mutate model-owned `dataSchema` or `layoutBlueprint`.
- Do not hide runtime apply failure inside a generic save failure when authoring persistence succeeded.
- Do not expand `platformstudioformbuilder` into a catch-all Platform Studio backend package.

## Future Package Split

Current package:

- `platformstudioformbuilder`: authoring/control-plane owner and current transitional runtime scaffolding.

Future package direction:

- `platformstudioformruntime`: runtime record/list/create/edit/save behavior, runtime query/filter/sort/page/row actions, and record repositories.
- `platformstudioformactions`: after-save hooks, notifications, integrations, workflow triggers, async side effects, retries, and failure reporting.

Navigation/access, PDF, and report concerns need explicit future contracts before backend implementation.

## Verification

Use:

```bash
go test ./modules/tenant/platformstudioformbuilder
```

Run from `platform/backend`.
