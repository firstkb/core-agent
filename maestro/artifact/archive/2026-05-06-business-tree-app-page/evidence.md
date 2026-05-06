# Evidence

- Work ID: `2026-05-06-business-tree-app-page`
- Shape: implementation evidence log

## Summary

Implemented Business Tree as a tenant app page:

- backend tenant `apppages/businesstree` service/repository/handler with lazy
  JSON nodes;
- secure tenant API route `GET /app/pages/business-tree/nodes`;
- direct tenant-web route `/app/pages/business-tree`;
- UI Kit TreeView lazy branch contract via `expandable`, `loading`, `error`,
  and `onItemExpand`;
- api-client Business Tree client and tests;
- memory updated to prevent confusion between app pages and product modules.

## Commands / Checks

| Check | Status | Evidence | Notes |
|---|---|---|---|
| `go test ./modules/tenant/apppages/businesstree ./cmd/api-tenant/internal/server` | passed | local shell | Service tests pass; api-tenant server package compiles. |
| `pnpm --filter @platform/api-client test` | passed | local shell | 11 Vitest tests passed. |
| `PATH="<bundled-node>:$PATH" pnpm --filter @platform/api-client typecheck` | passed | local shell | TypeScript check passed under bundled Node 22. |
| `PATH="<bundled-node>:$PATH" pnpm --filter @platform/api-client lint` | passed | local shell | ESLint passed. |
| `PATH="<bundled-node>:$PATH" pnpm --filter @platform/tenant-web typecheck` | passed | local shell | TypeScript check passed under bundled Node 22. |
| `PATH="<bundled-node>:$PATH" pnpm --filter @platform/tenant-web lint` | passed | local shell | ESLint passed. |
| `PATH="<bundled-node>:$PATH" pnpm --filter @platform/tenant-web build:dev` | passed | local shell | Vite dev build passed; emitted standard chunk-size warning. |
| `git diff --check` | passed | local shell | No whitespace errors. |
| `scripts/preflight.sh` | passed | local shell | Lite preflight passed: docs memory, env policy, runtime drift. |

## Changed Areas

- `maestro/memory/**`
- `maestro/artifact/archive/2026-05-06-business-tree-app-page/*`
- `platform/backend/cmd/api-tenant/internal/server/*app_pages*`
- `platform/backend/modules/tenant/apppages/businesstree/*`
- `platform/frontend/apps/tenant-web/src/features/app-pages/business-tree/*`
- `platform/frontend/apps/tenant-web/src/shared/navigation.ts`
- `platform/frontend/packages/api-client/src/index.ts`
- `platform/frontend/packages/api-client/src/index.test.ts`

## Residual Risks

- Business Tree data volume was not validated against a large tenant dataset.
- Navigation Builder page permission integration is intentionally deferred and
  marked with TODOs at route/service boundary.
