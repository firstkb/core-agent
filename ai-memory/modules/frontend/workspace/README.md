# Frontend Workspace

Status: active compact frontend pack
Owner surface: frontend
Last compacted: 2026-04-24

## Read This When

- changing frontend apps, shared packages, package boundaries, or workspace tooling
- deciding whether code belongs in an app or package
- changing app surfaces or tenant/admin route ownership

## Owner Sources

- `platform/frontend/AGENTS.md`
- `platform/frontend/README.md`
- `platform/frontend/docs/README.md`
- `platform/frontend/docs/contracts/workspace.md`
- `platform/frontend/docs/contracts/app-surfaces.md`
- `platform/frontend/docs/contracts/package-boundaries.md`
- `platform/frontend/docs/contracts/tenant-model.md`
- `platform/frontend/docs/modules/tenant-web.md`
- `platform/frontend/docs/guides/install-helper.md`
- `platform/frontend/docs/guides/local-dev.md`
- `platform/frontend/docs/proposals/pwa-offline.md`

## Contract

- `platform-admin-web` is the internal platform/backoffice app.
- `tenant-web` is the tenant-scoped application surface.
- `tenant-web` current module contract lives at `platform/frontend/docs/modules/tenant-web.md`.
- Current app delivery is online web application delivery.
- `tenant-pwa` is deferred.
- Offline PWA and Flutter/hybrid mobile are future delivery layers after the main web platform stabilizes.
- Install helper is current install prompt/runtime behavior for public auth screens only.
- Local dev/HTTPS/proxy commands are operational development workflow, not product app ownership.
- Do not introduce offline-first, service-worker sync, or mobile-shell assumptions into current work without explicit owner activation.
- Apps may import packages; packages must not import apps.
- Packages export through public entrypoints only.
- No deep imports across package boundaries.
- Do not create dumping-ground packages like `shared-utils`.
- UI-free packages must stay UI-free.
- `platform-studio-core` is typed contract/helper code, not UI.

## Current Packages

- `api-client`
- `app-shell`
- `auth-core`
- `collection-table`
- `design-tokens`
- `forms`
- `i18n`
- `install-helper`
- `platform-studio-core`
- `tenant-core`
- `ui-kit`

## Lessons

- Create a package only when reuse is real and API is stable.
- Keep route-specific composition in app code until it becomes a stable shared contract.
- Do not promote donor or provisional UI patterns into `ui-kit` casually.
