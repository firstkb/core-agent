# Frontend Collection Table Contract

Status: active
Owner: frontend
Last audited: 2026-04-25
Canonical scope: `@platform/collection-table` runtime package, host adapter boundary, and frontend-facing collection table data contract

This contract defines the current frontend Collection Table model.
It supersedes the old root collection-table runtime and backend-integration docs.

## Core Invariants

- Collection Table is a reusable runtime package, not a screen-specific business module.
- The shared package is `@platform/collection-table`.
- Package source lives in `platform/frontend/packages/collection-table`.
- Shared package code must not import app code.
- Shared package code must not hardcode admin routes, backend URLs, auth/session logic, or navigation behavior.
- App hosts own endpoint mapping, auth/session, route navigation, and post-action side effects.
- Module Registry, Employees, and Tenants are current admin-app consumers, not owners of the generic contract.
- Current app strategy is online web first; do not add offline/PWA/mobile assumptions to this runtime without an explicit product decision.

## Current Frontend Surfaces

Shared package:

- `platform/frontend/packages/collection-table/src/collection-table-contract.ts`
- `platform/frontend/packages/collection-table/src/collection-table-page.tsx`
- `platform/frontend/packages/collection-table/src/collection-table-runtime.ts`
- `platform/frontend/packages/collection-table/src/collection-table-state.ts`

Admin app host adapter:

- `platform/frontend/apps/platform-admin-web/src/shared/admin-collection-table-client.ts`
- `platform/frontend/apps/platform-admin-web/src/shared/admin-collection-table-page.tsx`

Current admin consumers:

- Module Registry: table id `module-registry.list`, path prefix `/app/admin/module-registry/list`
- Employees: table id `employees.list`, path prefix `/app/admin/employees/list`
- Tenants: table id `tenant.list`, path prefix `/app/admin/tenants/list`

## Generic Runtime Owns

- metadata-driven table shell
- field, column, row, cell, search, quick-filter, sort, pagination, and selection types
- runtime state creation, restoration, normalization, and query request projection
- session-scoped table state under `collection-table-state:<tableId>`
- session-scoped search suggestions under `collection-table-suggestions:<tableId>`
- quick-filter UI behavior
- repeated `contains` quick filters on the same field as one OR group
- AND semantics across different quick-filter groups
- saved filter UI/runtime integration
- favorite UI/runtime integration
- row-action and bulk-action primitives
- optional create, reload, export, and row-action affordances when metadata and host adapter support them

## Host App Owns

- endpoint path prefix
- API base URL resolution
- access-token retrieval
- unauthorized/session-expired handling
- backend envelope parsing
- route-specific create navigation
- frontend row-action path resolution
- backend row-action launch/download behavior
- admin shell refresh after favorite changes
- consumer-specific toolbar or page composition outside the generic runtime

Admin host favorite behavior:

- The package exposes a generic success callback seam.
- `platform-admin-web` uses that seam to refresh `GET /app/me/navigation` after successful favorite toggles.
- The package must not know about admin navigation.

## Frontend Adapter Contract

The shared package receives a `CollectionTableAdapter` with these operations:

- `loadMeta`
- `query`
- optional `loadSearchSuggestions`
- optional `createSavedFilterSet`
- optional `deleteSavedFilterSet`
- optional `toggleFavorite`
- optional `runBulkAction`
- optional `runRowAction`
- optional `exportXls`

Admin app creates this adapter through `createAdminCollectionTableClient` and `createAdminCollectionTableAdapter`.

## Standard Endpoint Family

For a host-owned path prefix, the current admin adapter expects:

- `GET <pathPrefix>/meta`
- `POST <pathPrefix>/query`
- `GET <pathPrefix>/search-suggestions`
- `POST <pathPrefix>/favorite/toggle`
- `POST <pathPrefix>/saved-filters`
- `DELETE <pathPrefix>/saved-filters/{savedFilterId}`
- optional `POST <pathPrefix>/bulk-actions/{actionId}`
- optional `POST <pathPrefix>/row-actions/{actionId}`
- optional `POST <pathPrefix>/export-xls`

The generic package does not own the HTTP transport.
It only consumes the adapter result types.

## Metadata Contract

`CollectionTableMetaResponse` defines:

- `surfaceId`
- `title`
- optional `search`
- optional `defaultSort`
- `fields`
- `columns`
- optional `rowLayout`
- optional `actions`
- optional `rowActions`
- optional `selection`
- optional `bulkActions`
- optional `pageSizeOptions`
- optional `savedFilterSets`

Supported field types:

- `badge`
- `boolean`
- `date`
- `date_time`
- `html`
- `text`

Supported search operators:

- `contains`
- `is_empty`
- `is_equal_to`
- `is_greater_or_equal_to`
- `is_greater_than`
- `is_less_or_equal_to`
- `is_less_than`
- `is_not_empty`
- `is_not_equal_to`

## Query Contract

`CollectionTableQueryRequest` includes:

- `filters`
- `page`
- `pageSize`
- `presetId`
- `quickFilters`
- `sort`

`CollectionTableQueryResponse` includes:

- `page`
- `pageSize`
- `rows`
- `totalItems`
- `totalPages`

Rows are keyed by stable row id.
Cells are keyed by field id and can expose raw `value`, optional `displayValue`, optional `label`, optional `tone`, or optional `html`.

## Action Rules

- Row actions are metadata-driven.
- Frontend row actions use host-owned route resolution.
- Backend row actions go through the host adapter.
- Bulk actions go through the host adapter and are opt-in per surface.
- XLS export is opt-in per surface and must not be assumed just because the generic runtime supports an adapter seam.
- A surface should advertise only actions it can currently execute safely.

## Current Capability Matrix

| Surface | Consumer | Bulk actions | Frontend row actions | Backend row actions | Export XLS |
| --- | --- | --- | --- | --- | --- |
| `module-registry.list` | Module Registry | supported | `edit` | route exists, no generic `pdf` capability yet | route exists, XLS generation not complete |
| `employees.list` | Employees | supported | `edit` | not current | not current |
| `tenant.list` | Tenants | not current | not current | `open_as_root` | not current |

## Backend Companion

Backend shared DTOs, validation helpers, preferences, and current admin surface endpoints are documented in:

- `platform/backend/docs/contracts/collection-table.md`

## Out Of Scope

- Module Registry module/section management and grants
- admin route authorization policy
- tenant-side generic collection-table rollout
- offline/PWA/local-sync persistence
- full PDF Builder behavior
- full Report Builder behavior
