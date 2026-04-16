# Backend Admin Module Registry Brief

Status: active planning brief  
Date: 2026-04-02

## Goal

Introduce a root-managed admin control-plane module called `Module registry`.

Related implementation cleanup plan:

- [`backend-admin-module-registry-refactor-plan.md`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/backend/docs/backend-admin-module-registry-refactor-plan.md)
- [`backend-admin-access-policy-layering.md`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/backend/docs/backend-admin-access-policy-layering.md)

The module owns:

- the canonical list of admin modules
- the canonical list of sections inside each module
- future section-level access grants for non-root admin users
- future navigation projection for the admin sidebar
- future API authorization mapping for secured admin endpoints

This brief intentionally separates the work into phases so schema, list API, grants, navigation, and endpoint authorization do not get mixed into one rollout.

## Fixed Decisions

These decisions are locked for this feature unless explicitly changed later.

- `Module registry` is `admin api` only.
- `tenant api` will use different domain logic and is out of scope here.
- `Module registry` itself is visible and manageable only by `root`.
- Non-root admin users do not get access to the `Module registry` UI/module.
- Access is granted at `section` level only.
- Effective access model is `allow-only`.
- `root` sees everything.
- Non-root admin users see only explicitly granted sections.
- Current permission modes are `read` and `write`.
- `delete` is intentionally deferred until there are real destructive non-root admin routes that need narrower authorization than `write`.
- A module-level checkbox in UI is only a convenience projection; stored grants still resolve to section rows.
- `GET /app/profile` stays focused on the current principal and must not become the navigation payload.
- Navigation is projected through a separate endpoint:
  - `GET /app/me/navigation`
- Secure admin app API routes should live under `/app/...` because this is the JWT-validated API Gateway route family.

## Current Boundary

Current frontend proving surface for the first backend delivery:

- doc: [`collection-table-backend-integration-contract.md`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/collection-table-backend-integration-contract.md)
- current page route: `/modules/list`
- current table surface id: `module-registry.list`

Important:

- the target secure route family for gateway-facing rollout is `/app/...`
- the backend contract for `Module registry` should stay canonical on `/app/admin/...`
- do not introduce legacy `/admin/module-registry/...` aliases unless an explicit migration bridge is approved

Canonical target for this feature should be treated as:

- `GET /app/admin/module-registry/list/meta`
- `POST /app/admin/module-registry/list/query`
- `GET /app/admin/module-registry/list/search-suggestions`
- `POST /app/admin/module-registry/list/bulk-actions/{actionId}`
- `POST /app/admin/module-registry/list/row-actions/{actionId}`
- `POST /app/admin/module-registry/list/favorite/toggle`
- `POST /app/admin/module-registry/list/saved-filters`
- `POST /app/admin/module-registry/list/export-xls`

## Phase Status

| Phase | Status | Scope |
| --- | --- | --- |
| Phase 0 | completed | Brief, scope lock, and implementation decisions |
| Phase 1 | completed | Root-only module registry schema and universal-table list API |
| Phase 2 | completed | Root-only module and section management API |
| Phase 3 | completed | Section-level access grant model and grant-management API |
| Phase 4 | completed | Admin navigation projection through `/app/me/navigation` |
| Phase 5 | completed | Admin endpoint authorization policy for the current approved non-root rollout slice |
| Phase 6 | planned | Frontend handoff, route alignment, and rollout cleanup |

## Phase Checklist

### Phase 0

Status: completed

- [x] confirm `Module registry` is `admin api` only
- [x] confirm registry UI is `root` only
- [x] confirm grants are `section` level only
- [x] confirm allow-only model
- [x] confirm `/app/profile` remains separate from navigation
- [x] confirm canonical navigation endpoint is `GET /app/me/navigation`
- [x] confirm secure admin API route family should use `/app/...`
- [x] create this brief document

### Phase 1

Status: completed

Goal:

- deliver the first real backend surface for the universal collection table page
- keep scope root-only
- focus on read/list behavior first

Checklist:

