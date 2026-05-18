# Frontend Tenant Web

Status: active compact frontend pack
Owner surface: `tenant-web`
Last compacted: 2026-05-17

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
- Form Builder is active backend-backed authoring; Navigation Builder V1 has
  landed with backend persistence, runtime sidebar/utility rail
  projection, and direct target guards for current Form View, App Page, and
  Platform Studio APIs; Action Builder, PDF Builder, and Report Builder are
  planned.
- Published runtime navigation currently consumes published metadata and renders `/app/:routeKey/*` entries.
- Published runtime consumption is not the full Navigation Builder contract.
- Navigation Builder V1 lives at `/builder/navigation` with draft/Save UI,
  Form View/App Page/External Link targets, future App Module shape with nested
  subitems, root-only `Menu title` dividers, separate Sidebar/RailBar editor tabs,
  fixed add choices, `Element`/`Access` inspector tabs, Form Builder-style
  Element sections, `Active` toggle with eye-off inactive badges, Dashboard
  locked without a lock badge and not selectable for editing, empty configs
  starting with only Dashboard and the root add affordance, disabled future App
  Module add choice, Form View labels derived from selected View titles,
  optional icon picker for every editable non-title app menu item with `None`,
  access authoring, root-only strategy protection, runtime filtering, and
  direct target guards.
- Navigation Builder persistence lives at
`GET/PUT /app/platform-studio/navigation` backed by `ps_navigation_config`;
  runtime sidebar projection lives at `GET /app/navigation`.
- Tenant sidebar prefers saved Navigation Builder runtime items when present
  and falls back to published runtime metadata when no saved app menu exists.
- Tenant sidebar renders root `Menu title` runtime items as UI Lab-style
  section headings and suppresses empty, consecutive, or trailing title sections
  so orphan headings do not appear in the app sidebar.
- Tenant sidebar runtime item icons render when configured; `None`/missing icon
  renders no icon. Mobile sidebar panels and collapsed desktop hover-preview
  panels close after actionable sidebar/rail navigation selections.
- Tenant top-bar `+` menu renders `createActions` from `GET /app/navigation`
  as Start New links for accessible Form View targets, avoiding startup
  discovery requests across every available model/view.
- Tenant workspace search opens from the top bar or `Ctrl+K`/`Meta+K` as an
  app-local modal over already loaded, access-filtered runtime navigation,
  create actions, favorites, and visible utility rail items. Remote record
  search is a future backend slice.
- App Page and Form View runtime screens resolve the tenant top bar title and
  breadcrumb from the configured Navigation Builder path and target metadata;
  their backing APIs are denied when the current user cannot access the matching
  Navigation Builder target.
- Direct Form View route rendering is also gated against the filtered
  `GET /app/navigation` runtime tree. If a parent group is hidden by access,
  the child Form View URL shows the restricted route state instead of the
  collection table.
- Business Tree is the first tenant app page. Its canonical direct route is
  `/app/pages/business-tree`, and Navigation Builder can expose it through an
  App Page target.
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
- `code-confirmed` Business Tree node API is guarded by the Navigation Builder
  App Page target evaluator.
- `planned` Follow-ups: real product-module target contracts, parent company
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
- Published runtime sidebar fallback can be mistaken for the primary Navigation
  Builder runtime projection.
- Platform Studio planned tool concerns can leak into Form Builder if the suite contract is not read first.
- Runtime form/table implementation has maintainability growth risk in large
  files: `features/form-runtime/pages/forms-runtime-form-page.tsx`,
  `features/form-runtime/form-runtime-collection-table-client.ts`, and shared
  `@platform/collection-table` `collection-table-page.tsx`. Add substantial
  runtime-form behavior through a decomposition slice first. Decomposition
  passes extracted runtime form dialogs, load-error UI, labels, browser
  helpers, lookup helpers, value/validation helpers, subform mapping helpers,
  runtime error helpers, and navigation session state from
  `forms-runtime-form-page.tsx`, then moved create/update/autosave patch
  scheduling, mutation response handling, request-error handling, server
  validation, and create-record readiness into
  `form-runtime-mutation-controller.ts`, and moved parent-readiness, subform
  navigation/delete/reload, and checklist update orchestration into
  `form-runtime-subform-controller.ts`. Finish/back/dialog/reveal orchestration
  and DOM control sync remain concentrated and should get targeted regression
  coverage before heavier runtime mutation work. The FE client contract now has
  targeted mutation tests for create/edit/finish/favorite/saved-filter/bulk
  and subform/checklist request shapes plus backend error envelopes in
  `form-runtime-collection-table-client.test.ts`; backend Form Runtime also
  maps known DB `NOT NULL` failures on mapped runtime fields to
  `validationErrors` after the empty Job Type create-form `500` was found. A
  mocked rendered Vitest test now covers unblurred typed runtime input reaching
  the `createRecord` payload through submit-time DOM sync. Real browser/DB
  mutation coverage still needs a disposable tenant or explicit owner approval.
