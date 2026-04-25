# Collection Table Contract

Status: active compact contract

## Invariants

- Collection Table is a reusable runtime/UI concern, not a screen-specific business module.
- Module Registry, Employees, and Tenants are consumers/proving surfaces, not owners of the generic contract.
- Shared collection-table code must not import app code.
- Backend-facing URLs and page navigation stay host-owned.
- Route-specific toolbar behavior, navigation, and page-owned actions stay in app code.
- Host side effects, such as admin navigation refresh after favorite changes, must stay behind generic callback seams.
- Package name/path is `@platform/collection-table`.
- Active tracked contracts are `platform/frontend/docs/contracts/collection-table.md` and `platform/backend/docs/contracts/collection-table.md`.

## Boundary Split

Generic runtime/package owns:

- table metadata contract
- runtime state shape
- render shell and common table interactions
- field, column, search, quick-filter, pagination, selection, and row-action primitives
- saved filter and favorite UI/runtime integration

Host app owns:

- endpoint URLs and transport prefix
- auth/session handling
- route-specific toolbar composition
- route navigation
- consumer-specific actions
- post-action side effects

Backend owns:

- shared DTOs and validators under `platform/backend/modules/shared/collectiontable`
- shared favorite and saved-filter persistence under `platform/backend/modules/shared/collectionprefs`
- table-specific services
- query/filter/sort semantics
- search suggestions
- saved filter/favorite persistence
- export/action endpoints where supported

## Current Consumers

- `module-registry.list`
- `employees.list`
- `tenant.list`

## Current Required Capability Backlog

Shared optional capabilities still need FE/BE completion:

- XLS export
- row action `view`
- row action `pdf`

These capabilities are opt-in per surface, not mandatory for every table.
