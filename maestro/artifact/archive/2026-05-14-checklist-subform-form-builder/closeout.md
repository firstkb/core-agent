# Checklist Subform Form Builder Closeout

Status: closed / archived
Closed: 2026-05-17

## Outcome

The `Checklist subform` Form Builder authoring slice is complete. The shortcut
creates a canonical checklist subform scope, stores checklist bindings through
`checklistConfig`, protects the managed checklist child fields, constrains the
checklist-scope palette, and deletes checklist subform scope data without
leaking child fields back to the root.

## Completed Scope

- `Checklist subform` remains a canonical `subform` node with
  `subformType: CHECKLIST`.
- Shortcut-created child fields are `Item`, `Result`, and `Notes`.
- Checklist config stores lookup, result, notes, and grouping bindings.
- Managed checklist fields are protected from direct delete actions.
- Checklist child-scope palette is restricted to safe additions.
- Subform deletion removes the subform node, scoped model schema, and scoped
  fields together.
- Hydration prunes leaked root `item`, `result`, and `notes` checklist fields
  when an active checklist subform exists.
- New checklist subforms use non-reused generated scope keys to avoid stale
  physical runtime relation conflicts from deleted checklist scopes.
- Runtime relation name conflicts map to `FORM_BUILDER_RUNTIME_NAME_CONFLICT`.

## Deferred Work

Runtime checklist rendering and save behavior moved to the broader active
runtime Form Builder artifact. Remaining checklist follow-ups are richer source
configuration UX, file/photo support, and Corrective Action integration unless
the owner explicitly reorders them.

## Checks

- Tenant-web focused checklist/Form Builder tests.
- Tenant-web typecheck and lint.
- `go test ./modules/tenant/platformstudioformbuilder`.
- `scripts/preflight.sh`.

Product-code checks are historical evidence from the implementation slice; this
closeout itself changes only Maestro artifact files.
