# Tenant Web Module

Status: active module doc
Owner: frontend
Last audited: 2026-04-25
Canonical scope: tenant-web app shell, auth/bootstrap, tenant runtime consumption, Platform Studio ownership, install-helper placement, and future PWA/mobile exclusions

This module doc defines the current `tenant-web` frontend app boundary.
It should be read after the frontend workspace/app contracts and before opening tenant app code for shell, routing, auth, or Platform Studio work.

## Read Order

For tenant app work, read:

1. `platform/frontend/docs/contracts/workspace.md`
2. `platform/frontend/docs/contracts/app-surfaces.md`
3. `platform/frontend/docs/contracts/tenant-model.md`
4. `platform/frontend/docs/contracts/auth-runtime.md`
5. this file

For Platform Studio work, continue with:

1. `platform/frontend/docs/contracts/platform-studio.md`
2. `platform/frontend/docs/modules/platform-studio/README.md`
3. the exact Platform Studio tool doc needed for the task

For install/offline questions, continue with:

1. `platform/frontend/docs/guides/install-helper.md`
2. `platform/frontend/docs/proposals/pwa-offline.md`

## Current Role

`tenant-web` is the active online tenant-scoped product application.

It owns:

- tenant user journeys
- tenant private app shell composition
- tenant public auth screen composition
- tenant route composition
- tenant dashboard and tenant-specific page behavior
- tenant sidebar and rail behavior
- tenant-facing branding consumption
- tenant profile/session presentation
- tenant runtime context consumption
- app-local Platform Studio UI
- current online tenant application behavior

It does not own:

- admin/backoffice behavior
- generic shared package contracts
- backend tenant isolation policy
- backend Form Builder API/storage behavior
- offline-first/PWA/mobile runtime architecture
- future Flutter or hybrid mobile shell behavior

## Code Surfaces

App entry and bootstrap:

- `platform/frontend/apps/tenant-web/src/main.tsx`
- `platform/frontend/apps/tenant-web/src/app/root.tsx`
- `platform/frontend/apps/tenant-web/src/app/app.tsx`
- `platform/frontend/apps/tenant-web/src/app/private-app.tsx`

Tenant runtime helpers:

- `platform/frontend/apps/tenant-web/src/app/tenant-runtime-config.ts`
- `platform/frontend/apps/tenant-web/src/app/tenant-runtime-config-context.tsx`
- `platform/frontend/apps/tenant-web/src/app/tenant-workspace-user-session.ts`
- `platform/frontend/apps/tenant-web/src/app/tenant-workspace-user-context.tsx`
- `platform/frontend/apps/tenant-web/src/app/tenant-brand-image.tsx`

Tenant navigation/runtime surfaces:

- `platform/frontend/apps/tenant-web/src/shared/navigation.ts`
- `platform/frontend/apps/tenant-web/src/shared/tenant-sidebar-navigation.tsx`
- `platform/frontend/apps/tenant-web/src/features/app-pages`
- `platform/frontend/apps/tenant-web/src/features/published-app`
- `platform/frontend/apps/tenant-web/src/features/form-runtime`

Navigation Builder runtime entries from `GET /app/navigation` are rendered by
the tenant sidebar. Root `Menu title` entries are app-layer section headings in
the UI Lab `GENERAL` style; empty, consecutive, or trailing title sections are
suppressed so the runtime sidebar never shows an orphan heading.

Platform Studio UI:

- `platform/frontend/apps/tenant-web/src/features/platform-studio`

App metadata:

- `platform/frontend/apps/tenant-web/public/config.json`
- `platform/frontend/apps/tenant-web/public/manifest.json`
- `platform/frontend/apps/tenant-web/public/tenant/style.css`
- `platform/frontend/apps/tenant-web/public/tenant/logo-light.svg`
- `platform/frontend/apps/tenant-web/public/tenant/logo-dark.svg`

## Bootstrap Contract

Current bootstrap sequence:

- `main.tsx` calls `bootstrapAppInstallCapture()` before rendering React.
- `Root` installs `PlatformI18nProvider` with app-shell and tenant locale resources.
- `TenantRuntimeRoot` loads `/config.json`.
- Bootstrap requires `authApiUrl` and `tenantApiUrl` in runtime config.
- Bootstrap injects `/tenant/style.css`.
- Bootstrap persists loaded config under `platform.tenant.config` and mirrors string entries to local storage.
- `AuthProvider` is created with `createOtpAuthService({ surface: "tenant" })`.
- Tenant auth local storage namespace is `tenant-workspace-auth`.
- `BrowserRouter`, `App`, and `AppUpdateBanner` mount only after runtime config and auth service are ready.

