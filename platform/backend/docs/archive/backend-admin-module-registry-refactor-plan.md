# Backend Admin Module Registry Refactor Plan

Status: archived history
Historical status: completed
Date: 2026-04-02
Last audited: 2026-04-25
Canonical scope: historical Module Registry refactor plan

This is archived history.
Do not use it as active backend contract truth.

Read instead:

- `platform/backend/docs/contracts/admin-module-registry.md`
- `platform/backend/docs/contracts/admin-control-plane.md`

## Goal

Split the current `Module registry` backend implementation into smaller domain modules without changing the external admin API contract.

This refactor is intended to happen before frontend integration expands further.

## Why This Refactor Is Needed

The current `Module registry` backend already has good external boundaries:

- canonical secure routes under `/app/...`
- separate navigation module
- separate admin access-policy module
- shared collection-table contract
- shared collection preferences layer

That broad package has now been retired in favor of explicit list, manage, and grants modules.

## Current Split Runtime

Active packages:

- `platform/backend/modules/admin/moduleregistrylist`
- `platform/backend/modules/admin/moduleregistrymanage`
- `platform/backend/modules/admin/moduleregistrygrants`

Active route families:

- `platform/backend/cmd/api-admin/internal/server/routes_module_registry_list.go`
- `platform/backend/cmd/api-admin/internal/server/routes_module_registry_manage.go`
- `platform/backend/cmd/api-admin/internal/server/routes_module_registry_grants.go`

Current support that is already separated and should stay separated:

- navigation:
  - `platform/backend/modules/admin/navigation`
- endpoint authorization:
  - `platform/backend/modules/admin/accesspolicy`
- table contract and filter/sort helpers:
  - `platform/backend/modules/shared/collectiontable`
- favorite and saved-filter persistence:
  - `platform/backend/modules/shared/collectionprefs`

## Fixed Refactor Decision

Do not split this module into only:

- table
- add/edit

That split is incomplete because grant management is a third real domain responsibility.

The accepted split is:

1. `moduleregistrylist`
2. `moduleregistrymanage`
3. `moduleregistrygrants`

## Target Package Layout

### 1. `modules/admin/moduleregistrylist`

Owns:

- `module-registry.list` collection-table surface
- `meta`
- `query`
- `search-suggestions`
- `favorite/toggle`
- `saved-filters`
- `bulk-actions`
- `row-actions`
- `export-xls`

Planned files:

- `platform/backend/modules/admin/moduleregistrylist/model.go`
- `platform/backend/modules/admin/moduleregistrylist/repository.go`
- `platform/backend/modules/admin/moduleregistrylist/service.go`
- `platform/backend/modules/admin/moduleregistrylist/handler.go`
- `platform/backend/modules/admin/moduleregistrylist/service_test.go`

Important note:

- row action `archive` remains part of the list surface contract
- but its business execution should delegate to `moduleregistrymanage`, not reimplement archive logic locally

### 2. `modules/admin/moduleregistrymanage`

Owns:

- module detail read
- module create/update/archive
- section create/update/archive
- input normalization for module and section management

Planned files:

- `platform/backend/modules/admin/moduleregistrymanage/model.go`
- `platform/backend/modules/admin/moduleregistrymanage/repository.go`
- `platform/backend/modules/admin/moduleregistrymanage/service.go`
- `platform/backend/modules/admin/moduleregistrymanage/handler.go`
- `platform/backend/modules/admin/moduleregistrymanage/service_test.go`

### 3. `modules/admin/moduleregistrygrants`

Owns:

- section grant list
- section grant upsert/revoke
- module grant expand-to-sections
- module grant revoke-from-sections
- grant target validation for admin users

Planned files:

- `platform/backend/modules/admin/moduleregistrygrants/model.go`
- `platform/backend/modules/admin/moduleregistrygrants/repository.go`
- `platform/backend/modules/admin/moduleregistrygrants/service.go`
- `platform/backend/modules/admin/moduleregistrygrants/handler.go`
- `platform/backend/modules/admin/moduleregistrygrants/service_test.go`

## What Stays Shared

These should remain shared and should not be pulled back into the registry packages:

- `platform/backend/modules/shared/collectiontable`
- `platform/backend/modules/shared/collectionprefs`
- `platform/backend/modules/admin/navigation`
- `platform/backend/modules/admin/accesspolicy`

No new generic shared package is required for this refactor.

Rule:

- prefer explicit small modules first
- only introduce a new shared admin registry package later if duplication becomes real and stable

## Route And Wiring Split

Current single route file should be split into three route-family files:

- `platform/backend/cmd/api-admin/internal/server/routes_module_registry_list.go`
- `platform/backend/cmd/api-admin/internal/server/routes_module_registry_manage.go`
- `platform/backend/cmd/api-admin/internal/server/routes_module_registry_grants.go`

Current single wiring file should be split into three wiring files:

- `platform/backend/cmd/api-admin/internal/server/wiring_module_registry_list.go`
- `platform/backend/cmd/api-admin/internal/server/wiring_module_registry_manage.go`
- `platform/backend/cmd/api-admin/internal/server/wiring_module_registry_grants.go`

`routes.go` should then register:

- `srv.registerModuleRegistryListRoutes(b)`
- `srv.registerModuleRegistryManageRoutes(b)`
- `srv.registerModuleRegistryGrantRoutes(b)`

