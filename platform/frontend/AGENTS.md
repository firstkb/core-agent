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

## Frontend focus
This directory is for **foundation-stage frontend work**.

Primary approved work:
- UI kit tokens and primitives
- Admin shell and Tenant shell
- auth screen
- protected routes
- base table/form surfaces
- first list/detail/create/edit pages
- profile view / session-aware UI
- route wiring and feature-level state

## Do not do here without explicit approval
- redesign the entire UI kit while implementing a small feature
- create one-off page patterns when a shared pattern should be reused
- move business logic deep into presentational components
- silently add a new visual language, token system, or state model
- couple UI behavior tightly to temporary backend assumptions

## Working rules
1. Start with the approved plan.
2. Reuse existing tokens, primitives, layout rules, and table/form contracts.
3. Keep page/container logic separate from presentational pieces.
4. Handle required states:
   - loading
   - error
   - empty
   - ready
   - disabled / readonly / pending when relevant
5. For auth-sensitive work, verify:
   - redirect behavior
   - protected route behavior
   - expired session handling
   - logout behavior
   - admin vs tenant context

## Preferred implementation order
1. identify route / page / feature entry point
2. identify shared components to reuse
3. identify API hook / query / mutation wiring
4. implement smallest defensible UI change
5. run checks
6. run `verify-and-review`

## Frontend done criteria
A frontend slice is ready only when:
- it does not break the shell
- it uses the approved design foundation
- states are covered
- route behavior is correct
- checks pass
- any new token or shared primitive is explicitly called out

## Frontend commands
Replace these placeholders with real repo commands:
- FRONTEND_LINT = <replace me>
- FRONTEND_TEST = <replace me>
- FRONTEND_BUILD = <replace me>
- FRONTEND_TYPECHECK = <replace me>
- FRONTEND_SMOKE = <replace me>

## Frontend summary format
- Goal
- Route / feature
- Changed files
- Shared components reused
- New shared primitives/tokens added
- States covered
- Commands run
- Risks / follow-ups
