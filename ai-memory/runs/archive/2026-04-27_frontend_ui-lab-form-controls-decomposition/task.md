# UI Lab Form Controls Decomposition

Status: archived

## Task

Reduce monolith risk in `platform/frontend/apps/platform-admin-web/src/internal/ui-lab/panels/form-controls.tsx`.

## Scope

- Frontend-only.
- App-local UI Lab code only.
- Behavior-preserving extraction.
- No `ui-kit` API changes.
- No route, auth, navigation, backend, or product workflow changes.

## Locked Invariants

- UI Lab remains an internal review/documentation surface, not product routing.
- Form control examples stay generic and accessible.
- New units stay under `platform-admin-web/src/internal/ui-lab`.
- Do not promote or invent shared primitives in this slice.

## Initial Plan

1. Extract stateful preview/demo helpers from `form-controls.tsx` into focused app-local files.
2. Keep `render*Docs` exports stable for `panels/index.tsx`.
3. Run targeted platform-admin typecheck and local preflight when practical.