- [x] define master schema for admin module registry
- [x] define master schema for admin module sections
- [x] define stable ordering/status fields needed for sidebar and registry maintenance
- [x] add migrations
- [x] add `modules/admin/moduleregistrylist/*`
- [x] implement root-only list meta endpoint
- [x] implement root-only list query endpoint
- [x] implement root-only search suggestions endpoint
- [x] implement placeholder or real bulk/row/favorite/saved-filter/export handlers required by the table contract
- [x] wire module through `cmd/api-admin/internal/server/wiring_module_registry_list.go`
- [x] register routes under canonical `/app/admin/module-registry/...`
- [x] add tests

Target outcome:

- backend can serve the current `module-registry.list` proving surface from real data

Status notes:

- completed
- master schema now contains `admin_module`, `admin_module_section`, `admin_collection_favorite`, and `admin_collection_saved_filter`
- baseline control-plane rows are inserted for:
  - `Module registry`
  - `Tenant`
  - `Users`
- `api-admin` exposes canonical `/app/admin/module-registry/...` routes
- access is enforced at runtime as `root` only
- favorite toggle and saved-filter creation are persisted in master
- bulk action and row action handlers exist as explicit invalid-action stubs until later phases define real actions
- export endpoint currently returns a successful no-op mutation result until real XLS generation is introduced

Validation:

- `go test ./...`
- `go run ./cmd/migrate --env ./env/migrate.local.env.example`
- `psql -U postgres -d 108-master -c "select version from schema_migrations where version='060_admin_module_registry';"`
- `psql -U postgres -d 108-master -c "select module_key, title, status, sort_order from admin_module order by sort_order;"`

Changed files:

- `platform/backend/migrations/postgres/master/060_admin_module_registry.sql`
- `platform/backend/modules/admin/moduleregistrylist/model.go`
- `platform/backend/modules/admin/moduleregistrylist/repository.go`
- `platform/backend/modules/admin/moduleregistrylist/service.go`
- `platform/backend/modules/admin/moduleregistrylist/handler.go`
- `platform/backend/modules/admin/moduleregistrylist/service_test.go`
- `platform/backend/cmd/api-admin/internal/server/server.go`
- `platform/backend/cmd/api-admin/internal/server/bootstrap.go`
- `platform/backend/cmd/api-admin/internal/server/routes.go`
- `platform/backend/cmd/api-admin/internal/server/routes_module_registry_list.go`
- `platform/backend/cmd/api-admin/internal/server/wiring_module_registry_list.go`
- `platform/backend/docs/backend-admin-module-registry-brief.md`
- `platform/backend/docs/backend-schema-master-baseline.md`

### Phase 2

Status: completed

Goal:

- let `root` manage modules and sections as real control-plane records

Checklist:

- [x] define create/update/archive contract for modules
- [x] define create/update/archive contract for sections
- [x] add root-only CRUD endpoints
- [x] align row actions from the table surface with real backend actions
- [x] define validation rules:
  - stable module key
  - stable section key
  - uniqueness constraints
  - display order handling
- [x] add tests

Target outcome:

- `root` can manage the registry itself, not just list it

Status notes:

- completed
- list surface now exposes frontend-managed `edit` row action plus backend bulk `activate/archive` actions
- canonical management routes now exist under `/app/admin/module-registry/...`
- legacy `/admin/module-registry/...` aliases were removed so the module now follows the canonical `/app/...` rule only
- module and section create/update contracts keep `module_key` and `section_key` immutable after creation
- sort order is normalized at service level with default `100` when missing or non-positive
- section payloads now expose parent module identity through the external module GUID, not the internal numeric row id
- archiving a module also archives its sections in the same repository transaction
- collection favorite and saved-filter persistence was extracted into shared `modules/shared/collectionprefs`
- no new schema objects or migrations were required for Phase 2 because Phase 1 schema already covered module/section management

Validation:

- `go test ./modules/admin/moduleregistrylist ./cmd/api-admin/internal/server`
- `go test ./...`

Changed files:

- `platform/backend/modules/admin/moduleregistrylist/model.go`
- `platform/backend/modules/admin/moduleregistrylist/repository.go`
- `platform/backend/modules/admin/moduleregistrylist/service.go`
- `platform/backend/modules/admin/moduleregistrylist/handler.go`
- `platform/backend/modules/admin/moduleregistrylist/service_test.go`
- `platform/backend/modules/shared/collectionprefs/service.go`
- `platform/backend/modules/shared/collectionprefs/admin_repository.go`
- `platform/backend/modules/shared/collectionprefs/service_test.go`
- `platform/backend/cmd/api-admin/internal/server/routes_module_registry_manage.go`
- `platform/backend/cmd/api-admin/internal/server/wiring_module_registry_manage.go`
- `platform/backend/docs/backend-module-wiring-standard.md`
- `platform/backend/docs/backend-admin-module-registry-brief.md`

