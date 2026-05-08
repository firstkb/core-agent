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

Access is not enforced by the current runtime slice. Authoring is active:
`ps_navigation_config.definition_json` remains the source of truth for access
policy, `GET /app/platform-studio/navigation/access-options` remains a
compatibility bulk lookup, the paged `/access-options/page` lookup is the
preferred UI picker API for large recipient sets, and backend `Save`
synchronizes derived runtime/access tables for the future evaluator. Runtime
`/app/navigation`, utility rail visibility, and future direct Form View/App Page
route/API guards should use one backend evaluator over those derived rows.

Supported persisted access modes:

- inherit from parent;
- all authenticated users, retained as default/compatibility mode but not
  exposed as an editable V1 child-item strategy;
- selected recipients only;
- everyone except selected recipients.

Planned recipient sources are current tenant `users`, `company`, `companytype`,
and `jobtype`. Matching semantics are `users OR ((companies OR company types)
AND job types)`, where an empty dimension means "any" inside that branch.
Parent access always bounds child access; a child may narrow access but must not
expand beyond parent access. External Link access controls only navigation
visibility, not the external destination.

## Runtime Projection

- Dashboard remains static/locked outside `ps_navigation_config`;
- inactive app menu entries are excluded from runtime sidebar output;
- Form View targets resolve to `/app/forms/:modelId/views/:viewId`;
- App Page targets resolve to their configured route;
- tenant top bar title and breadcrumb must resolve from the configured
  Navigation Builder path and target metadata.

`GET /app/navigation` returns the active saved app menu projection for tenant
runtime shell/sidebar consumption. It does not expose or enforce utility rail
access yet.

## Boundary Guardrails

- Do not expand `platformstudioformbuilder` for Navigation Builder behavior.
- Do not claim Navigation Builder access configuration is backend route/API
  enforcement until the ACL model exists.
- Do not treat `Save` as a separate publish lifecycle.
- Do not trust tenant ids from request payloads.
