# Frontend Workspace Contract

Status: active
Owner: frontend
Last audited: 2026-04-25
Canonical scope: frontend apps, shared packages, and docs read path

This contract defines the current frontend workspace shape.
It is the first tracked doc to read for app/package ownership questions.

## Current App Strategy

- Current delivery is online web application delivery.
- Active apps are `platform-admin-web` and `tenant-web`.
- `tenant-pwa` is deferred and is not a current runtime surface.
- Offline PWA and Flutter/hybrid mobile are future delivery layers after the main web platform stabilizes.
- Do not introduce offline-first architecture, service-worker sync, local persistence sync, or mobile shell assumptions into current work without explicit owner activation.

## Active Apps

- `platform/frontend/apps/platform-admin-web`: platform/backoffice application for internal platform administration.
- `platform/frontend/apps/tenant-web`: tenant-scoped product application.

## Shared Packages

- `platform/frontend/packages/api-client`: HTTP client, generated clients, request helpers, and API transport contracts.
- `platform/frontend/packages/app-shell`: shared layout shell, navigation scaffolds, and shared app chrome.
- `platform/frontend/packages/auth-core`: session model, auth state, sign-in/sign-out flows, guards, and auth runtime primitives.
- `platform/frontend/packages/collection-table`: reusable Collection Table runtime package.
- `platform/frontend/packages/design-tokens`: colors, spacing, typography, z-index, and motion tokens; no React code.
- `platform/frontend/packages/forms`: shared form primitives and schema-driven helpers used across apps.
- `platform/frontend/packages/i18n`: shared localization primitives.
- `platform/frontend/packages/install-helper`: install/access helper primitives.
- `platform/frontend/packages/platform-studio-core`: UI-free Platform Studio contracts, validation schemas, and manifest helpers.
- `platform/frontend/packages/tenant-core`: tenant resolution, tenant context, branding resolution, and tenant permission wiring.
- `platform/frontend/packages/ui-kit`: stable reusable UI primitives built on top of `design-tokens`.

## Contract Links

- App ownership: `platform/frontend/docs/contracts/app-surfaces.md`
- Package boundaries: `platform/frontend/docs/contracts/package-boundaries.md`
- Tenant shared logic: `platform/frontend/docs/contracts/tenant-model.md`
- Future offline/PWA delivery: `platform/frontend/docs/proposals/pwa-offline.md`

## Compatibility Sources

These root docs are compatibility pointers after the workspace docs rewrite:

- `platform/frontend/docs/app-surfaces.md`
- `platform/frontend/docs/package-boundaries.md`
- `platform/frontend/docs/tenant-model.md`
- `platform/frontend/docs/offline-strategy.md`
