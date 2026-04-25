# Module Index

Status: compact active index
Last compacted: 2026-04-25

Read only the module packs relevant to the task.

## Domain Modules

These packs describe product domains and cross-surface contracts.
They are not automatically shared between `platform-admin-web` and `tenant-web`.

### `modules/domains/auth-and-session/`

Read for:

- OTP, login, refresh, logout
- `/app/profile`
- `/app/me/navigation`
- cookie refresh policy
- JWT/JWKS
- `auth-core`
- `api-client`

### `modules/domains/schema-and-tenancy/`

Read for:

- migrations
- master vs tenant DB split
- tenant resolution
- tenant isolation
- tenant bundle generation
- local DB bootstrap

### `modules/domains/admin-control-plane/`

Read for:

- admin navigation
- root-only vs non-root admin behavior
- access policy and grants
- tenant onboarding
- tenant inventory
- employees admin surface

### `modules/domains/admin-module-registry/`

Read for:

- module registry list/manage/grants
- module and section maintenance
- root-only registry boundaries
- module-registry-specific collection-table usage

### `modules/domains/collection-table/`

Read for:

- `@platform/collection-table`
- universal table metadata contract
- filters, search, favorites, saved filters
- host/runtime separation
- row actions and export capabilities

### `modules/domains/platform-studio/`

Read for:

- Platform Studio
- Platform Studio tool suite boundaries
- Form Builder
- Navigation Builder
- Action Builder
- PDF Builder
- Report Builder
- sidebar/access/event/report/PDF planning
- model/view identity
- three-schema authoring split
- field catalog, palette, System Fields, rules, grid/view settings
- runtime apply
- static/external models
- runtime routes and ACL staging
- import/export planning

## Frontend Modules

### `modules/frontend/workspace/`

Read for frontend workspace, apps, packages, package-boundary work, and tracked frontend docs classification.

### `modules/frontend/auth-runtime/`

Read for frontend auth shell, `auth-core`, bootstrap recovery, and app-private session behavior.

### `modules/frontend/platform-admin-web/`

Read for admin web shell, profile/navigation bootstrap, sidebar/favorites, admin collection-table consumers, and root/non-root frontend visibility.

### `modules/frontend/collection-table-package/`

Read for frontend implementation of `@platform/collection-table` and app-host adapter boundaries.

### `modules/frontend/platform-studio-ui/`

Read for tenant-web Platform Studio UI, Form Builder workspace, planned builder entrypoints, local authoring provider, and visual behavior.

### `modules/frontend/ui-kit/`

Read for shared UI primitives, UI Lab, design tokens, and promotion boundaries.

## Backend Modules

### `modules/backend/runtime/`

Read for backend runtime entrypoints, module wiring, and API composition.

### `modules/backend/auth-gateway/`

Read for backend auth, JWKS, token validation, profile, and auth transport.

### `modules/backend/migrations/`

Read for migration flow, tenant bundle, schema baselines, and local bootstrap.

### `modules/backend/admin-modules/`

Read for admin modules, access policy, module registry, employees, and tenant management.

### `modules/backend/platform-studio-form-builder/`

Read for Form Builder backend authoring, repository/service logic, runtime apply, tenant migrations, and future backend seams to runtime/actions/navigation/PDF/report tooling.
