# Install Helper Guide

Status: active guide
Owner: frontend
Last audited: 2026-04-25
Canonical scope: current frontend install prompt/runtime guide for admin and tenant web apps

This guide is the active read path for the current install/access helper runtime.
It is not an offline-first, service-worker, or mobile-app implementation contract.

Read with:

- `platform/frontend/docs/contracts/workspace.md`
- `platform/frontend/docs/modules/tenant-web.md`
- `platform/frontend/docs/proposals/pwa-offline.md` only for future offline/PWA scope

Future offline/PWA and Flutter/hybrid mobile strategy lives in:

- `platform/frontend/docs/proposals/pwa-offline.md`

## Code Surfaces

Shared runtime package:

- `platform/frontend/packages/install-helper`

Public package entrypoints:

- `platform/frontend/packages/install-helper/src/index.ts`
- `platform/frontend/packages/install-helper/src/install-helper.tsx`
- `platform/frontend/packages/install-helper/src/styles.css`

App Shell re-export and style composition:

- `platform/frontend/packages/app-shell/src/app-install.tsx`
- `platform/frontend/packages/app-shell/src/index.ts`
- `platform/frontend/packages/app-shell/src/styles.css`

Mounted app surfaces:

- `platform/frontend/apps/platform-admin-web/src/app/app.tsx`
- `platform/frontend/apps/tenant-web/src/app/app.tsx`

Manifests:

- `platform/frontend/apps/platform-admin-web/public/manifest.json`
- `platform/frontend/apps/tenant-web/public/manifest.json`

## Compatibility Inputs

This guide replaces the default read role of this old doc.
It is a compatibility pointer, not an active read-order doc:

- `platform/frontend/docs/install-helper-runtime.md`

Use the old doc only for historical link compatibility.

## Runtime Contract

The install helper:

- captures `beforeinstallprompt` early through `bootstrapAppInstallCapture`
- suppresses the browser auto-flow so product UI controls when install CTA appears
- stores the deferred Chromium install prompt on `window.__platformDeferredInstallPrompt`
- dispatches internal install capture and installed events for provider state sync
- loads manifest metadata from `/manifest.json` by default
- normalizes manifest icon and screenshot URLs relative to the manifest URL
- detects standalone mode and related installed apps
- detects Chromium install prompt availability
- detects Apple mobile instruction flow
- detects Apple desktop Add to Dock instruction flow
- stores prompt hide/show state in `sessionStorage` using `pwa-hide-install` by default
- renders product-owned install UI with workspace styling and `en`/`es` localization

Exports:

- `bootstrapAppInstallCapture`
- `AppInstallProvider`
- `AppInstallPrompt`
- `useAppInstall`
- install helper types
- install helper locale resources

## Placement

Install UI is mounted only on public auth screens through `PublicAuthShell` floating content.

Current mounted surfaces:

- admin unauthenticated route
- tenant unauthenticated route

It is intentionally not mounted inside private shell runtime.
Private app shells should not own install prompting unless a later contract changes placement.

## Browser Handling

Chromium:

- capture `beforeinstallprompt`
- call `event.preventDefault()`
- show product-owned CTA when provider state allows
- call the stored prompt event only after the user chooses install from the product UI
- clear the stored prompt after use

Apple mobile:

- no native deferred install prompt exists
- show instruction flow for Safari, Share, and Add to Home Screen

Apple desktop:

- show instruction flow for Share and Add to Dock when detection indicates the platform supports it

Installed state:

- standalone display mode or `navigator.standalone` marks the app installed
- installed related apps also suppress install prompting
- `appinstalled` clears the stored prompt and hides install UI

## Non-Goals

The current install helper does not own:

- service worker registration
- offline-first behavior
- local sync
- update/download lifecycle
- token storage in a service worker
- external `pwa-install` UI runtime
- Flutter/hybrid mobile shell behavior

Do not use install-helper work as a reason to introduce offline architecture.

## Update Flow Boundary

Install flow and version/update flow are separate.

Current update/version check remains based on:

- `platform/frontend/packages/app-shell/src/app-build.ts`
- `version.json`

Service worker is not part of the current update strategy.

## Reference Material

Old donor/plugin install experiments are historical reference only.
They are not current product truth and must not be read by default.

If a future PWA/offline implementation is activated, start from `platform/frontend/docs/proposals/pwa-offline.md`, not from donor plugin folders.
