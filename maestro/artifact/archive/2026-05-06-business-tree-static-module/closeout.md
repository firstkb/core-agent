# Closeout

- Work ID: `2026-05-06-business-tree-static-module`
- Status: closed after implementation, memory update, and final local checks

## Outcome

Implemented the tenant Business Tree static module as the first direct static
module slice:

- direct tenant route `/app/modules/business-tree`;
- tenant API `GET /app/modules/business-tree/nodes`;
- dedicated backend service under `platform/backend/modules/tenant/businesstree`;
- UI Kit `TreeView` lazy-loading support for read-only expandable snapshots;
- tenant-web module page using the shared read-only TreeView;
- UI Lab docs updated for lazy/read-only behavior.

## Decisions Preserved

- No synthetic visual `Root` node.
- Tree roots come from active tenant-local `company` rows where
  `main_company_id IS NULL`.
- No replacement `CONFIG_COMPANYID` setting in the first slice.
- Access is authenticated tenant users for now, with TODOs at route/service
  boundaries for Navigation Builder/module permissions.
- Contact labels use `jobtype.name @ First Last`, or `First Last` when job type
  is missing.

## Memory Updates

Durable memory now records the module and follow-ups in:

- `maestro/memory/modules/frontend/tenant-web/README.md`
- `maestro/memory/durable/current-state.md`
- `maestro/memory/durable/module-index.md`
- `maestro/memory/durable/repo-map.md`
- `maestro/memory/index/read-routes.yaml`

## Recorded Follow-Ups

- Navigation Builder static-module metadata and sidebar registration.
- Navigation Builder-backed module access control.
- Parent company existence validation for `contacts:*` and `projects:*` lazy
  parents.
- Large tenant performance and possible TreeView virtualization.
- Optional explicit root-company setting only if legacy imports require it.
- Authenticated browser smoke with a seeded tenant session.

## Evidence

See `evidence.md` for command evidence and skipped checks.