`bootstrap.go` should then build:

- `server.moduleRegistryListHT`
- `server.moduleRegistryManageHT`
- `server.moduleRegistryGrantHT`

## External API Compatibility Rule

This refactor must not change:

- route paths
- HTTP methods
- request payloads
- response payloads
- route ids unless there is a very strong reason

Canonical route family remains:

- `/app/admin/module-registry/list/...`
- `/app/admin/module-registry/modules/...`
- `/app/admin/module-registry/sections/...`

The refactor is internal composition cleanup, not a product contract change.

## Database Impact

No schema change is required for this refactor.

Existing tables remain:

- `admin_module`
- `admin_module_section`
- `admin_section_grant`
- `admin_collection_favorite`
- `admin_collection_saved_filter`

No migration should be created as part of this refactor unless a separate functional requirement appears.

## Recommended Extraction Order

### Step 1. Extract `moduleregistrymanage`

Status: completed

Reason:

- it is the cleanest bounded subdomain
- it removes archive/create/update logic from the current oversized service
- it gives the list module a stable target for row-action delegation

Move out:

- `GetModule`
- `CreateModule`
- `UpdateModule`
- `ArchiveModule`
- `CreateSection`
- `UpdateSection`
- `ArchiveSection`
- related normalization helpers
- related DTOs
- related repository methods

### Step 2. Extract `moduleregistrygrants`

Status: completed

Reason:

- grant logic is operationally separate from registry CRUD
- it has its own validation rules and user lookup behavior

Move out:

- `ListSectionGrants`
- `UpsertSectionGrant`
- `RevokeSectionGrant`
- `UpsertModuleGrants`
- `RevokeModuleGrants`
- `normalizeGrantUpsert`
- `adminRoleFromLevel`
- related DTOs
- related repository methods

### Step 3. Leave `moduleregistrylist` as the remaining list surface

Status: completed

Keep in list module:

- `LoadMeta`
- `Query`
- `LoadSearchSuggestions`
- `ToggleFavorite`
- `CreateSavedFilter`
- `RunBulkAction`
- `RunRowAction`
- `ExportXLS`

After Steps 1 and 2, `RunRowAction("archive")` should call the manage service instead of archiving directly.

### Step 4. Remove or retire the old `modules/admin/moduleregistry` package

Status: completed

Only after all handlers, services, route files, and wiring are switched.

## File Move Guide

### Move from current `service.go`

To `moduleregistrylist/service.go`:

- list surface methods
- list projection/filter/sort helpers
- `requireRoot`
- `isRootClaims`
- `scopeContains`
- table field/column definitions

To `moduleregistrymanage/service.go`:

- module and section management methods
- module/section normalization helpers
- module/section output mapping

To `moduleregistrygrants/service.go`:

- section/module grant methods
- grant normalization helpers
- grant output mapping
- admin-role projection for grant output

### Move from current `repository.go`

To `moduleregistrylist/repository.go`:

- `ListModules`

To `moduleregistrymanage/repository.go`:

- `GetModuleByGUID`
- `CreateModule`
- `UpdateModule`
- `ArchiveModule`
- `CreateSection`
- `UpdateSection`
- `ArchiveSection`
- `getSectionByGUID`

To `moduleregistrygrants/repository.go`:

- `GetAdminUserByID`
- `ListSectionGrants`
- `UpsertSectionGrant`
- `RevokeSectionGrant`
- `getSectionGrant`

Note:

- if `getSectionByGUID` is needed by grants, duplicate it first or extract a tiny read helper later
- do not introduce a premature shared repository package during the first split

## Handler Split

Current `handler.go` should be replaced by:

- list handler
- manage handler
- grants handler

Rule:

- each handler should expose only the HTTP methods for its own route family
- do not create one mega-handler bundle again

## Server Struct Impact

`cmd/api-admin/internal/server/server.go` should move from one handler field to three.

Target shape:

```go
moduleRegistryListHT   *moduleregistrylist.Handler
moduleRegistryManageHT *moduleregistrymanage.Handler
moduleRegistryGrantHT  *moduleregistrygrants.Handler
```

If the list module needs row-action delegation, inject a narrow interface from manage into list wiring instead of importing the whole handler layer.

## Testing Rule

Each new package should keep its own tests:

- list tests
- manage tests
- grants tests

And then keep:

- route registration tests if present
- `go test ./...` green at the workspace level

## Acceptance Checklist

- [x] no external route changes
- [x] no request/response contract changes
- [x] no new migration required
- [x] `moduleregistry` no longer owns all three responsibilities
- [x] list row action `archive` delegates to manage service
- [x] grant logic is isolated from module/section CRUD
- [x] route registration is split into `routes_*` files by responsibility
- [x] wiring is split into `wiring_*` files by responsibility
- [x] `go test ./...` passes

## Non-Goals

This refactor does not include:

- tenant-side module registry
- frontend integration work
- expanding admin access policy coverage beyond the already approved route map
- real XLS export implementation
- real bulk actions implementation

## Recommendation

Do this refactor before frontend rollout expands further.

Reason:

- current backend contract is already stable enough
- internal split is still manageable now
- delaying the split will make list, CRUD, grants, navigation, and access-policy changes harder to evolve independently
