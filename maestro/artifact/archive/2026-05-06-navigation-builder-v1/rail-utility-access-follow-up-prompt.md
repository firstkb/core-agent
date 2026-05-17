# Rail Utility Access Follow-Up Prompt

Status: superseded by Navigation Builder V1 closeout.

Utility rail authoring, active toggles, runtime filtering, and access enforcement
landed during V1. Retain this file only as historical context.

You are implementing the follow-up Navigation Builder slice for tenant rail
utility visibility/access.

## Context

Navigation Builder V1 at `/builder/navigation` currently includes sidebar
composition plus a separate left-panel `RailBar` tab for static rail utilities.
The UI is still draft/Save and access is mock-only. Backend Navigation Builder
persistence, runtime publication, and real ACL enforcement remain planned.

Tenant rail utilities are separate from sidebar entries. Current static shell
utilities include Platform Studio, Task Manager, Favorites, and Help Center.
The owner specifically called out Platform Studio access as important.

## Goal

Upgrade the Navigation Builder-owned RailBar utility surface from preview/mock
UI toward real configurable visibility/access without mixing rail utilities into
the sidebar tree.

## Expected Product Shape

- Treat rail utilities as their own surface, not as sidebar tree entries.
- Keep RailBar utilities in their own Navigation Builder tab/panel.
- Each utility should have a human label, icon identity, current visibility
  state, and access summary.
- Access in the first UI slice remains mock/preview unless backend ACL is part
  of the accepted implementation scope.
- Platform Studio visibility/access must be representable independently from
  ordinary sidebar entries.

## Likely Paths

- `platform/frontend/apps/tenant-web/src/app/private-app.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/navigation/**`
- `platform/frontend/docs/contracts/platform-studio.md`
- `platform/frontend/docs/modules/tenant-web.md`
- relevant `maestro/memory/modules/**` entries

## Non-Scope

- Do not put rail utilities into the sidebar tree.
- Do not invent frontend-only security grants.
- Do not claim backend route/API enforcement unless the backend ACL slice is
  also implemented and verified.
- Do not move tenant shell ownership out of `tenant-web`.

## Acceptance

- Navigation Builder docs distinguish sidebar entries from rail utilities.
- Platform Studio rail utility access is modeled as configurable scope.
- UI, if implemented in this slice, clearly labels access as preview-only until
  backend enforcement exists.
- Focused tests cover any new rail utility state helpers.
