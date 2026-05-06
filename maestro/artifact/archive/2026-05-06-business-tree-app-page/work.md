# Business Tree App Page

## Current State

Business Tree is the first tenant app page. It is not a product module.

The page renders a lazy, read-only business hierarchy from tenant-local data and
is reachable directly at:

```text
/app/pages/business-tree
```

The tenant API endpoint is:

```text
GET /app/pages/business-tree/nodes?parent=root|company:2|contacts:2|projects:2
```

## Domain Boundary

- App page: a concrete screen/route such as Business Tree.
- Product module: a broader product area such as future Training or Task
  Manager.
- Navigation Builder must distinguish app page targets from product module
  targets.
- No legacy route alias is retained while the product is still being shaped.

## Implementation Shape

- Frontend page:
  `platform/frontend/apps/tenant-web/src/features/app-pages/business-tree`
- Backend service:
  `platform/backend/modules/tenant/apppages/businesstree`
- UI primitive: `@platform/ui-kit` `TreeView` in read-only lazy-loading mode.

## Preserved Product Decisions

- Do not render a synthetic visual `Root` node.
- Business Tree roots are active tenant-local `company` rows where
  `main_company_id IS NULL`.
- Do not introduce a replacement for legacy `CONFIG_COMPANYID` in this slice.
- Current access is authenticated tenant users, with TODOs for Navigation
  Builder page permissions.
- Contact labels use `jobtype.name @ First Last`, or `First Last` when job type
  is missing.

## Follow-Ups

- Navigation Builder app-page target metadata and sidebar registration.
- Navigation Builder-backed page access control.
- Separate Navigation Builder target model for real product modules.
- Parent company existence validation for `contacts:*` and `projects:*` lazy
  parents.
- Large tenant performance and possible TreeView virtualization.
- Optional explicit root company setting only if legacy imports require it.
- Authenticated browser smoke with a seeded tenant session.