Runtime config should stay same-site in local/dev/prod routing:

- `authApiUrl = /auth/v1`
- `tenantApiUrl = /api/v1`

Do not hardcode backend service URLs in app code.

## Auth And Profile

`tenant-web` follows `platform/frontend/docs/contracts/auth-runtime.md`.

Current tenant auth behavior:

- public login supports email or phone OTP
- OTP length comes from backend response
- refresh token is backend-managed through an `HttpOnly` cookie
- JavaScript stores only access token and expiry through `auth-core`
- frontend does not send `tenantId` during login
- backend resolves tenant from trusted host/origin context
- private area enters only after real `GET /api/v1/app/profile`
- profile load may retry once through `checkAuth()` after unauthorized response
- unrecoverable unauthorized profile load signs the user out

Current profile/session behavior:

- `createTenantProfileClient(runtimeConfig.tenantApiUrl)` owns profile transport.
- `TenantProfile` is converted into `TenantWorkspaceUserSession`.
- The private shell receives the tenant name and user session only after profile readiness.
- Same-user access-token refresh should not force a private shell remount.

## Private Shell

`PrivateApp` owns tenant shell composition.

Current shell behavior:

- uses `WorkspaceShell` from `@platform/app-shell`
- uses `@platform/ui-kit` primitives for menus, icons, top loader, keyboard shortcut, and sidebar navigation
- stores theme mode under `tenant-workspace-theme`
- stores collapsed sidebar state under `tenant-workspace-sidebar-collapsed`
- closes mobile sidebar panels and collapsed desktop hover-preview panels after
  any actionable sidebar/rail navigation selection
- opens workspace search with `Ctrl+K` or `Meta+K`
- uses tenant logo assets from `/tenant/*` with fallback app assets under `/assets/*`
- shows build metadata from `getAppBuildMetadata()`
- signs out through `auth-core`
- uses `TenantWorkspaceUserProvider` for app-local user session consumption

Current top-level private routes:

- `/dashboard`
- `/builder/forms`
- `/builder/forms/:modelId`
- `/builder/forms/:modelId/views/:viewId`
- `/builder/navigation`
- `/app/forms/:modelId/views/:viewId`
- `/app/forms/:modelId/views/:viewId/view/:docGuid`
- `/app/platform-studio/forms/:modelId/views/:viewId`
- `/app/pages/business-tree`
- `/app/:routeKey/*`

Legacy Platform Studio routes redirect to canonical model/view routes.

## Navigation And Runtime Entries

Current tenant shell navigation has two separate concerns:

- tenant shell entries such as dashboard and utility panels
- tenant app pages such as Business Tree
- published runtime entries derived from published metadata
- Navigation Builder runtime sidebar entries loaded from `GET /app/navigation`

Current tenant app page behavior:

- `features/app-pages` owns direct tenant pages that are concrete screens, not
  product modules.
- Business Tree is the first app page and lives at `/app/pages/business-tree`.
- Product modules are broader product areas such as future Training or Task
  Manager.

Current Navigation Builder runtime behavior:

- `PrivateApp` loads saved app menu projection through
  `createTenantNavigationClient(runtimeConfig.tenantApiUrl).getRuntimeNavigation`.
- The same runtime payload may include `utilityRail`; when
  `utilityRailConfigured` is true, `PrivateApp` filters Platform Studio, Task
  Manager, Favorites, and Help Center rail buttons to the allowed runtime rail
  entries.
- `TenantSidebarNavigation` prefers Navigation Builder runtime items when a
  saved configuration exists.
- configured Form View and App Page targets navigate to their runtime routes,
  not Platform Studio preview routes.
- configured External Link targets open externally.
- configured runtime item icons render in the tenant sidebar when an icon is
  selected; `None`/missing icon renders the item without an icon.
- tenant top bar title and breadcrumb resolve from the configured Navigation
  Builder path for matching runtime targets.
- inactive saved app menu and utility rail entries are excluded by backend
  runtime projection.

Current published runtime fallback behavior:

- `features/published-app` loads and validates published manifest metadata through `@platform/platform-studio-core`.
- `TenantSidebarNavigation` renders a published runtime sidebar section from the manifest.
- published runtime items are filtered to `web` channel when channels are present.
- published runtime item visibility uses policy evaluation before adding the sidebar item.
- `/app/:routeKey/*` renders published runtime route pages.

