# UI Lab

Internal component and foundation review surface for the platform frontend.

## Purpose

`UI Lab` exists to:

- review `ui-kit` primitives and shared patterns in isolation
- compare `stable approved`, `review`, and `app-layer` candidates
- validate token decisions, light/dark behavior, and dense enterprise UI rhythm
- give humans and AI agents one controlled place to inspect the current frontend baseline

`UI Lab` is not a product page and it is not a second application shell.

## Route

- Runtime route: `/root/ui-lab`
- Route wiring lives in `platform/frontend/apps/platform-admin-web/src/app/app.tsx`

## Folder Layout

- `index.tsx`
  internal route module entry for the lazy-loaded lab surface
- `model/*`
  canonical metadata, navigation, and status helpers
- `hooks/*`
  local state and interaction orchestration
- `components/*`
  shell pieces and reusable docs helpers specific to the lab
- `panels/*`
  section-level documentation panels
- `styles/*`
  lab-only CSS modules split by concern

## Editing Rules

- Keep product pages out of this folder.
- Keep `UI Lab` examples generic unless a review page explicitly needs a candidate app-layer pattern.
- Promote components to `stable approved` only after review, not while inventing a new pattern.
- When adding a new panel or component docs page, prefer extending the existing `model` metadata instead of hardcoding menu behavior in a component.
- If a new reusable primitive belongs in `ui-kit`, implement it in `packages/ui-kit` first and document it here second.

## AI Agent Notes

- Treat this folder as an internal documentation surface, not as product routing.
- Prefer narrow changes in one panel or helper at a time.
- Keep examples accessible: provide `id`, `name`, and labels for form controls used in demos.
- Avoid adding screen-specific business flows here unless the page is explicitly marked as `review` or `app-layer`.