### Phase 3

Status: completed

Goal:

- introduce the actual permission model used by non-root admin users

Checklist:

- [x] define section-grant storage model
- [x] define `read` / `write` access representation
- [x] explicitly defer `delete` until a real non-root destructive route matrix exists
- [x] define root bypass behavior
- [x] define how a module-level checkbox expands into section-level grants
- [x] add grant-management API for `root`
- [x] add repository/service tests
- [x] document grant semantics

Target outcome:

- backend can store and manage explicit admin section grants

Status notes:

- completed
- master schema now contains `admin_section_grant`
- access is represented as one `access_mode` value per `(admin_user_id, section_id)` pair:
  - `read`
  - `write`
- `delete` is not part of the current schema or grant UI contract
- this is intentional for the current stage because no non-root destructive admin route requires a capability narrower than `write`
- `root` remains a bypass principal and cannot be the target of explicit section grants
- inactive admin users cannot receive new grants
- module-level grant operations are convenience endpoints that expand into section-level rows
- module-level upsert applies grants to all non-archived sections in the module
- canonical grant-management routes now exist under `/app/admin/module-registry/...`

Validation:

- `go test ./...`
- `go run ./cmd/migrate --env ./env/migrate.local.env.example`
- `psql -U postgres -d 108-master -c "select version from schema_migrations where version in ('060_admin_module_registry','070_admin_section_grant') order by version;"`
- `psql -U postgres -d 108-master -c "\\d admin_section_grant"`

Changed files:

- `platform/backend/migrations/postgres/master/070_admin_section_grant.sql`
- `platform/backend/modules/admin/moduleregistrygrants/model.go`
- `platform/backend/modules/admin/moduleregistrygrants/repository.go`
- `platform/backend/modules/admin/moduleregistrygrants/service.go`
- `platform/backend/modules/admin/moduleregistrygrants/handler.go`
- `platform/backend/modules/admin/moduleregistrygrants/service_test.go`
- `platform/backend/cmd/api-admin/internal/server/routes.go`
- `platform/backend/cmd/api-admin/internal/server/routes_admin_profile.go`
- `platform/backend/cmd/api-admin/internal/server/routes_tenant_management.go`
- `platform/backend/cmd/api-admin/internal/server/routes_module_registry_grants.go`
- `platform/backend/docs/backend-admin-module-registry-brief.md`
- `platform/backend/docs/backend-schema-master-baseline.md`
- `platform/backend/docs/backend-api-gateway-proxy-routing-policy.md`
- `platform/backend/docs/backend-api-gateway-http-api-mapping-spec.md`

### Phase 4

Status: completed

Goal:

- project the admin sidebar and related access shape without overloading `/app/profile`

Checklist:

- [x] define `GET /app/me/navigation` response contract
- [x] project navigation for `root`
- [x] project navigation for non-root users from explicit section grants
- [x] keep `/app/profile` unchanged except for any minimal linkage strictly required by auth/runtime
- [x] add tests
- [x] document frontend integration expectations

Target outcome:

- frontend can build sidebar/navigation from a dedicated endpoint

Status notes:

- completed
- `api-admin` now exposes `GET /app/me/navigation`
- `/app/profile` remains unchanged and still returns only the current principal profile
- navigation response is projected as `favorites[] + modules -> sections`
- `root` receives only `active` sections under `active` modules where:
  - `route_path` is present
  - backend route-policy coverage exists for that section
- non-root admin users receive only explicitly granted `active` sections under `active` modules where:
  - `route_path` is present
  - backend route-policy coverage exists for that section
  - the current grant mode is sufficient for at least one mapped secure route in that section
- non-root navigation intentionally excludes `module_registry` entries even if grant rows exist, matching the fixed decision that `Module registry` stays root-only
- section entries include `access` so later UI and route-policy work can distinguish `read` from `write`
- `favorites[]` is per-user and must be filtered through the same route coverage and grant rules as the normal section tree
- `favorites[]` is sourced from `admin_collection_favorite`, not from a separate navigation-favorite table
- current first favorite-capable navigation surface is `module-registry.list`

