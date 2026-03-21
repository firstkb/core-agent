# Frontend Workspace Guidance

Scope: `platform/frontend` only.

This workspace is the canonical home for frontend application and shared frontend package work.

## Canonical App Surfaces

- `platform-admin-web`: internal platform or backoffice interface
- `tenant-web`: tenant-scoped application surface
- `tenant-pwa`: add only when offline-first becomes a distinct runtime or release track

## Package Rules

- Create a package only when the module is reused by at least two apps and the public API is stable.
- Do not create `shared-utils` or `shared-types` dumping-ground packages.
- Prefer domain or capability names such as `auth-core`, `tenant-core`, `api-client`, and `ui-kit`.
- Keep app-specific features inside the app until reuse is proven.

## Import Rules

- Apps may import packages.
- Packages must not import apps.
- Use public entrypoints only. Do not deep-import across package boundaries.
- Avoid circular dependencies.
- Keep UI-free core packages separate from UI packages.

## Docs

- Workspace docs live under `platform/frontend/docs`.
- Each app and package keeps a short `README.md` with purpose, public API, and boundaries.

## Offline

- Keep offline support inside `tenant-web` until it becomes a distinct runtime concern.
