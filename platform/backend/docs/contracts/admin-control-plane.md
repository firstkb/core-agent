# Backend Admin Control Plane Contract

Status: active
Owner: backend
Last audited: 2026-04-25
Canonical scope: admin profile, navigation, section grants, route authorization, and root/non-root behavior

This contract defines the current admin control-plane access model.

## Core Invariants

- Admin control-plane APIs live in `cmd/api-admin`.
- Secure admin app API routes use the `/app/...` route family.
- `/app/profile` stays profile-only.
- Admin navigation is projected through `GET /app/me/navigation`.
- Root sees all covered active admin sections.
- Non-root admins see only explicitly granted active sections with real backend route coverage.
- Non-root grants are section-level and allow-only.
- Current access modes are `read` and `write`.
- `delete` is deferred until a real destructive non-root route requires narrower control than `write`.

## Current Backend Surfaces

Runtime:

- `platform/backend/cmd/api-admin`

Admin modules:

- `platform/backend/modules/admin/profile`
- `platform/backend/modules/admin/navigation`
- `platform/backend/modules/admin/accesspolicy`
- `platform/backend/modules/admin/tenantmanagement`
- `platform/backend/modules/admin/tenantlist`
- `platform/backend/modules/admin/employeeslist`
- `platform/backend/modules/admin/moduleregistrylist`
- `platform/backend/modules/admin/moduleregistrymanage`
- `platform/backend/modules/admin/moduleregistrygrants`

Route wiring:

- `platform/backend/cmd/api-admin/internal/server/routes_admin_profile.go`
- `platform/backend/cmd/api-admin/internal/server/routes_admin_navigation.go`
- `platform/backend/cmd/api-admin/internal/server/middleware_admin_access.go`

## Admin Profile Boundary

`GET /app/profile` owns only current principal profile bootstrap.

It must not become:

- navigation payload
- full permissions payload
- Module Registry payload
- tenant context delegation payload

## Admin Navigation Boundary

`GET /app/me/navigation` owns admin sidebar/navigation projection.

Navigation output is filtered by:

- active module rows
- active section rows
- section `route_path`
- backend route-policy coverage
- root bypass or explicit non-root grant
- required access mode for covered routes

Navigation must use the same route-binding source as middleware authorization.
Do not expose a navigation section that the backend cannot authorize.

## Grant Model

Grant storage:

- `admin_section_grant`

Grant target:

- one admin user
- one admin module section
- one access mode

Current access modes:

- `read`
- `write`

Grant rules:

- grants are allow-only
- root users bypass explicit grants
- root users are not targets for explicit section grants
- inactive admin users cannot receive new grants
- module-level UI toggles are convenience projections that expand into section-level grants
- stored grants resolve to section rows

## Route-Binding Layer

Admin authorization uses both database grants and an explicit route-binding layer.

Database layer answers:

- what modules exist
- what sections exist
- which admin user has which grant

Route-binding layer answers:

- which secure route belongs to which section
- whether a route is self, section-gated, or root-only
- which access mode is required

Current route-binding source:

- `platform/backend/modules/admin/accesspolicy/matrix.go`

This layer is required because route ids live in code and the backend needs a default-deny allowlist for implemented secure routes.

## Current Route Policy Baseline

Self-allowed routes:

- `ADMIN_PROFILE_GET`
- `ADMIN_NAVIGATION_GET`

Root-only route families:

- `ADMIN_MODULE_REGISTRY_*`
- current Module Registry management/grant routes
- root-only tenant list coverage until non-root list coverage is explicitly approved

Current approved non-root rollout slice:

- module: `tenant`
- section: `onboarding`
- required access: `write`
- representative route: `ADMIN_TENANT_CREATE`

Future non-root slices must be explicitly approved, mapped in the route-binding matrix, and verified end to end.

## Middleware Rules

- Enforcement lives in `api-admin` middleware.
- Root is a universal bypass, but active `admin_user.status` is still required.
- Non-root secure routes use default-deny when no route policy is defined.
- Policy denials should log route id, user id, and denial reason.

## Future Data-Driven Policy

A data-driven route policy table may be introduced later if non-root admin coverage becomes broad enough.

Possible future table:

- `admin_section_route_policy`

This is not required for the current control-plane model and must be a separate decision.

## Out Of Scope

- deny rules
- delete access mode
- profile-as-navigation
- tenant-side equivalent registry logic
- delegated admin-to-tenant auth exchange
- data-driven route policy table without a separate decision