Frontend integration expectations:

- frontend should call `GET /app/me/navigation` only after auth/profile bootstrap succeeds
- backend `route_path` is the admin-app route projection and should be used as the sidebar target path
- current output shape is:
  - `is_root`
  - `modules[]`
  - `modules[].sections[]`
- each section exposes:
  - `id`
  - `section_key`
  - `title`
  - `description`
  - `route_path`
  - `access`

Validation:

- `go test ./modules/admin/navigation ./cmd/api-admin/internal/server`
- `go test ./...`

Changed files:

- `platform/backend/modules/admin/navigation/model.go`
- `platform/backend/modules/admin/navigation/repository.go`
- `platform/backend/modules/admin/navigation/service.go`
- `platform/backend/modules/admin/navigation/handler.go`
- `platform/backend/modules/admin/navigation/service_test.go`
- `platform/backend/cmd/api-admin/internal/server/server.go`
- `platform/backend/cmd/api-admin/internal/server/bootstrap.go`
- `platform/backend/cmd/api-admin/internal/server/routes.go`
- `platform/backend/cmd/api-admin/internal/server/routes_admin_navigation.go`
- `platform/backend/cmd/api-admin/internal/server/wiring_admin_navigation.go`
- `platform/backend/docs/backend-admin-module-registry-brief.md`

### Phase 5

Status: completed

Goal:

- enforce admin API access according to the granted section model

Checklist:

- [x] define endpoint-to-section permission mapping strategy
- [x] decide where enforcement lives:
  - route guard
  - middleware
  - handler-level policy wrapper
- [x] implement root bypass
- [x] enforce `read` vs `write` where relevant in the current mapped route set
- [x] keep `/app/profile` and `/app/me/navigation` behavior explicit
- [x] add audit/logging where useful
- [x] add tests
- [x] define the full route-to-section matrix for the current approved non-root rollout slice
- [x] ensure navigation only exposes sections that have backend route-policy coverage
- [x] freeze the current approved non-root rollout slice
- [x] add route-policy tests for each currently mapped non-root route
- [x] run end-to-end verification for a granted non-root admin across navigation and secured routes

Target outcome:

- non-root admin users are limited by explicit section grants, not just by frontend hiding

Status notes:

- completed for the current approved rollout slice
- enforcement lives in `api-admin` middleware with an explicit route-policy map
- secure routes use default-deny for non-root users when no route policy is defined
- `root` remains the universal bypass, but active `admin_user.status` is still required
- `/app/profile` and `/app/me/navigation` stay explicit self-allowed routes
- `Module registry` routes are now enforced as root-only both in middleware and in service logic
- the current approved non-root rollout slice is:
  - `tenant.onboarding`
- current route-to-section matrix for that slice is:
  - `ADMIN_PROFILE_GET` -> self
  - `ADMIN_NAVIGATION_GET` -> self
  - `ADMIN_MODULE_REGISTRY_*` -> module `module_registry`, section `modules_list`, access `write`, root-only
  - `ADMIN_TENANTS_LIST_*` -> module `tenant`, section `list_of_tenants`, access `write`, root-only
  - `ADMIN_TENANT_CREATE` -> module `tenant`, section `onboarding`, access `write`
- navigation now filters section visibility through the same route matrix used by middleware policy lookup
- seeded sections without backend route coverage remain hidden from non-root navigation until their secured route mapping is implemented
- `tenant.list_of_tenants` is now covered for root through `/app/admin/tenants/list/*`, while non-root coverage is still pending
- current rollout was verified end-to-end for a granted non-root admin:
  - visible sidebar section
  - allowed secure route
  - denied root-only route
- policy denials are logged with route id, user id, and denial reason

Future expansion after Phase 5:

- define the next approved non-root admin feature set
- map each newly approved secure route id to:
  - module key
  - section key
  - required access mode
- verify that newly seeded `route_path` values and frontend navigation do not expose sections without backend authorization coverage
- decide whether any future destructive non-root route truly needs a third capability such as `delete`
- if `delete` is accepted later, treat it as a separate schema and contract change:
  - migration for `admin_section_grant.access_mode`
  - grant-management API update
  - navigation/access-policy update
  - frontend grant UI update

