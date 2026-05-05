# UI Kit Tree

Date: 2026-05-05
Status: complete

## Owner Intent

Add a reusable UI Kit tree component and expose it in UI Lab so different
hierarchical structures can be expanded and reviewed. The screenshot reference
shows a folder/document hierarchy with plus/minus branch controls and nested
connector guides. The owner also asked to check the Metronic reference for a
similar widget.

## Scope

Allowed:

- `platform/frontend/packages/ui-kit`
- `platform/frontend/apps/platform-admin-web/src/internal/ui-lab`
- UI Kit Storybook stories
- relevant frontend docs/memory only if the shared contract changes

Forbidden:

- backend, auth, tenant, permission, migration, or product route behavior
- copying donor code from Metronic into product code
- shell-specific navigation chrome, search, tenant switching, or routing policy

## Implementation Plan

1. Add a generic `TreeView` primitive to `@platform/ui-kit` with controlled and
   uncontrolled expansion/selection.
2. Style it with product-owned design tokens, connector guides, compact row
   density, and folder/document affordances.
3. Add UI Lab coverage under Navigation Primitives using the owner screenshot
   shape as generic demo data.
4. Add a focused Storybook story for default and controlled tree states.
5. Run targeted frontend checks and repository preflight.

## Evidence Expectations

- Typecheck/lint for `@platform/ui-kit` and affected admin app if available.
- Storybook/product visual smoke when local dev surface is available.
- `scripts/preflight.sh` before closeout unless blocked.

## Notes

- Metronic reference has a tree component based on `@headless-tree/core`; this
  task should not import that dependency for the current UI Kit slice. The
  useful lessons are compact branch rows, folder/leaf affordances, and explicit
  expansion state.

## Closeout

- Added `TreeView` to `@platform/ui-kit` with controlled/uncontrolled expansion
  and selection.
- Added UI Lab Navigation Primitives coverage using the project organization
  hierarchy from the owner screenshot.
- Added Storybook examples and updated UI Kit/UI Lab docs and frontend memory.
