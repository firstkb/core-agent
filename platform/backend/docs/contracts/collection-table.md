# Backend Collection Table Contract

Status: active
Owner: backend
Last audited: 2026-04-25
Canonical scope: backend shared collection table DTOs, query helpers, preferences, and current admin collection table endpoint families

This contract defines the backend side of the generic Collection Table model.
It is separate from Module Registry, Employees, and Tenant List business ownership.

Read with:

- `platform/backend/docs/contracts/admin-control-plane.md`
- `platform/backend/docs/contracts/admin-module-registry.md`

## Core Invariants

- Backend Collection Table helpers are shared infrastructure, not a product module.
- Shared DTOs and validators live in `platform/backend/modules/shared/collectiontable`.
- Shared favorite and saved-filter persistence lives in `platform/backend/modules/shared/collectionprefs`.
- Surface modules own business queries, access checks, action semantics, and route registration.
- A surface id is the stable key for favorite and saved-filter persistence.
- Current admin collection table surfaces are root-only.
- Non-root collection-table visibility or actions require an explicit future access-policy decision.
- Module Registry is a consumer of this contract, not the owner of it.

## Current Backend Surfaces

Shared modules:

- `platform/backend/modules/shared/collectiontable`
- `platform/backend/modules/shared/collectionprefs`

Admin consumers:

- `platform/backend/modules/admin/moduleregistrylist`
- `platform/backend/modules/admin/employeeslist`
- `platform/backend/modules/admin/tenantlist`

Route wiring:

- `platform/backend/cmd/api-admin/internal/server/routes_module_registry_list.go`
- `platform/backend/cmd/api-admin/internal/server/routes_employees_list.go`
- `platform/backend/cmd/api-admin/internal/server/routes_tenant_list.go`

## Current Surface Matrix

| Surface id | Backend module | Route prefix | Current access | Notes |
| --- | --- | --- | --- | --- |
| `module-registry.list` | `moduleregistrylist` | `/app/admin/module-registry/list` | root-only | Supports list/query/search/preferences, bulk actions, row-action route, and export route; XLS/PDF are not complete generic capabilities. |
| `employees.list` | `employeeslist` | `/app/admin/employees/list` | root-only | Supports list/query/search/preferences and bulk actions; edit is frontend navigation. |
| `tenant.list` | `tenantlist` | `/app/admin/tenants/list` | root-only | Supports list/query/search/preferences and backend row action `open_as_root`. |

## Standard Endpoint Family

Collection table consumers may expose:

- `GET <prefix>/meta`
- `POST <prefix>/query`
- `GET <prefix>/search-suggestions`
- `POST <prefix>/favorite/toggle`
- `POST <prefix>/saved-filters`
- `DELETE <prefix>/saved-filters/{savedFilterId}`
- optional `POST <prefix>/bulk-actions/{actionId}`
- optional `POST <prefix>/row-actions/{actionId}`
- optional `POST <prefix>/export-xls`

Each route id stays owned by the concrete runtime route file.
Each access check stays owned by the concrete surface service and the admin route policy.

## Shared DTO Boundary

`collectiontable` owns shared JSON DTO shapes for:

- metadata response
- field definitions
- column definitions
- row layout
- actions metadata
- row actions
- selection metadata
- bulk actions
- saved filter sets
- query request
- quick filters
- sort request
- query response
- rows and cells
- search suggestions
- favorite toggle response
- saved-filter creation input
- mutation/action result
- export request

Surface modules may alias these types but must not fork incompatible payload shapes.

## Query Rules

Backend shared helpers validate:

- query request shape
- quick-filter operators
- sortable fields
- page size normalization
- total page count
- search suggestion compatibility
- export payload basics

Current page size baseline is:

- `25`
- `50`
- `100`

Quick-filter semantics:

- repeated `contains` filters on the same field are treated as an OR group
- different fields or non-grouped filters are combined as AND constraints
- invalid field ids or unsupported operators reject the query

## Preference Rules

`collectionprefs` owns generic persistence operations for:

- loading favorite state and saved filters
- toggling favorite state
- creating saved filters
- deleting saved filters

Rules:

- preferences are scoped by principal id and surface id
- saved filter label is required
- saved filter quick filters must validate through `collectiontable`
- favorite toggle returns the effective favorite state
- deleting a saved filter requires a non-empty saved filter id

Current admin persistence uses:

- `admin_collection_favorite`
- `admin_collection_saved_filter`

## Action Rules

- Action ids are surface-owned.
- Backend must execute only action ids supported by that surface.
- A frontend should execute only actions declared by metadata and supported by its adapter.
- Bulk action input includes current query and selected row ids.
- Row action input includes row id.
- Mutation results can expose `ok`, `downloadUrl`, `launchUrl`, and `openIn`.
- XLS export and PDF row actions are optional capabilities, not generic requirements.

## Frontend Companion

Frontend runtime/package behavior is documented in:

- `platform/frontend/docs/contracts/collection-table.md`

## Out Of Scope

- Module Registry management/grant semantics
- Employees detail/update semantics
- delegated tenant root authentication internals
- admin navigation projection
- generic tenant-app rollout
- XLS generation implementation
- PDF Builder and Report Builder product tools
