# Task: Form Builder Route Shell Closeout

Date: 2026-04-27
Status: active

## Goal

Continue reducing tenant-web Form Builder workspace page monolith risk without changing state architecture, backend contracts, auth, tenancy, grants, route guards, or UX.

## Scope

- Frontend-only tenant-web Form Builder workspace.
- Behavior-preserving extraction from `forms-ui-schema-workspace-page.tsx`.
- Prefer controller hooks/helpers and focused components.

## Out Of Scope

- Backend/API/storage contract changes.
- Navigation Builder, Action Builder, PDF Builder, Report Builder behavior.
- Form Builder state model rewrite.
