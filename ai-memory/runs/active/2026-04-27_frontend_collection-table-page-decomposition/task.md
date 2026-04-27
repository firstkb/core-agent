# Task: Collection Table Page Decomposition

Status: active
Route: FE_ONLY run-backed
Owner: Atlas inline

## Goal

Reduce `@platform/collection-table` monolith risk by extracting small, behavior-preserving units from `platform/frontend/packages/collection-table/src/collection-table-page.tsx`.

## Locked Invariants

- Frontend package-only work under `platform/frontend/packages/collection-table`.
- Preserve the public `@platform/collection-table` exports and host adapter contract.
- Do not hardcode app routes, backend URLs, auth/session behavior, or navigation rules into the package.
- Do not change query/filter/sort/search/favorite/saved-filter semantics.
- Do not touch backend or app host behavior unless a type-level integration seam requires it.

## First Slice Plan

- Extract presentational toolbar/search/saved-filter dialog/bulk bar units from `collection-table-page.tsx`.
- Keep state, adapter calls, route navigation, mutation handlers, and load/query orchestration in the page.
- Add focused package-local component/helper files only; no cross-package abstraction.

## Required Checks

- `pnpm --filter @platform/collection-table typecheck`
- `pnpm --filter @platform/platform-admin-web typecheck`
- `pnpm --filter @platform/tenant-web typecheck`
- `scripts/ai/preflight.sh` if practical
- `git diff --check`
