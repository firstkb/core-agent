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
- `platform/backend/cmd/api-tenant/internal/server/wiring_platform_studio_navigation_builder.go`

Tenant module surface:

- `platform/backend/modules/tenant/platformstudionavigationbuilder`

Tenant schema surfaces:

- `platform/backend/migrations/postgres/tenant/007_platform_studio_navigation_builder.sql`
- `platform/backend/bundle/tenant_schema_full.sql`

## Current Module Responsibility

`platformstudionavigationbuilder` owns:

- Navigation Builder authoring transport
- saved navigation definition persistence
- optimistic version checks
- definition validation
- duplicate target prevention
- future runtime sidebar handoff contract

It does not own:

- Form Builder model/view authoring
- Form Builder runtime record behavior
- backend ACL/grant enforcement in the first slice
- Business Tree page data
- frontend-only editor state

## Code Surface Map

Transport:

- `handler.go`

Service orchestration:

- `service.go`
- `validation.go`

Persistence:

- `repository.go`

Shared shapes:

- `model.go`

## Verification

Use:

```bash
go test ./modules/tenant/platformstudionavigationbuilder
```

Run from `platform/backend`.
