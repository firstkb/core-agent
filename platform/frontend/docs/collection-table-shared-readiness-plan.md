# Collection Table Shared Readiness Plan

Working plan for the universal collection-table preset before:

- first real backend integration
- promotion into a shared frontend module

This document is execution-oriented. The live product/runtime contract remains:

- `collection-table-runtime-contract.md`

## Goal

Reach a state where the collection table can:

- connect to one real backend surface without rewriting the view layer
- survive a second real use-case in another surface
- then move into a shared module with stable boundaries

## Current Snapshot

Current state is strong in UI behavior, but not yet ready for shared extraction.

What is already strong:

- fixed-height desktop table card and mobile fallback
- sticky table header
- bulk selection and bulk action bar
- dynamic smart search bar
- full-width secondary row support
- app-local split between:
  - render contract
  - backend-facing DTO/adapter contract
  - reusable persistence/query-state helper
- row-action split:
  - desktop inline buttons
  - mobile overflow menu
- session-scoped table-state restore/reset
- page-owned adapter direction is implemented in code

What is still provisional:

- adapter is still mock-backed inside the proving page, not connected to a real backend surface
- meta -> render mapping and built-in cell renderers still live inside `modules-list/page.tsx`
- `CollectionPageSurface` and its styling are still admin-app specific
- toolbar composition and navigation reset are still admin-app specific
- only one real proving surface exists

## Target End State

Before shared extraction, the system should be split into four clear layers:

1. Data contract
- backend payload shapes for `meta`, `query`, mutations

2. Host page adapter
- page-owned operations:
  - `loadMeta`
  - `query`
  - `runBulkAction`
  - `toggleFavorite`
  - `exportXls`
  - `savedFilters`
  - row-level actions like `pdf`

3. Shared table runtime
- generic state handling
- generic rendering
- generic persistence hook/helpers

4. Host page composition
- route-specific toolbar choices
- route-specific action wiring
- route-specific navigation and reset behavior

## Phase 1: Prepare For First Real Backend

Goal:

- connect one real backend surface with minimal rework

### 1. Finalize Data Contract

Required work:

- finalize `meta` payload shape
- finalize `query` request/response shape
- finalize `rowActions` metadata
- finalize `bulkActions` metadata
- finalize `savedFilterSets` payload shape
- finalize `favorite` payload shape
- finalize `html` field safety rule

Acceptance:

- contract examples in `collection-table-runtime-contract.md` are internally consistent
- no duplicate sources of truth for search fields, operators, or columns

### 2. Normalize Search Runtime

Required work:

- keep one shared field catalog as the source of truth
- move quick-filter request shape closer to backend DTO shape
- remove leftover divergence between:
  - `CollectionPageState`
  - `appliedQuickFilters`
  - adapter query input

Acceptance:

- one normalized search/filter state model exists
- adapter can serialize current table state into one backend query payload without page-specific hacks

### 3. Finish Host Page Adapter

Required work:

- implement the full adapter shape in code, not just `loadMeta/query`
- make `Reload`, `Export XLS`, `Favorite`, `Saved filters`, `Bulk actions`, and `PDF` all flow through adapter-owned functions
- remove assumptions that these actions are mock-only

Acceptance:

- shared runtime calls adapter operations only
- host page owns backend route knowledge

### 4. Confirm Persistence Model

Required work:

- keep `sessionStorage + tableId + reset=1`
- move persistence into a reusable helper
- document which state is persisted and which is not

Acceptance:

- list -> edit -> back restores state
- sidebar/breadcrumb returns clean default state
- persistence logic is not hardcoded only for `modules/list`

## Phase 2: Stabilize Shared Runtime Boundaries

Goal:

- make the runtime technically extractable

### 5. Split App Composition From Shared Runtime

Required work:

- separate current app-local render contract from generic shared runtime contract
- stop using one type layer for both:
  - app render callbacks
  - backend/runtime DTO ideas

Suggested split:

- `collection-table-contract`
  - DTO-style types
- `collection-table-runtime`
  - generic state/runtime helpers
- app page
  - route-specific renderer wiring

Acceptance:

- shared layer no longer depends on app-local row types or labels
- no backend-facing type contains React render callbacks

### 6. Make Surface Generic

Required work:

- move admin-specific wording and CSS expectations out of the surface where possible
- keep only generic built-in locale ids in the runtime
- keep route-specific toolbar composition out of the shared layer

Acceptance:

- `CollectionPageSurface` can render another list without assuming `admin-web` product wording

### 7. Add Runtime Tests

Required work:

- add tests for operator derivation by field type
- add tests for quick-filter token creation
- add tests for full-width secondary rows
- add tests for row selection clearing on page/sort/filter change
- add tests for persistence restore/reset
- add tests for mobile row-action collapse logic where feasible

Acceptance:

- critical runtime behavior is covered beyond `typecheck`

## Phase 3: Prove Reuse

Goal:

- validate the runtime in a second real surface before extraction

### 8. Integrate First Real Backend Page

Preferred first target:

- current `Module registry / List` proving page

Required work:

- replace mock adapter responses with real backend calls
- confirm real backend metadata can drive:
  - fields
  - columns
  - row actions
  - saved filters
  - bulk actions

Acceptance:

- no view-layer rewrite needed for first backend hookup

### 9. Integrate Second Real Consumer

Required work:

- add a second table surface in:
  - another admin list page
  - or tenant app
- reuse the same runtime rules and adapter pattern

Acceptance:

- second consumer does not require changing the shared runtime contract in a breaking way

## Phase 4: Extract To Shared Module

Goal:

- promote only the stable runtime

### 10. Extract Shared Package/Module

Extract only:

- runtime types
- table surface
- search/filter runtime helpers
- persistence helper
- adapter interfaces

Do not extract:

- page-specific toolbar business choices
- route-specific navigation
- app-specific mock/demo data
- page-specific action labels that belong to domain/backend

Acceptance:

- shared runtime is used by at least two surfaces
- host pages only provide:
  - adapter
  - table id
  - route-specific toolbar composition

## Recommended Work Order

1. implement first real backend integration on top of the new adapter contract
2. move meta -> render mapping out of the page and into a reusable app-local runtime layer
3. add runtime tests
4. integrate second real consumer
5. extract shared module

## Extraction Gate

Do not promote into shared until all are true:

- first real backend integration is complete
- second real consumer exists
- adapter contract is implemented in code
- state model is unified
- persistence is generic
- runtime behavior has test coverage
- no admin-page-specific assumptions remain inside the extracted layer

## Immediate Next Tasks

These are the highest-value next steps from the current state:

1. Replace the mock adapter implementation in `modules-list/page.tsx` with one real backend surface without changing the toolbar/search/selection runtime contract

2. Move the generic row/cell render mapping out of `modules-list/page.tsx` into an app-local runtime module so the page keeps only host composition concerns

3. Reduce admin-specific assumptions inside `CollectionPageSurface` and its CSS so the extractable layer stops depending on `admin-web__*` styling

4. Add runtime tests for:
- operator derivation
- quick-filter creation/removal
- persistence restore/reset
- bulk-selection clearing on query changes
