# Frontend Tenant Web

Status: active compact frontend pack
Owner surface: `tenant-web`
Last compacted: 2026-04-25

## Read This When

- changing tenant app shell bootstrap
- changing tenant public auth or private profile bootstrap
- changing tenant sidebar, rail utilities, dashboard, or published runtime route composition
- changing tenant-facing Platform Studio UI ownership
- deciding whether code belongs in `tenant-web`, `tenant-core`, or a shared package
- handling install prompt, manifest, PWA/offline, or mobile questions for the tenant app

## Owner Sources

- `platform/frontend/docs/modules/tenant-web.md`
- `platform/frontend/docs/contracts/app-surfaces.md`
- `platform/frontend/docs/contracts/tenant-model.md`
- `platform/frontend/docs/contracts/auth-runtime.md`
- `platform/frontend/docs/contracts/platform-studio.md`
- `platform/frontend/docs/guides/install-helper.md`
- `platform/frontend/docs/proposals/pwa-offline.md`
- `platform/frontend/apps/tenant-web/src/main.tsx`
- `platform/frontend/apps/tenant-web/src/app/root.tsx`
- `platform/frontend/apps/tenant-web/src/app/app.tsx`
- `platform/frontend/apps/tenant-web/src/app/private-app.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/**`
- `platform/frontend/apps/tenant-web/src/features/published-app/**`
- `platform/frontend/apps/tenant-web/src/features/form-runtime/**`

## Fast Facts

- `tenant-web` is the active online tenant-scoped product app.
- `tenant-web` owns tenant public auth composition, private shell composition, routes, sidebar/rail behavior, dashboard, tenant branding consumption, and app-local Platform Studio UI.
- Runtime config loads from `/config.json` and requires `authApiUrl` plus `tenantApiUrl`.
- Tenant bootstrap injects `/tenant/style.css` and uses tenant logo assets with app asset fallbacks.
- Tenant auth uses `createOtpAuthService({ surface: "tenant" })`.
- Private app entry requires real `GET /api/v1/app/profile`.
- Refresh token remains backend-managed in an `HttpOnly` cookie; JS stores only access token and expiry.
- Install prompting is mounted on public `/sign-in` only.
- Platform Studio UI stays app-local in `tenant-web`; `@platform/platform-studio-core` is UI-free contracts/helpers.
- Form Builder is active backend-backed authoring; Navigation Builder has an
  active UI-first V1 surface plus first backend persistence slice; Action
  Builder, PDF Builder, and Report Builder are planned.
- Published runtime navigation currently consumes published metadata and renders `/app/:routeKey/*` entries.
- Published runtime consumption is not the full Navigation Builder contract.
- Navigation Builder V1 lives at `/builder/navigation` with draft/Save UI,
  Form View/App Page/External Link targets, future App Module shape with nested
  subitems, root-only `Title` dividers, separate Sidebar/RailBar editor tabs,
  fixed add choices, `Element`/`Access` inspector tabs, Form Builder-style
  Element sections, `Active` toggle with eye-off inactive badges, Dashboard
  locked without a lock badge, Form View labels derived from selected View
  titles, and mock-only access controls.
- Navigation Builder persistence currently lives at
  `GET/PUT /app/platform-studio/navigation` backed by `ps_navigation_config`;
  runtime sidebar output is still planned.
- When Navigation Builder becomes the source for real sidebar output, App Page
  and Form View runtime screens must resolve the tenant top bar title and
  breadcrumb from the configured navigation path and target metadata.
- Business Tree is the first tenant app page. Its canonical direct route is
  `/app/pages/business-tree` until Navigation Builder can register app page
  targets.
- Product modules are broader product areas such as future Training or Task
  Manager. Do not call Business Tree a module.
- `tenant-pwa`, service-worker sync, offline-first persistence, Flutter, and hybrid mobile are future/deferred.

## App Pages

- `code-confirmed` Business Tree lives in
  `platform/frontend/apps/tenant-web/src/features/app-pages/business-tree`.
- `code-confirmed` Backend Business Tree lives in
  `platform/backend/modules/tenant/apppages/businesstree` and exposes
  `GET /app/pages/business-tree/nodes`.
- `code-confirmed` Business Tree uses `@platform/ui-kit` `TreeView` in
  read-only lazy-loading mode. Read-only disables item activation and active
  selection effects, but branch expansion remains allowed.
- `code-confirmed` Business Tree roots are active tenant-local `company` rows
  where `main_company_id IS NULL`. The first slice does not render a synthetic
  `Root` node and does not introduce a replacement for legacy
  `CONFIG_COMPANYID`.
- `code-confirmed` Current access is authenticated tenant users. Route/service
  boundaries contain TODOs for future Navigation Builder page permissions.
- `planned` Follow-ups: app-page target metadata and sidebar registration,
  runtime publication, real rail utility
  visibility/access enforcement, Navigation Builder-backed page access control,
  real product-module target contracts, parent company
  existence validation for `contacts:*` and `projects:*` lazy parents; large
  tenant performance and possible tree virtualization; optional explicit root
  company setting only if legacy imports require it; authenticated browser smoke
  with a seeded tenant session.

## Boundaries

`tenant-web` owns:

- route composition
- app shell and public auth screen composition
- tenant page behavior
- tenant-specific navigation and utility panels
- screen-specific permission decisions
- app-local Platform Studio React UI
- current online tenant web runtime behavior

It does not own:

- admin/backoffice behavior
- backend tenant isolation policy
- backend Form Builder API/storage/runtime apply behavior
- generic shared package contracts
- offline-first architecture
- mobile shell architecture

## Tenant-Core Split

- `tenant-core` owns stable reusable tenant identity, tenant context, tenant-scoped configuration, branding resolution, and tenant permission wiring.
- `tenant-web` consumes shared tenant primitives and composes app routes, screens, shell, and workflows.
- Do not extract tenant app-local helpers into shared packages until reuse and API shape are proven.
- Re-evaluate the split before future PWA/offline or Flutter/mobile work is activated.

## Risks

- Manifest/install prompt support can be mistaken for active offline PWA scope.
- `src/offline/sync-status.ts` can be mistaken for a real sync contract; it is not current offline architecture.
- Published runtime sidebar entries can be mistaken for completed Navigation Builder behavior.
- Platform Studio planned tool concerns can leak into Form Builder if the suite contract is not read first.
