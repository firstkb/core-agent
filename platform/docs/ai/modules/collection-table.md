# Module Memory — Collection Table

Status: active
Date: 2026-04-05

## Read this when

- changing the universal table runtime
- changing collection-table field, column, row-layout, search, filter, selection, or action contracts
- changing collection-table state persistence, suggestion caching, or adapter boundaries
- planning or executing promotion from app-local proving surface into a shared frontend package
- evaluating whether a new screen should consume collection-table

## What this domain is

`Collection Table` is its own frontend/runtime domain.
It is **not** owned by `Module registry`.

Current role:

- the table is being proven inside `platform-admin-web`
- the current real proving surface is the admin `Module registry / List` page
- the long-term direction is promotion into a shared frontend package only after reuse is proven and boundaries are stable

## Current confirmed proving surface

Frontend page:

- `platform/frontend/apps/platform-admin-web/src/pages/modules-list/page.tsx`

App-local runtime/helpers:

- `platform/frontend/apps/platform-admin-web/src/shared/collection-table-contract.ts`
- `platform/frontend/apps/platform-admin-web/src/shared/collection-table-runtime.ts`
- `platform/frontend/apps/platform-admin-web/src/shared/collection-table-state.ts`
- `platform/frontend/apps/platform-admin-web/src/shared/collection-table-render.tsx`

Backend shared helpers already exist for the generic query/filter/sort/export side:

- `platform/backend/modules/shared/collectiontable`
- `platform/backend/modules/shared/collectionprefs`

## Locked invariants

- collection-table is a reusable runtime/UI concern, not a screen-specific business module
- `Module registry` is the current proving surface, not the owner of the collection-table contract
- route-specific toolbar behavior, navigation, and page-owned actions stay in app code until extraction is approved
- shared collection-table code must not import app code
- package promotion must happen only after at least one additional real consumer or equivalent reuse proof exists
- package promotion must preserve the split between:
  - generic runtime/state/render contract
  - host-page adapter / transport layer
  - route-specific page composition
- backend-facing URLs and page navigation must stay host-owned, not hardcoded inside the shared runtime
- package name and final package path are not locked yet; do not invent them implicitly

## Current confirmed consumer matrix

Confirmed real consumer:

- admin app `Module registry / List`

Planned direction:

- second real consumer before shared extraction
- likely cross-app reuse once contracts are stable

Do not write memory as if the second consumer already exists.

## Extraction gates

Before promotion into a shared package, keep these gates explicit:

1. Stable runtime contract
- field catalog, column layout, quick filters, pagination, selection, row actions, saved filters, favorites, and export shape are stable enough for reuse

2. Host/runtime separation
- app-specific toolbar composition, route handlers, and URL knowledge are outside the generic runtime

3. Real reuse proof
- a second real screen or app consumes the runtime without forcing page-specific hacks back into the shared layer

4. Test coverage
- runtime/state behavior has focused tests beyond typecheck only

5. Package-boundary approval
- extraction is aligned with `platform/frontend/docs/package-boundaries.md`

## Canonical docs

- `platform/frontend/docs/collection-table-runtime-contract.md`
- `platform/frontend/docs/package-boundaries.md`

## Supporting docs

- `platform/frontend/docs/collection-table-shared-readiness-plan.md`
- `platform/frontend/docs/collection-table-backend-integration-contract.md`

## Common failure modes

- treating the current admin proving surface as if it defines all future consumers
- pushing route-specific toolbar or navigation logic into generic runtime code
- promoting to a package before a second real consumer proves the boundary
- letting a page-specific backend contract become the universal table contract
- mutating the universal runtime to satisfy only one admin screen instead of preserving generic seams

## When to update memory

Update this file when:

- a new real consumer starts using collection-table
- extraction gates change
- shared/runtime versus host-page responsibilities change
- collection-table becomes a real package or the approved package target is locked
