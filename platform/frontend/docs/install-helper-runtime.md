# Install Helper Runtime

Current install/access layer for `Admin App` and `Tenant App`.

## Status

This is the active install flow contract for the frontend workspace.

Do not treat:

- `docs/pwa-install`
- `smart-app-pwa-install-1to1.md`

as the active implementation path.

Those surfaces are archival donor/reference material only.

## Runtime Owner

Shared runtime lives in:

- [packages/install-helper](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/install-helper)

Shared app-shell re-export and style composition live in:

- [packages/app-shell/src/app-install.tsx](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/app-shell/src/app-install.tsx)
- [packages/app-shell/src/index.ts](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/app-shell/src/index.ts)
- [packages/app-shell/src/styles.css](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/app-shell/src/styles.css)

## What It Does

- captures `beforeinstallprompt` early in app startup
- keeps install flow independent from service worker/update mechanics
- loads manifest metadata from `/manifest.json`
- detects:
  - Chromium install prompt availability
  - Apple mobile install flow
  - Apple desktop `Add to Dock`
  - standalone mode
  - related installed apps
- stores hide/show state in `sessionStorage` via `pwa-hide-install`
- renders product-owned install UI with workspace styling and `en/es` i18n

## Current Placement

Install UI is mounted only on public auth screens.

Current entrypoints:

- [platform-admin-web/src/app/app.tsx](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/platform-admin-web/src/app/app.tsx)
- [tenant-web/src/app/app.tsx](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/app/app.tsx)

It is intentionally not mounted inside private shell runtime.

## Browser Handling

### Chromium

- `beforeinstallprompt` is captured and suppressed from browser auto-flow
- product runtime decides when to surface install CTA
- when the user confirms, the stored prompt event is used directly

### Apple Mobile

- no native deferred prompt exists
- product UI shows instruction flow for Safari + Share + Add to Home Screen

### Apple Desktop

- product UI shows instruction flow for Share + Add to Dock

## Non-Goals

- no service worker requirement for install flow
- no offline-first product contract
- no token storage in service worker
- no dependency on external `pwa-install` runtime UI

## Relationship To Update Flow

Install flow and version/update flow are separate.

Update flow remains based on:

- [packages/app-shell/src/app-build.ts](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/app-shell/src/app-build.ts)
- `version.json`

Service worker is not part of the current update strategy.

## Archival Note

The old donor/plugin approach is kept only as historical reference under:

- [docs/pwa-install](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/pwa-install)
- [docs/ess-smart-app-app](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/ess-smart-app-app)

Do not use those folders as the source of truth for current implementation decisions.
