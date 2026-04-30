# Frontend Lane: Form Builder Route Shell Closeout

Status: closed

## Plan

- Extract remaining page mutation orchestration into focused controller helpers.
- Move read-only render/display derivation out of the route page.
- Keep document/model mutation behavior identical.
- Keep transient drag UI state separate from document mutation helpers.
- Preserve existing component props and JSX behavior.

## File Ownership

- `pages/forms-ui-schema-workspace-page.tsx`: route/workspace composition and render wiring.
- `controller/form-builder-workspace-mutation-handlers.ts`: selected-field, lookup save, delete-node, library-field, and base document/model mutation orchestration.
- `controller/form-builder-workspace-selected-node-mutations.ts`: selected-node title/text/required/visibility mutation callbacks.
- `controller/form-builder-workspace-system-field-mutations.ts`: system-field binding/creation and workflow status option callbacks.
- `controller/use-form-builder-workspace-drag-controllers.ts`: local canvas/grid/choice drag state and handlers.
- `controller/form-builder-workspace-render-model.ts`: display-ready palette/canvas/grid/view/lookup item assembly.
- `controller/use-form-builder-workspace-derived-state.ts`: read-only workspace schema/scope/rule/filter/view derivation.
- `controller/form-builder-workspace-palette-sections.ts`: palette section and unplaced-field pure helpers.
- `controller/use-form-builder-selected-lookup-summaries.ts`: selected lookup display summaries.

## Lane Report

- Moved page-local mutation handlers into controller helpers.
- Split selected-node and system-field mutation groups out of the main mutation helper so new units stay small.
- Moved canvas/grid/choice drag local state and handlers into a focused hook.
- Moved display/render model assembly and read-only derived state into focused controller helpers.
- Reduced `forms-ui-schema-workspace-page.tsx` from 1,580 lines to 997 lines in this slice.

## Checks

- `pnpm --filter @platform/tenant-web typecheck` passed after mutation extraction.
- `pnpm --filter @platform/tenant-web typecheck` passed after drag-controller extraction.
- `pnpm --filter @platform/tenant-web typecheck` passed after run evidence update.
- `pnpm --filter @platform/tenant-web typecheck` passed after render-model extraction.
- `pnpm --filter @platform/tenant-web typecheck` passed after derived-state extraction.
- `pnpm --filter @platform/tenant-web typecheck` passed after selected lookup summary extraction.
- `scripts/ai/preflight.sh` passed.
- `git diff --check` passed.

## Risks / Follow-Up

- Browser smoke was user-checked after closeout; follow-up fixes landed separately in `6a303c4 Fix select options`.
- Page is below 1,000 lines but not route-shell-only; further extraction should follow a review/checkpoint rather than more blind micro-slices.
