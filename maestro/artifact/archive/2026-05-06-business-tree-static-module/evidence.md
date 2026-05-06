# Evidence

- Work ID: `2026-05-06-business-tree-static-module`
- Shape: implementation evidence log

## Summary

Implemented the first tenant static module slice for Business Tree:

- backend tenant `businesstree` service/repository/handler with lazy JSON nodes;
- secure tenant API route `GET /app/modules/business-tree/nodes`;
- direct tenant-web route `/app/modules/business-tree`;
- UI Kit TreeView lazy branch contract via `expandable`, `loading`, `error`,
  and `onItemExpand`;
- api-client Business Tree client and tests.
- Follow-up UI adjustment removed `Reference Manager` from the shell/page and
  changed the Business Tree panel to desktop full-height with inner scroll,
  while mobile uses natural content height and page scroll.
- Durable memory now records the Business Tree static module and its planned
  follow-ups for future Navigation Builder work.

## Commands / Checks

| Check | Status | Evidence | Notes |
|---|---|---|---|
| `go test ./modules/tenant/businesstree ./cmd/api-tenant/internal/server` | passed | local shell | Service tests pass; api-tenant server package compiles. |
| `pnpm --filter @platform/api-client test` | passed | local shell | 11 Vitest tests passed. |
| `PATH="<bundled-node>:$PATH" pnpm --filter @platform/api-client typecheck` | passed | local shell | TypeScript check passed under bundled Node 22. |
| `PATH="<bundled-node>:$PATH" pnpm --filter @platform/ui-kit typecheck` | passed | local shell | TypeScript check passed under bundled Node 22. |
| `PATH="<bundled-node>:$PATH" pnpm --filter @platform/tenant-web typecheck` | passed | local shell | TypeScript check passed under bundled Node 22. |
| `PATH="<bundled-node>:$PATH" pnpm --filter @platform/platform-admin-web typecheck` | passed | local shell | UI Lab docs compile. |
| `PATH="<bundled-node>:$PATH" pnpm --filter @platform/tenant-web lint` | passed | local shell | ESLint passed. |
| `PATH="<bundled-node>:$PATH" pnpm --filter @platform/ui-kit lint` | passed | local shell | ESLint passed. |
| `PATH="<bundled-node>:$PATH" pnpm --filter @platform/api-client lint` | passed | local shell | ESLint passed. |
| `PATH="<bundled-node>:$PATH" pnpm --filter @platform/tenant-web build:dev` | passed | local shell | Vite dev build passed; emitted standard chunk-size warning. |
| `PATH="<bundled-node>:$PATH" pnpm --filter @platform/tenant-web typecheck` | passed | local shell | Re-run after responsive panel adjustment. |
| `PATH="<bundled-node>:$PATH" pnpm --filter @platform/tenant-web build:dev` | passed | local shell | Re-run after responsive panel adjustment; emitted standard chunk-size warning. |
| `scripts/preflight.sh` | passed | local shell | Lite preflight passed: docs memory, env policy, runtime drift. |
| local PostgreSQL read-only transaction with `set_config('app.tenant_id', ...)` | passed | local shell | Confirmed no error in read-only transaction pattern; initial sandbox attempt was blocked, rerun with approval. |

## Changed Files

- `maestro/artifact/archive/2026-05-06-business-tree-static-module/work.md`
- `maestro/artifact/archive/2026-05-06-business-tree-static-module/evidence.md`
- `maestro/artifact/archive/2026-05-06-business-tree-static-module/closeout.md`
- `maestro/memory/modules/frontend/tenant-web/README.md`
- `maestro/memory/durable/current-state.md`
- `maestro/memory/durable/module-index.md`
- `maestro/memory/durable/repo-map.md`
- `maestro/memory/index/read-routes.yaml`
- `platform/backend/cmd/api-tenant/internal/server/bootstrap.go`
- `platform/backend/cmd/api-tenant/internal/server/routes.go`
- `platform/backend/cmd/api-tenant/internal/server/routes_business_tree.go`
- `platform/backend/cmd/api-tenant/internal/server/server.go`
- `platform/backend/cmd/api-tenant/internal/server/wiring_business_tree.go`
- `platform/backend/modules/tenant/businesstree/*`
- `platform/frontend/apps/platform-admin-web/src/internal/ui-lab/panels/navigation-primitives.tsx`
- `platform/frontend/apps/tenant-web/src/app/app.tsx`
- `platform/frontend/apps/tenant-web/src/features/static-modules/*`
- `platform/frontend/apps/tenant-web/src/locales/en.ts`
- `platform/frontend/apps/tenant-web/src/locales/es.ts`
- `platform/frontend/apps/tenant-web/src/shared/navigation.ts`
- `platform/frontend/packages/api-client/src/index.ts`
- `platform/frontend/packages/api-client/src/index.test.ts`
- `platform/frontend/packages/ui-kit/src/components/tree-view/tree-view.tsx`
- `platform/frontend/packages/ui-kit/src/styles/tree-view.css`

## Browser / Visual Evidence

- Tenant dev server is running at `http://127.0.0.1:3202/`.
- Direct route to try: `http://127.0.0.1:3202/app/modules/business-tree`.
- Automated visual route smoke was not completed in this pass because tenant
  app access is behind the current auth flow; build/typecheck evidence covers
  compilation and route registration.

## Review Evidence

- Inline self-review of scoped diff after checks.

## Skipped Checks

- Full repository preflight: not run; lite preflight is the repository default
  required check for this slice.
- Automated authenticated browser smoke: not run; requires an authenticated
  tenant session.

## Residual Risks

- Business Tree data volume was not validated against a large tenant dataset.
- Navigation Builder permission integration is intentionally deferred and marked
  with TODOs at route/service boundary.
- Parent company existence validation for `contacts:*` and `projects:*` lazy
  parents is a recorded follow-up.
