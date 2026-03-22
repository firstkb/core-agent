# Package Boundaries

Canonical package responsibilities for the frontend workspace.

## Packages

- `design-tokens`: colors, spacing, typography, z-index, motion tokens; no React code
- `ui-kit`: reusable UI primitives built on top of `design-tokens`
- `api-client`: HTTP client, generated clients, request helpers, API transport contracts
- `auth-core`: session model, auth state, sign-in and sign-out flows, auth guards
- `tenant-core`: tenant resolution, tenant context, branding resolution, tenant permissions wiring
- `app-shell`: shared layout shell, navigation scaffolds, shared app chrome
- `forms`: shared form primitives or schema-driven form helpers used across apps

## Rules

- No business feature package until the feature is shared by at least two apps.
- No deep imports across package boundaries.
- Packages must export through `src/index.ts` only.
- Packages must not depend on app code.
- UI-free packages should not import `ui-kit`.
- `ui-kit` defaults to stable primitives and low-risk reusable contracts.
- Do not treat every donor pattern extracted from Metronic as an automatic `ui-kit` addition.
- Screen-specific toolbars, route-specific filters, and workflow compositions stay in app code until product contracts are approved.
