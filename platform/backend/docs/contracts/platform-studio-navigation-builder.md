# Platform Studio Navigation Builder Backend Contract

Status: active first backend slice
Owner: backend
Last audited: 2026-05-06
Canonical scope: tenant Navigation Builder persistence API, storage, validation, and runtime-sidebar handoff boundary

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
- `ps_navigation_config`

## Current API

Authoring routes:

- `GET /app/platform-studio/navigation`
- `PUT /app/platform-studio/navigation`

Both routes use the tenant secure route baseline. Tenant and user identity come
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

Access is not enforced by this first slice. Any access payload remains inert
configuration data until a later accepted ACL contract lands.

## Runtime Handoff

This slice stores authoring configuration only. Runtime sidebar output is the
next slice.

When runtime sidebar output lands:

- Dashboard remains static/locked outside `ps_navigation_config`;
- inactive app menu entries are excluded from runtime sidebar output;
- Form View targets resolve to `/app/forms/:modelId/views/:viewId`;
- App Page targets resolve to their configured route;
- tenant top bar title and breadcrumb must resolve from the configured
  Navigation Builder path and target metadata.

## Boundary Guardrails

- Do not expand `platformstudioformbuilder` for Navigation Builder behavior.
- Do not claim Navigation Builder access configuration is backend route/API
  enforcement until the ACL model exists.
- Do not treat `Save` as a separate publish lifecycle.
- Do not trust tenant ids from request payloads.
