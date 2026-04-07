# Module Memory — Admin Control Plane

Status: active
Date: 2026-04-06

## Read this when

- touching admin navigation
- touching root/non-root rules
- touching tenant onboarding control-plane work
- changing admin grants or access policy
- changing `api-admin` surface composition

## Confirmed backend surfaces

- `platform/backend/cmd/api-admin`
- `platform/backend/modules/admin/navigation`
- `platform/backend/modules/admin/profile`
- `platform/backend/modules/admin/tenantmanagement`
- `platform/backend/modules/admin/employeeslist`
- `platform/backend/modules/admin/accesspolicy`
- `platform/backend/modules/admin/moduleregistrylist`
- `platform/backend/modules/admin/moduleregistrymanage`
- `platform/backend/modules/admin/moduleregistrygrants`

## Confirmed frontend surfaces

- `platform/frontend/apps/platform-admin-web/src/shared/navigation.ts`
- `platform/frontend/apps/platform-admin-web/src/pages/employees-list/page.tsx`
- admin shell bootstrap files under `platform-admin-web/src/app/*`

## Locked invariants

- `Module registry` is root-only
- `Employees` directory is root-only
- non-root admin access is section-level only
- access model is allow-only
- current access values are `read` and `write`
- `/app/profile` is not the navigation payload
- navigation comes from `GET /app/me/navigation`
- canonical secure admin API routes live under `/app/...`
- frontend must not fabricate non-root admin sections that backend did not return

## Current rollout state

Documented as completed in backend brief:

- root-only module registry schema and list API
- root-only employees directory API backed by platform admin users
- module and section management API
- section-level grant model
- admin navigation projection
- current endpoint authorization policy for approved non-root slice

Documented as planned / cleanup phase:

- frontend handoff, route alignment, and rollout cleanup

## Current approved non-root slice

- `tenant.onboarding`
- current route path: `/admin/tenants/onboarding`
- current backend create endpoint: `POST /app/admin/tenants`

## Important docs

- `platform/backend/docs/backend-admin-module-registry-brief.md`
- `platform/backend/docs/backend-admin-access-policy-layering.md`

## Operational rules

- keep root and non-root behavior explicit in both backend and frontend
- do not overload profile payloads with navigation concerns
- do not add hidden legacy API aliases for admin secure routes
- if a section is not backed by backend route coverage, do not surface it for non-root users

## When to update memory

Update this file when:

- a new admin section becomes part of the approved rollout slice
- a new root-only admin section becomes first-class in navigation or API composition
- grant semantics change
- navigation response shape changes
- root-only boundaries change
