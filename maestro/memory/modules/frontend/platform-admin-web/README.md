# Frontend Platform Admin Web

Status: active compact frontend pack
Owner surface: `platform-admin-web`
Last compacted: 2026-04-25

## Read This When

- changing admin shell bootstrap
- changing admin sidebar/navigation/favorites
- changing admin collection-table host adapters
- changing Module Registry, Employees, or Tenants admin pages
- changing root/non-root frontend visibility behavior

## Owner Sources

- `platform/frontend/docs/modules/platform-admin-web.md`
- `platform/frontend/apps/platform-admin-web/src/app/app.tsx`
- `platform/frontend/apps/platform-admin-web/src/app/private-app.tsx`
- `platform/frontend/apps/platform-admin-web/src/shared/navigation.ts`
- `platform/frontend/apps/platform-admin-web/src/shared/admin-navigation-refresh.tsx`

## Fast Facts

- Admin bootstrap loads `/app/profile` first, then `/app/me/navigation`.
- Dashboard is the only static top-level navigation item.
- Sidebar modules and sections come from backend navigation.
- Shell favorites come from `GET /app/me/navigation`.
- Collection-table favorite toggles refresh admin navigation through a host-owned callback seam.
- Current collection-table consumers are `module-registry.list`, `employees.list`, and `tenant.list`.
- Module Registry, Employees, and Tenant inventory are root-oriented unless backend navigation grants a covered non-root section.
- Current approved non-root slice is `tenant.onboarding` with `write` access.

## Boundaries

`platform-admin-web` owns:

- app bootstrap sequencing
- admin shell and route composition
- frontend navigation projection from backend payload
- favorites utility display
- Collection Table host adapter wiring
- frontend create/edit route resolution

It does not own:

- generic Collection Table runtime contract
- backend collection-table DTOs/preferences
- backend Module Registry semantics
- backend admin route authorization policy
- tenant-web Platform Studio behavior
