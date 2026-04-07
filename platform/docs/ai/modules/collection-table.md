# Module Memory — Collection Table

Status: active
Date: 2026-04-06

## Read this when

- changing the universal table runtime
- changing collection-table field, column, row-layout, search, filter, selection, or action contracts
- changing collection-table state persistence, suggestion caching, or adapter boundaries
- planning or executing cross-app adoption or boundary changes for the shared frontend package
- evaluating whether a new screen should consume collection-table

## What this domain is

`Collection Table` is its own frontend/runtime domain.
It is **not** owned by `Module registry`.

Current role:

- the universal runtime/page host now lives in `platform/frontend/packages/collection-table`
- current real proving surfaces are the admin `Module registry / List` page and `Employees / List of Employees`
- admin app pages stay thin and host-owned for route wiring, access/session handling, and transport prefixes
- the next proof target is cross-app reuse, not another admin-local extraction step

## Current confirmed proving surface

Frontend package:

- `platform/frontend/packages/collection-table`

Frontend pages:

- `platform/frontend/apps/platform-admin-web/src/pages/modules-list/page.tsx`
- `platform/frontend/apps/platform-admin-web/src/pages/employees-list/page.tsx`

Package runtime/helpers:

- `platform/frontend/packages/collection-table/src/collection-table-contract.ts`
- `platform/frontend/packages/collection-table/src/collection-table-runtime.ts`
- `platform/frontend/packages/collection-table/src/collection-table-state.ts`
- `platform/frontend/packages/collection-table/src/collection-table-render.tsx`
- `platform/frontend/packages/collection-table/src/collection-table-page.tsx`
- `platform/frontend/packages/collection-table/src/collection-page-surface.tsx`

App-host transport/helpers:

- `platform/frontend/apps/platform-admin-web/src/shared/admin-collection-table-client.ts`
- `platform/frontend/apps/platform-admin-web/src/shared/admin-collection-table-page.tsx`
- `platform/frontend/apps/platform-admin-web/src/shared/admin-navigation-refresh.tsx`

Backend shared helpers already exist for the generic query/filter/sort/export side:

- `platform/backend/modules/shared/collectiontable`
- `platform/backend/modules/shared/collectionprefs`

## Locked invariants

- collection-table is a reusable runtime/UI concern, not a screen-specific business module
- `Module registry` is a proving surface, not the owner of the collection-table contract
- route-specific toolbar behavior, navigation, and page-owned actions stay in app code
- shared collection-table code must not import app code
- package/runtime boundary must preserve the split between:
  - generic runtime/state/render contract
  - host-page adapter / transport layer
  - route-specific page composition
- post-favorite host side effects must stay behind a generic callback seam; the shared runtime must not know admin navigation refresh behavior
- backend-facing URLs and page navigation must stay host-owned, not hardcoded inside the shared runtime
- package name and path are now locked as `@platform/collection-table`

## Current confirmed consumer matrix

Confirmed real consumers:

- admin app `Module registry / List`
- admin app `Employees / List of Employees`

Current extraction state:

- second real consumer now exists inside the admin app
- package extraction is complete for the frontend runtime/page host
- cross-app reuse is still the preferred next proof before broader stabilization

## Required shared capability backlog

These capabilities must still be designed and implemented as shared `collection-table` features across frontend and backend:

- XLS export
- row action `view`
- row action `pdf`

Important constraint:

- these capabilities are optional per consumer surface
- not every table must enable them
- but the shared runtime, adapter contract, backend route pattern, and host wiring model must support them as first-class opt-in capabilities

Current expectation:

- frontend package support and backend shared-service support should converge on the same capability model
- feature-specific tables may expose only the subset they need
- do not hardcode these capabilities into one admin screen as if that screen owns the contract

## Current gates

After extraction into the shared package, keep these gates explicit:

1. Stable runtime contract
- field catalog, column layout, quick filters, pagination, selection, row actions, saved filters, favorites, and export shape are stable enough for reuse
- XLS export plus opt-in `view` and `pdf` actions still need shared FE/BE completion before the broader capability set can be treated as fully mature

2. Host/runtime separation
- app-specific toolbar composition, route handlers, and URL knowledge are outside the generic runtime

3. Real reuse proof
- a second real screen or app consumes the runtime without forcing page-specific hacks back into the shared layer

4. Test coverage
- runtime/state behavior has focused tests beyond typecheck only

5. Cross-app adoption approval
- new consumers must still align with `platform/frontend/docs/package-boundaries.md`

## Canonical docs

- `platform/frontend/docs/collection-table-runtime-contract.md`
- `platform/frontend/docs/package-boundaries.md`

## Supporting docs

- `platform/frontend/docs/collection-table-shared-readiness-plan.md`
- `platform/frontend/docs/collection-table-backend-integration-contract.md`

## Common failure modes

- treating the current admin proving surface as if it defines all future consumers
- pushing route-specific toolbar or navigation logic into generic runtime code
- treating package extraction as if it automatically solved admin/tenant transport or access semantics
- letting a page-specific backend contract become the universal table contract
- shipping `export-xls`, `view`, or `pdf` as screen-local hacks instead of shared opt-in capabilities
- mutating the universal runtime to satisfy only one admin screen instead of preserving generic seams

## When to update memory

Update this file when:

- a new real consumer starts using collection-table
- cross-app adoption gates change
- shared/runtime versus host-page responsibilities change
- the shared capability backlog for `export-xls`, `view`, or `pdf` changes status
- package path or exports change
