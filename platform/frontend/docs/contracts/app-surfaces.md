# Frontend App Surfaces Contract

Status: active
Owner: frontend
Last audited: 2026-04-25
Canonical scope: frontend app ownership and runtime surface naming

This contract answers which frontend app owns each current user-facing runtime surface.

It does not define package boundaries, tenant shared logic, or future offline/PWA implementation detail.

## Current Rule

- Current frontend delivery is online web application delivery.
- `platform-admin-web` and `tenant-web` are the active apps.
- `tenant-pwa` is deferred and must not be treated as a current runtime surface.

## `platform-admin-web`

Internal platform/backoffice application.

Owns:

- platform operational dashboards
- tenant management screens
- support and moderation tools
- platform-level settings
- root/admin surfaces such as UI Lab and administrative module management

## `tenant-web`

Tenant-scoped product application.

Owns:

- tenant user journeys
- tenant-specific navigation
- tenant page behavior
- tenant-facing branding and permission consumption
- tenant runtime context consumption
- current online tenant application behavior

Offline-related behavior remains future/proposal scope unless explicitly activated.

## Deferred Surfaces

`tenant-pwa` is not part of the current frontend layout.

Create a separate PWA or mobile surface only when one of these becomes true:

- offline-first UX becomes materially different from `tenant-web`
- the release track diverges
- installability/runtime constraints require a separate shell
- the owner explicitly activates PWA/offline or Flutter/hybrid mobile delivery

See `platform/frontend/docs/proposals/pwa-offline.md`.
