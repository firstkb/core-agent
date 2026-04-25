# Frontend Package Boundaries Contract

Status: active
Owner: frontend
Last audited: 2026-04-25
Canonical scope: frontend shared package responsibilities and import rules

This contract defines what may live in frontend packages versus apps.

## Package Responsibilities

- `design-tokens`: colors, spacing, typography, z-index, and motion tokens; no React code.
- `ui-kit`: stable reusable UI primitives built on top of `design-tokens`.
- `api-client`: HTTP client, generated clients, request helpers, and API transport contracts.
- `auth-core`: session model, auth state, sign-in/sign-out flows, auth guards, and auth runtime primitives.
- `tenant-core`: tenant resolution, tenant context, branding resolution, and tenant permission wiring.
- `app-shell`: shared layout shell, navigation scaffolds, and shared app chrome.
- `forms`: shared form primitives and schema-driven form helpers used across apps.
- `i18n`: shared localization primitives.
- `install-helper`: install/access helper primitives.
- `collection-table`: reusable Collection Table runtime package.
- `platform-studio-core`: UI-free Platform Studio contracts, validation schemas, and manifest helpers shared across builder domains.

## Import Rules

- Apps may import packages.
- Packages must not import app code.
- Packages must export through public entrypoints.
- Do not deep-import across package boundaries.
- UI-free packages must not import `ui-kit`.
- Do not create dumping-ground packages such as generic shared utilities.

## Promotion Rules

- Create or expand a package only when reuse is real and API stability is high enough to document.
- Screen-specific toolbars, route-specific filters, and workflow compositions stay in app code until product contracts are approved.
- Donor/reference patterns such as Metronic are not automatic `ui-kit` additions.
- `ui-kit` should contain stable primitives and low-risk reusable contracts, not route-specific business UI.

## Platform Studio Package Boundary

`platform-studio-core` is the approved shared non-UI layer for Platform Studio typed contracts and helpers.

It may contain domain folders aligned to Form Builder, Navigation Builder, Action Builder, PDF Builder, and Report Builder over time.
Separate shared packages for those tools are deferred until reuse and API boundaries are proven.
