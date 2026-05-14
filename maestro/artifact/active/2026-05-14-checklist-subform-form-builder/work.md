# Checklist Subform Form Builder

## Scope

Implement the Form Builder authoring slice for `Checklist subform` only.

## Decisions

- `Checklist subform` remains a canonical `subform` node with `subformType: "CHECKLIST"`.
- Authoring stores checklist bindings on the subform node as `checklistConfig`.
- Creating the shortcut creates default child fields:
  - `Item`: managed/locked single `db_lookup`
  - `Result`: managed/locked `single_select` rendered as buttons with `Yes`, `No`, `N/A`
  - `Notes`: managed/locked `long_text`; hide it with node visibility when comments are not needed
- Category behavior is captured as `checklistConfig.grouping`:
  - `flat`
  - `by_first_display_field`
- `checklistConfig.notesFieldId` is stored with the shortcut-created `Notes` field.
- Palette inside checklist scope is restricted to `Short text`, `Date`, `Single select`, `Heading`, and `Text`.
- Deleting a subform removes the subform node, the matching model schema scope, and fields owned by that scope together.
- Form render/runtime behavior, photos/files, and Corrective Action integration are out of this slice.

## Current Status

- Form Builder authoring slice is implemented.
- Managed checklist fields are protected from delete actions.
- Checklist scope palette restriction is implemented.
- Subform delete no longer leaves scoped fields as root/unplaced fields.
- Existing leaked root `item`/`result`/`notes` checklist fields are pruned during Form Builder hydration when they are root unplaced fields and an active checklist subform exists.
- New checklist subforms use non-reused generated scope keys to avoid stale physical runtime relation conflicts from previously deleted checklist scopes.
- Backend maps runtime relation name conflicts to `FORM_BUILDER_RUNTIME_NAME_CONFLICT` instead of generic `FORM_BUILDER_INTERNAL`.
- Browser smoke on `/builder/forms/lookup/views/view-default` opened the builder without console errors.
- Form render/runtime behavior remains a separate follow-up.

## Evidence

- `pnpm --filter @platform/tenant-web lint`
- `pnpm --filter @platform/tenant-web typecheck`
- `pnpm --filter @platform/tenant-web test -- forms-builder-library.test.ts form-builder-workspace-grid.test.ts`
- `pnpm --filter @platform/tenant-web test -- form-builder-workspace-delete-subform.test.ts form-builder-palette-selectors.test.ts form-builder-workspace-delete-node.test.ts forms-builder-library.test.ts form-builder-workspace-grid.test.ts`
- `pnpm -C platform/frontend --filter @platform/tenant-web test -- form-builder-workspace-checklist-orphans.test.ts form-builder-workspace-delete-subform.test.ts forms-builder-library.test.ts`
- `pnpm -C platform/frontend --filter @platform/tenant-web typecheck`
- `pnpm -C platform/frontend --filter @platform/tenant-web lint`
- `go test ./modules/tenant/platformstudioformbuilder`
- `scripts/preflight.sh`
