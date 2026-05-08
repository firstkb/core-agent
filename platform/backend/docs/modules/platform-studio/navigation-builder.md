# Platform Studio Navigation Builder Backend Module

Status: active first backend slice
Owner: backend
Last audited: 2026-05-06
Canonical scope: backend Navigation Builder implementation map and read order

## Read Order

For backend Navigation Builder work, read:

1. this file
2. `platform/backend/docs/contracts/platform-studio-navigation-builder.md`
3. `platform/backend/docs/contracts/runtime-wiring.md` when touching route wiring
4. `platform/backend/docs/contracts/migrations.md` when touching tenant schema or bundle behavior
5. `platform/frontend/docs/contracts/platform-studio.md` when frontend/runtime
   behavior is affected

## Runtime Ownership

Navigation Builder backend currently runs inside:

- `cmd/api-tenant`

Route and wiring surfaces:

- `platform/backend/cmd/api-tenant/internal/server/routes_platform_studio_navigation_builder.go`
- `platform/backend/cmd/api-tenant/internal/server/routes_navigation_access_guard.go`
- `platform/backend/cmd/api-tenant/internal/server/wiring_platform_studio_navigation_builder.go`

Tenant module surface:

- `platform/backend/modules/tenant/platformstudionavigationbuilder`

Tenant schema surfaces:

- `platform/backend/migrations/postgres/tenant/007_platform_studio_navigation_builder.sql`
- `platform/backend/migrations/postgres/tenant/011_platform_studio_navigation_access_runtime.sql`
- `platform/backend/migrations/postgres/tenant/012_platform_studio_navigation_access_company_type.sql`
- `platform/backend/migrations/postgres/tenant/013_platform_studio_navigation_root_access.sql`
- `platform/backend/bundle/tenant_schema_full.sql`

## Current Module Responsibility

`platformstudionavigationbuilder` owns:

- Navigation Builder authoring transport
- access recipient lookup transport for current users, companies, company
  types, and job types, including paged/search lookup for large picker dialogs
- saved navigation definition persistence
- derived runtime/access table synchronization on save
- optimistic version checks
- definition validation
- duplicate target prevention
- runtime app menu and utility rail visibility projection via
  `GET /app/navigation`, including root/admin access-policy bypass while
  preserving inactive item filtering
- direct target access evaluation for runtime Form View APIs, app page APIs,
  and Platform Studio API routes
- protected `root_only` access mode; only root/admin claims may save
  definitions that contain or introduce root-only navigation items

It does not own:

- Form Builder model/view authoring
- Form Builder runtime record behavior
- Business Tree page data
- frontend-only editor state

## Code Surface Map

Transport:

- `handler.go`

Service orchestration:

- `service.go`
- `runtime_access.go`
- `validation.go`

Persistence:

- `repository.go`
- `derived.go`

Shared shapes:

- `model.go`

## Verification

Use:

```bash
go test ./modules/tenant/platformstudionavigationbuilder
go test ./cmd/api-tenant/internal/server
```

Run from `platform/backend`.
