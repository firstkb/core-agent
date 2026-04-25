# Platform Admin Web Module

Status: active
Owner: frontend
Last audited: 2026-04-25
Canonical scope: `platform-admin-web` app shell, admin profile/navigation bootstrap, sidebar/favorites, admin collection-table consumers, and root/non-root frontend boundaries

This document defines the current frontend module contract for the admin web app.
It supersedes the old admin Module Registry backend handoff path.

Read with:

- `platform/frontend/docs/contracts/workspace.md`
- `platform/frontend/docs/contracts/auth-runtime.md`
- `platform/frontend/docs/contracts/collection-table.md`
- `platform/backend/docs/contracts/admin-control-plane.md`
- `platform/backend/docs/contracts/admin-module-registry.md`

## Core Invariants

- `platform-admin-web` is the current admin web application.
- Current delivery strategy is online web first.
- Secure admin API calls use the `/app/...` route family.
- Do not call legacy `/admin/...` or `/api/admin/...` API aliases.
- `/app/profile` is profile-only.
- `GET /app/me/navigation` owns sidebar/navigation and favorites.
- Dashboard is the only static top-level navigation item.
- All other sidebar modules and sections come from backend navigation.
- The frontend must not fabricate root-only or non-root admin entries that the backend did not return.
- Collection Table pages are app-host consumers; the generic table contract belongs to Collection Table docs.
- Module Registry module/section/grant semantics belong to backend Module Registry and admin control-plane docs.

## Current Code Surfaces

App shell and bootstrap:

- `platform/frontend/apps/platform-admin-web/src/app/app.tsx`
- `platform/frontend/apps/platform-admin-web/src/app/private-app.tsx`
- `platform/frontend/apps/platform-admin-web/src/shared/navigation.ts`
- `platform/frontend/apps/platform-admin-web/src/shared/admin-navigation-refresh.tsx`

Admin collection table host adapter:

- `platform/frontend/apps/platform-admin-web/src/shared/admin-collection-table-client.ts`
- `platform/frontend/apps/platform-admin-web/src/shared/admin-collection-table-page.tsx`

Current routed pages:

- `platform/frontend/apps/platform-admin-web/src/pages/dashboard/page.tsx`
- `platform/frontend/apps/platform-admin-web/src/pages/modules-list/page.tsx`
- `platform/frontend/apps/platform-admin-web/src/pages/modules-edit/page.tsx`
- `platform/frontend/apps/platform-admin-web/src/pages/employees-list/page.tsx`
- `platform/frontend/apps/platform-admin-web/src/pages/employees-edit/page.tsx`
- `platform/frontend/apps/platform-admin-web/src/pages/tenants-list/page.tsx`
- `platform/frontend/apps/platform-admin-web/src/pages/runtime-section/page.tsx`

## Bootstrap Contract

Authenticated app bootstrap order:

1. validate or recover the access token through `auth-core`
2. call `GET /app/profile`
3. after profile succeeds, call `GET /app/me/navigation`
4. render the private shell only after profile and navigation are both ready

Rules:

- profile failure blocks private app rendering
- navigation failure blocks private app rendering unless an existing shell is being preserved during refresh
- unauthorized profile or navigation responses sign out the admin session
- navigation refresh after shell load must not re-fetch profile unless profile state is invalidated

## Navigation Contract

Navigation source:

- `GET /app/me/navigation`

Navigation payload shape is defined by `@platform/api-client` as:

- `is_root`
- `favorites[]`
- `modules[]`
- `modules[].sections[]`

Frontend rules:

- `route_path` is an SPA route path, not an API URL.
- sidebar modules are built from `modules[]`
- sidebar children are built from `modules[].sections[]`
- module icons come from `modules[].icon`
- section icons are used only when `sections[].icon` exists
- section children must not inherit module icons automatically
- `access` values are currently only `read` and `write`
- `delete` is not a current frontend or backend access mode

Compatibility normalization:

- `users` module label is normalized to `Employees`
- `list_of_users` section label is normalized to `List of Employees`
- both `/admin/users` and `/admin/employees` are currently accepted employee-list routes
- employee edit pages stay attached to the employees parent route

## Favorites Contract

Shell favorites are sourced from:

- `GET /app/me/navigation`

Rules:

- favorites are per-user
- favorites are backend-filtered through the same route coverage and grant policy as sidebar sections
- collection-table `actions.favorite` is not the same thing as shell `favorites[]`
- after a Collection Table favorite toggle succeeds, `platform-admin-web` refreshes `GET /app/me/navigation`
- the shared `@platform/collection-table` package must not know about admin navigation refresh

Current favorite-backed collection surfaces:

- `module-registry.list`
- `employees.list`
- `tenant.list`

## Current Routes

Static shell route:

- `/dashboard`

Root-oriented collection table routes:

- `/modules/list`
- `/admin/users`
- `/admin/employees`
- `/admin/tenants`

Detail/edit routes:

- `/modules/edit/:moduleId`
- `/admin/users/edit/:userId`
- `/admin/employees/edit/:userId`

Dynamic backend navigation fallback:

- `/admin/*`

UI Lab route:

- `/root/ui-lab`

## Collection Table Consumers

`platform-admin-web` hosts three current Collection Table consumers.

| Page | Table id | Path prefix | Frontend-owned behavior |
| --- | --- | --- | --- |
| Module Registry list | `module-registry.list` | `/app/admin/module-registry/list` | create path `/modules/edit/new`, frontend row action `edit` to `/modules/edit/{row.id}`, bulk/export/row-action adapter support enabled |
| Employees list | `employees.list` | `/app/admin/employees/list` | frontend row action `edit` to `/admin/users/edit/{row.id}`, bulk adapter support enabled |
| Tenants list | `tenant.list` | `/app/admin/tenants/list` | backend row action support enabled for tenant launch behavior |

The generic Collection Table runtime and backend DTO/preference contract live in:

- `platform/frontend/docs/contracts/collection-table.md`
- `platform/backend/docs/contracts/collection-table.md`

## Admin Control-Plane Boundaries

Root behavior:

- root receives backend-covered active admin sections
- root can see Module Registry, Employees, Tenant inventory, and other route-covered admin sections that the backend returns

Non-root behavior:

- non-root receives only explicitly granted sections with backend route-policy coverage
- current approved non-root rollout slice is `tenant.onboarding`
- the mapped backend route for current onboarding creation is `POST /app/admin/tenants`
- required access for that slice is `write`
- tenant list access for non-root is not current unless backend navigation returns it after an explicit policy decision

Frontend rules:

- do not hardcode Module Registry for non-root admins
- do not hardcode Tenant inventory for non-root admins
- do not assume every seeded admin registry section is visible or authorized
- do not introduce a third permission mode such as `delete`

Backend control-plane source:

- `platform/backend/docs/contracts/admin-control-plane.md`
- `platform/backend/docs/contracts/admin-module-registry.md`

## Module Registry Boundary

`platform-admin-web` owns:

- admin route paths
- host adapter wiring
- frontend create/edit navigation
- page shell integration

Backend Module Registry owns:

- module and section records
- grant management
- root-only registry management
- registry list service behavior
- route authorization

Use the backend docs for registry semantics:

- `platform/backend/docs/contracts/admin-module-registry.md`

## Out Of Scope

- generic Collection Table runtime ownership
- backend Module Registry business rules
- backend admin grant semantics
- tenant-web Platform Studio behavior
- Navigation Builder product design
- offline/PWA/mobile app delivery
