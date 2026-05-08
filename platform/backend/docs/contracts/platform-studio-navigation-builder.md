# Platform Studio Navigation Builder Backend Contract

Status: active first backend slice
Owner: backend
Last audited: 2026-05-06
Canonical scope: tenant Navigation Builder persistence API, storage, validation, and runtime-sidebar projection boundary

Navigation Builder is a separate Platform Studio backend service. It must not be
implemented inside `platformstudioformbuilder`.

## Code Ownership

Current owner package:

- `platform/backend/modules/tenant/platformstudionavigationbuilder`

Runtime composition:

- `platform/backend/cmd/api-tenant/internal/server/wiring_platform_studio_navigation_builder.go`
- `platform/backend/cmd/api-tenant/internal/server/routes_platform_studio_navigation_builder.go`

Tenant schema:

- `platform/backend/migrations/postgres/tenant/007_platform_studio_navigation_builder.sql`
- `platform/backend/migrations/postgres/tenant/011_platform_studio_navigation_access_runtime.sql`
- `platform/backend/migrations/postgres/tenant/012_platform_studio_navigation_access_company_type.sql`
- `platform/backend/migrations/postgres/tenant/013_platform_studio_navigation_root_access.sql`
- `ps_navigation_config`
- `ps_navigation_runtime_item`
- `ps_navigation_access_policy`
- `ps_navigation_access_subject`

## Current API

Authoring routes:

- `GET /app/platform-studio/navigation`
- `PUT /app/platform-studio/navigation`

Runtime route:

- `GET /app/navigation`

Access authoring lookup route:

- `GET /app/platform-studio/navigation/access-options`
- `GET /app/platform-studio/navigation/access-options/page?category=users|companies|companyTypes|jobtypes&search=&page=&pageSize=&ids=...`

All routes use the tenant secure route baseline. Tenant and user identity come
from trusted request context, not request payload fields.

## Storage

`ps_navigation_config` stores one saved Navigation Builder definition per tenant
configuration key.

Current key:

- `default`

Columns:

- `config_key`
- `version`
- `definition_json`
- `updated_by`
- `created_at`
- `updated_at`

The API uses optimistic versioning. `expectedVersion` may be provided on save;
when it does not match the stored version, the service returns a conflict.

On each successful `Save`, backend synchronizes derived runtime/access tables in
the same transaction:

- `ps_navigation_runtime_item`: flattened app menu and utility rail items with
  parent id, type, target columns, target path/url, active state, order, depth,
  and breadcrumb JSON.
- `ps_navigation_access_policy`: one access mode row per runtime item.
- `ps_navigation_access_subject`: unified recipient rows for `user`, `company`,
  `company_type`, and `jobtype` subjects.

The derived rows are fully rebuilt from `definition_json`; they are not editable
state and must not drift into a second source of truth.

## Definition Contract

Saved JSON shape:

- `schemaVersion`
- `appMenu`
- `utilityRail`

Supported app menu node types:

- `menu_title`
- `menu_group`
- `form_view`
- `app_page`
- `external_link`
- `app_module`

Supported target types:

- `form_view`: `{ modelId, viewId }`
- `app_page`: `{ pageId?, route? }`
- `external_link`: `{ url }`
- `app_module`: `{ moduleId }`

Validation owns:

- schema version check;
- node id and label presence;
- unique node ids;
- `menu_title` root-only behavior;
- no targets/children/icons for menu titles;
- no targets for menu groups;
- target requirements for Form View, App Page, External Link, and App Module;
- duplicate target prevention across the app menu;
- utility rail id/key/label presence and duplicate key prevention.

Access authoring and runtime navigation visibility are active:
`ps_navigation_config.definition_json` remains the source of truth for access
policy, `GET /app/platform-studio/navigation/access-options` remains a
compatibility bulk lookup, the paged `/access-options/page` lookup is the
preferred UI picker API for large recipient sets, and backend `Save`
synchronizes derived runtime/access tables used by the runtime evaluator.
`/app/navigation` filters app menu and utility rail visibility through those
derived rows. Direct Form View/App Page/Platform Studio route and API guards
reuse the same evaluator semantics instead of parsing authoring JSON
independently.

Supported persisted access modes:

- inherit from parent;
- all authenticated users, retained as default/compatibility mode but not
  exposed as an editable V1 child-item strategy;
- root only;
- selected recipients only;
- everyone except selected recipients.

Planned recipient sources are current tenant `users`, `company`, `companytype`,
and `jobtype`. Matching semantics are `users OR ((companies OR company types)
AND job types)`, where an empty dimension means "any" inside that branch.
Parent access always bounds child access; a child may narrow access but must not
expand beyond parent access. External Link access controls only navigation
visibility, not the external destination.

`root_only` is a protected access mode. Only root/admin claims (`level >= 100`
or `role = root`) may save a definition that introduces root-only access or a
definition where root-only access already exists. This prevents non-root users
from removing root-only protection through a direct save request.

## Runtime Projection

- Dashboard remains static/locked outside `ps_navigation_config`;
- inactive app menu entries are excluded from runtime sidebar output;
- Form View targets resolve to `/app/forms/:modelId/views/:viewId`;
- App Page targets resolve to their configured route;
- tenant top bar title and breadcrumb must resolve from the configured
  Navigation Builder path and target metadata.

`GET /app/navigation` returns the active saved app menu projection for tenant
runtime shell/sidebar consumption. The response includes:

- `items`: filtered app menu/sidebar items;
- `utilityRail`: filtered one-level utility rail items;
- `utilityRailConfigured`: `true` when saved utility rail rows exist. Tenant web
  keeps the legacy static rail visible while this flag is `false` so first-time
  tenants do not lose access before saving Navigation Builder config.
- `createActions`: filtered quick-create entries derived from accessible
  `form_view` navigation targets. Each action points to
  `/app/forms/:modelId/views/:viewId/new` and is intended for the tenant top-bar
  `+` menu. It is built from the same runtime projection as `items`, so inactive
  items, parent access, root-only rules, and child narrowing are already applied.

Runtime visibility rules:

- inactive items are removed before access evaluation;
- root/admin claims (`level >= 100` or `role = root`) bypass Navigation
  Builder access policy checks but still respect inactive item filtering;
- `inherit` means "same as parent"; at root it behaves as authenticated access;
- `root_only` is visible only to root/admin claims;
- `selected_only` requires a direct user match or the audience rule
  `(companies OR company types) AND job types`;
- `everyone_except` hides matching recipients and shows other authenticated
  users;
- parent access always bounds child access, so children can only narrow;
- empty, consecutive, and trailing `menu_title` items are suppressed after
  filtering.

Direct route/API guards:

- runtime Form View APIs under `/app/forms/:modelId/views/:viewId/*` require an
  active accessible `form_view` Navigation Builder target for the same
  `modelId`/`viewId`;
- app page APIs such as `/app/pages/business-tree/*` require an active
  accessible `app_page` target for that page/route;
- Platform Studio APIs under `/app/platform-studio/*` require access to the
  utility rail item keyed `platform-studio`;
- if no utility rail rows have ever been saved, Platform Studio keeps the
  legacy allow-by-default fallback so first-time tenants do not lose builder
  access before their first Navigation Builder save;
- root/admin claims bypass direct target checks.

## Boundary Guardrails

- Do not expand `platformstudioformbuilder` for Navigation Builder behavior.
- Direct runtime target guards must stay wired to the derived Navigation Builder
  evaluator; do not reimplement access by reading authoring JSON in another
  module.
- Do not treat `Save` as a separate publish lifecycle.
- Do not trust tenant ids from request payloads.
