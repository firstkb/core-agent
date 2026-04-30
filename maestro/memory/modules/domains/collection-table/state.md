# Collection Table State

Status: active compact state

## Landed

- `@platform/collection-table` exists under `platform/frontend/packages/collection-table`.
- Module Registry list consumes the shared package.
- Employees list consumes the shared package.
- Tenant list consumes the shared package.
- Admin app pages stay thin host-owned wrappers.
- Backend shared helpers exist under `platform/backend/modules/shared/collectiontable` and `platform/backend/modules/shared/collectionprefs`.
- Quick-filter semantics support implicit OR groups for repeated `contains` filters on the same field, with AND across remaining filter groups.
- Active tracked contracts now live at `platform/frontend/docs/contracts/collection-table.md` and `platform/backend/docs/contracts/collection-table.md`.

## Planned / Backlog

- Shared FE/BE support for XLS export.
- Shared FE/BE support for row action `view`.
- Shared FE/BE support for row action `pdf`.
- Cross-app or tenant-app reuse remains a future proof point.
- More focused runtime/state tests should continue to grow beyond typecheck.

## Risks

- A single admin screen can accidentally redefine generic table contract.
- Route-specific toolbar/navigation logic can leak into the shared runtime.
- Package extraction can be mistaken for full admin/tenant reuse readiness.
- Optional capabilities can be implemented as screen-local hacks instead of shared opt-in features.