Navigation Builder now has a UI-first authoring route at `/builder/navigation`,
backend persistence at `GET/PUT /app/platform-studio/navigation`, and runtime
sidebar/utility rail visibility projection at `GET /app/navigation`. Direct
Form View/App Page APIs now use Navigation Builder target guards, and Platform
Studio APIs/routes are blocked when the configured utility rail access excludes
the current user.
Empty or missing Navigation Builder configs render only the locked Dashboard
builder node and root add affordance; production builder state must not seed
mock app menu entries.
Dashboard is not selectable for editing in the app menu tree. App Module remains
a disabled future add choice until concrete app module runtime routes exist.
Rail utilities such as Platform Studio, Task Manager, Favorites, and Help Center
are shown in a separate Navigation Builder RailBar editor tab. Rail access is
authored and saved through the same inline Access strategy/rule composer as app
menu items, and rail active/access filtering is applied by the backend runtime
navigation projection. Root users can assign protected root-only access to app
menu and rail items; backend save prevents non-root users from creating or
removing that protection. Navigation Builder should distinguish app page targets
from broader product module targets.

## Platform Studio Ownership

Platform Studio UI belongs to `tenant-web`.

Current ownership:

- `tenant-web` owns Platform Studio route composition and React UI.
- `platform/frontend/apps/tenant-web/src/features/platform-studio` is the app-local UI surface.
- `@platform/platform-studio-core` owns UI-free contracts, schemas, manifest helpers, and validation helpers.
- Form Builder is the active backend-backed Platform Studio tool.
- Navigation Builder has an active UI-first V1 surface.
- Action Builder, PDF Builder, and Report Builder are planned.

Rules:

- do not move Platform Studio UI into `platform-studio-core`
- do not create new shared builder packages until reuse and API stability are proven
- do not implement planned Navigation/Action/PDF/Report concerns inside Form Builder by default
- do not treat Platform Studio as an admin app surface

## Tenant-Core Boundary

`@platform/tenant-core` is the shared tenant logic boundary.

It owns stable reusable primitives for:

- tenant identity
- tenant-scoped configuration
- tenant context
- branding resolution
- tenant permission wiring

`tenant-web` owns app composition for:

- routes
- page behavior
- shell presentation
- screen-specific permission decisions
- tenant workflows that are not reused
- app-local runtime helpers until they become stable shared contracts

If future PWA/offline or Flutter/hybrid mobile work is activated, re-evaluate tenant shared logic before extracting more code from `tenant-web`.

## Install Helper Placement

Install helper is active only as public auth install prompting.

Current placement:

- `main.tsx` calls `bootstrapAppInstallCapture()`.
- unauthenticated `/sign-in` wraps `PublicAuthShell` with `AppInstallProvider`.
- `AppInstallPrompt` is passed as `PublicAuthShell` floating content.
- tenant app manifest is read through the install-helper runtime.

Current non-goals:

- do not mount install prompting inside `PrivateApp`
- do not treat install helper as service-worker scope
- do not treat manifest icons as offline-first architecture
- do not add local sync or conflict resolution through install-helper work

## Future PWA/Mobile Exclusions

Current `tenant-web` delivery is online web.

PWA/offline and Flutter/hybrid mobile are future delivery layers after the main web platform stabilizes.

Current rules:

- `tenant-pwa` is deferred and is not a current runtime surface.
- service-worker sync is not active implementation scope.
- offline-first local persistence is not active implementation scope.
- mobile shell assumptions are not active implementation scope.
- `public/manifest.json` and install prompt support do not activate offline architecture.
- `src/offline/sync-status.ts` is current shell status data and must not be treated as an active offline sync contract.

Use `platform/frontend/docs/proposals/pwa-offline.md` for future offline/PWA/mobile strategy.

## Package Dependencies

`tenant-web` may consume shared packages through public entrypoints.

Current package dependencies include:

- `@platform/api-client`
- `@platform/app-shell`
- `@platform/auth-core`
- `@platform/collection-table`
- `@platform/i18n`
- `@platform/platform-studio-core`
- `@platform/tenant-core`
- `@platform/ui-kit`

Rules:

- packages must not import `tenant-web`
- no deep imports across package boundaries
- app-local tenant behavior should stay in `tenant-web` until reuse is proven
- UI-free shared packages must remain UI-free

## Related Docs

- `platform/frontend/docs/contracts/workspace.md`
- `platform/frontend/docs/contracts/app-surfaces.md`
- `platform/frontend/docs/contracts/package-boundaries.md`
- `platform/frontend/docs/contracts/tenant-model.md`
- `platform/frontend/docs/contracts/auth-runtime.md`
- `platform/frontend/docs/contracts/platform-studio.md`
- `platform/frontend/docs/modules/platform-studio/README.md`
- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/guides/install-helper.md`
- `platform/frontend/docs/proposals/pwa-offline.md`
