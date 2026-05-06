# Backend Platform Studio Navigation Builder

Status: active first backend slice
Owner surface: tenant Navigation Builder backend
Last compacted: 2026-05-06

## Read This When

- changing `platformstudionavigationbuilder`
- changing Navigation Builder authoring endpoints, persistence, validation,
  migrations, runtime sidebar handoff, or app-menu target contract
- changing backend seams where Navigation Builder consumes Form View/App Page/
  External Link/App Module targets

## Owner Sources

- `maestro/memory/modules/domains/platform-studio/`
- `maestro/memory/modules/domains/platform-studio/tools/navigation-builder.md`
- `platform/backend/docs/contracts/platform-studio-navigation-builder.md`
- `platform/backend/docs/modules/platform-studio/navigation-builder.md`
- `platform/backend/modules/tenant/platformstudionavigationbuilder/**`
- `platform/backend/cmd/api-tenant/internal/server/routes_platform_studio_navigation_builder.go`
- `platform/backend/migrations/postgres/tenant/007_platform_studio_navigation_builder.sql`

## Backend Contract

- Navigation Builder backend is a dedicated tenant service/package, not an
  expansion of `platformstudioformbuilder`.
- Authoring API routes are:
  - `GET /app/platform-studio/navigation`
  - `PUT /app/platform-studio/navigation`
- Runtime API route is:
  - `GET /app/navigation`
- Storage table is `ps_navigation_config`.
- The first slice stores one saved definition under config key `default`.
- Save uses optimistic `expectedVersion` conflict checks.
- Saved definition includes `schemaVersion`, `appMenu`, and `utilityRail`.
- Supported app menu node types are `menu_title`, `menu_group`, `form_view`,
  `app_page`, `external_link`, and `app_module`.
- Duplicate target prevention is enforced by backend validation before save.
- Access payloads remain inert/mock configuration until a later ACL contract
  lands.
- Runtime sidebar projection excludes inactive app menu entries and resolves
  Form View/App Page targets to tenant runtime routes. Tenant top bar title and
  breadcrumb resolve from Navigation Builder path/target metadata.

## Planned / Watch

- Add real ACL/grant enforcement only after the accepted access contract exists.
- Keep Form Builder as model/view authoring owner only.