Validation:

- `go test ./modules/admin/accesspolicy ./modules/admin/navigation ./cmd/api-admin/internal/server`
- `go test ./...`
- `go run ./cmd/migrate --env ./env/migrate.local.env.example`
- `psql -d 'postgresql://postgres@/108-master?host=/tmp' -c "select version from schema_migrations where version='080_admin_section_rollout_alignment';"`
- `psql -d 'postgresql://postgres@/108-master?host=/tmp' -c "select m.module_key, s.section_key, s.status, s.route_path from admin_module_section s join admin_module m on m.id = s.module_id where m.module_key='tenant' order by s.sort_order, s.section_key;"`

Changed files:

- `platform/backend/migrations/postgres/master/080_admin_section_rollout_alignment.sql`
- `platform/backend/modules/admin/accesspolicy/service.go`
- `platform/backend/modules/admin/accesspolicy/repository.go`
- `platform/backend/modules/admin/accesspolicy/matrix.go`
- `platform/backend/modules/admin/accesspolicy/matrix_test.go`
- `platform/backend/modules/admin/accesspolicy/service_test.go`
- `platform/backend/modules/admin/navigation/repository.go`
- `platform/backend/cmd/api-admin/internal/server/access_policy.go`
- `platform/backend/cmd/api-admin/internal/server/middleware_admin_access.go`
- `platform/backend/cmd/api-admin/internal/server/access_policy_test.go`
- `platform/backend/cmd/api-admin/internal/server/phase5_rollout_test.go`
- `platform/backend/cmd/api-admin/internal/server/server.go`
- `platform/backend/cmd/api-admin/internal/server/bootstrap.go`
- `platform/backend/cmd/api-admin/internal/server/wiring_admin_navigation.go`
- `platform/backend/docs/backend-admin-module-registry-brief.md`
- `platform/backend/docs/backend-admin-access-policy-layering.md`

### Phase 6

Status: planned

Goal:

- finish rollout and handoff cleanly to frontend and gateway integration

Checklist:

- [ ] align frontend table contract from `/api/admin/...` to canonical `/app/admin/...`
- [ ] remove temporary aliases if introduced
- [ ] publish frontend handoff document
- [ ] verify API Gateway route grouping assumptions still hold
- [ ] verify root-only and granted-user behavior end to end

Target outcome:

- clean production-facing contract with no ambiguous route families

## Recommended Data Shape

This section summarizes the conceptual feature shape. Canonical schema lives in migrations and `backend-schema-master-baseline.md`.

Suggested core records:

- `admin_module`
  - `id`
  - `guid`
  - `module_key`
  - `title`
  - `description`
  - `icon`
  - `sort_order`
  - `status`
  - `created_at`
  - `updated_at`

- `admin_module_section`
  - `id`
  - `guid`
  - `module_id`
  - `section_key`
  - `title`
  - `description`
  - `route_path`
  - `sort_order`
  - `status`
  - `created_at`
  - `updated_at`

Grant model:

- `admin_section_grant`
  - `id`
  - `guid`
  - `admin_user_id`
  - `section_id`
  - `access_mode`
  - `created_at`
  - `updated_at`

## Recommended Implementation Order

1. Phase 1: real list API for the current universal table surface
2. Phase 2: root-only CRUD for modules and sections
3. Phase 3: section-grant storage and management
4. Phase 4: `/app/me/navigation`
5. Phase 5: secured-route authorization
6. Phase 6: frontend/gateway cleanup

## Out Of Scope For Phase 1

- non-root admin navigation
- grant-management UI
- generic admin authorization middleware for every endpoint
- tenant-side equivalent registry logic
- stuffing navigation into `/app/profile`
- deny rules
- module-level persisted ACL rows as a separate permission entity

## Open Follow-Up Notes

- if the frontend universal table contract remains `/api/admin/...`, it needs a follow-up sync to the canonical `/app/admin/...` route family
- the current frontend proving document still contains old inspection-style field ids and example rows; frontend integration must switch to the real module-registry field catalog returned by backend meta
- secure admin API routes now use explicit backend `/app/...` paths; API Gateway should preserve that canonical family instead of rewriting it away
- endpoint authorization in Phase 5 should build on the existing auth context and admin principal model rather than inventing a second identity layer
