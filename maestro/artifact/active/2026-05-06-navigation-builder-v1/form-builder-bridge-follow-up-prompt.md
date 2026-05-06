# Form Builder Bridge Follow-Up Prompt

You are implementing the follow-up bridge between Form Builder and Navigation
Builder in tenant-web Platform Studio.

## Context

Navigation Builder V1 is active at `/builder/navigation`. It is UI-first and
currently owns sidebar tree composition, draft/Save UX, Form View/App Page/
External Link targets, future App Module shape, live preview, inspector, and a
mock-only access sheet. Backend Navigation Builder persistence, real runtime
publication, and ACL enforcement remain planned.

Form Builder must not absorb Navigation Builder ownership. The bridge should be
compact contextual UI only.

## Goal

Add Form Builder bridge affordances that show whether a View is represented in
Navigation Builder and provide an entry point to configure it there.

## Expected UX

- In Form Builder model/view list rows, show a compact runtime exposure status:
  `Not in navigation` or `Shown in: <path>`.
- In the Form Builder view workspace, add a compact runtime exposure block:
  `This view is not in navigation` or `Shown in: Safety > Inspections`.
- Provide a clear `Configure in Navigation Builder` action that routes to
  `/builder/navigation`.
- If the bridge can pass target context safely, include model/view identity in
  route state or search params. Do not depend on this for correctness.

## Scope

- Allowed primary paths:
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/**`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/navigation/**`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/platform-studio-route-meta.ts`
  - focused tenant-web tests/docs when needed
- Reuse Navigation Builder target helpers where possible.
- Keep UI app-local in `tenant-web`.

## Non-Scope

- Do not implement backend Navigation Builder persistence.
- Do not claim real publication or ACL enforcement.
- Do not add View Active/Inactive semantics back into Form Builder.
- Do not make Navigation Builder a Form Builder tab.
- Do not invent frontend-only grants.

## Acceptance

- Form Builder bridge copy uses user-facing labels: `Model`, `View`,
  `Navigation Builder`, and human navigation paths, not raw target ids.
- Bridge distinguishes Form Builder preview routes from runtime routes.
- Form View targets resolve to `/app/forms/:modelId/views/:viewId`.
- Missing Navigation Builder data is represented as not configured, not as a
  fake published sidebar entry.
- Focused tests cover route/status helper behavior and at least one bridge UI
  render path.

## Checks

Run the focused tenant-web tests affected by the bridge, tenant-web typecheck,
and `scripts/preflight.sh` before closeout. State any skipped browser visual
smoke explicitly.
