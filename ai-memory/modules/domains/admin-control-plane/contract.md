# Admin Control Plane Contract

Status: active compact contract

## Invariants

- Root-only surfaces must stay explicit.
- Non-root admin access is section-level only.
- Access model is allow-only.
- Current access values are `read` and `write`.
- Frontend must not fabricate non-root sections that backend did not return.
- Secure admin API routes use `/app/...`.
- `/app/profile` must not become a navigation payload.
- Admin navigation comes from `GET /app/me/navigation`.

## Current Root-Only Surfaces

- Module Registry
- Employees directory
- Tenant inventory list

## Current Approved Non-Root Slice

- `tenant.onboarding`
- route: `/admin/tenants/onboarding`
- backend create endpoint: `POST /app/admin/tenants`

## Tenant Inventory

- module/section: `tenant.list_of_tenants`
- route: `/admin/tenants`
- secure API family: `/app/admin/tenants/list/*`
- root-only until secured non-root list route coverage is explicitly approved

