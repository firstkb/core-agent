# Form Builder System Fields

Status: exact detail reference
Historical status: active
Date: 2026-04-08
Last audited: 2026-04-25
Read rule: Open only after the active Form Builder module docs, and only when exact payload/settings/history detail is needed.
Canonical active docs:

- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

## Purpose

This document locks the current working contract for the `System Fields` section in Platform Studio Form Builder V2.

It exists to formalize the accepted page-semantic fields that replace legacy EzData Page field bindings:

- `Field By`
- `Field Date`
- `Field Status`
- `Field Status - Draft variant`
- `Field Status - Finish variant`

This document is the detailed companion to:

- `form-builder-field-catalog.md`
- `form-builder-section-tree.md`
- `form-builder-v2-field-contract.md`
- `form-builder-slice-1-inspector-and-view-schema.md`
- `form-builder-page-and-filter-notes.md`

## Source Provenance

This System Field contract stays grounded in the three original analysis inputs:

- `EXTDB`
  - page-level semantic settings such as `Field By`, `Field Date`, `Field Status`, and status variants
- `smartapp`
  - current runtime expectations for reported-by, reported-date, and status behavior
- `ezform`
  - authoring-shell expectations for palette shortcuts and inspector-driven setup

## Scope

This document covers only the `System Fields` palette section.

It does not define:

- all view settings
- lookup filter DSL
- the full model field library
- backend-generated system columns

## Canonical System Fields Section List

The `System Fields` section should include these items, in this order:

1. `Reported By`
2. `Reported Date`
3. `Status`

All three are palette-level authoring shortcuts.

They are not standalone base field types.

## Shared System Field Rules

Each accepted System Field must obey these rules:

- it is a dedicated palette item
- it may either create a new compatible field or bind to an existing compatible field
- the semantic binding lives in `ViewDefinition.systemFields`
- `ViewDefinition.systemFields` exists only once per form view
- System Fields are root-level form semantics only
- System Fields must not be attached to subforms, repeaters, or nested layout scopes
- one semantic role may bind only one field per view
- one field may not be bound to more than one System Field role in the same view
- semantics must never be inferred from labels or field titles

Recommended authoring flow:

- create from palette
  - inserts a default compatible field
  - writes the semantic binding automatically
  - allowed only at the first form level
- bind existing field
  - allowed only when the field is compatible with the semantic role
  - allowed only for root-level fields of the main form

## Semantic Storage Shape

Recommended view-facing shape:

```ts
interface ViewSystemFields {
  version: 1;
  reportedBy?: {
    fieldId: string;
  };
  reportedDate?: {
    fieldId: string;
  };
  workflowStatus?: {
    fieldId: string;
    initialValue?: string;
    finalValue?: string;
  };
}
```

## Field Matrix

### `Reported By`

Functional role:

- identifies who reported or authored the record

Semantic key:

- `reportedBy`

Default created field:

- `baseType = db_lookup`
- `fieldPreset = contact_lookup`
- default label: `Reported By`

Compatible existing fields:

- `db_lookup` fields that resolve to the shared contact and user source

Recommended default behavior:

- default `displayMode = search_select`
- default display template: `users_firstname + ' ' + users_lastname`
- default search fields:
  - `users_firstname`
  - `users_lastname`

Inspector-facing settings:

- `enabled`
- `fieldId`

Authoring note:

- this replaces the old pattern where the user first created a contact-style field and then separately selected it in `Field By`

### `Reported Date`

Functional role:

- identifies the reporting or event date for the record

Semantic key:

- `reportedDate`

Default created field:

- `baseType = date`
- no preset required
- default label: `Reported Date`

Compatible existing fields:

- `date`
- `date_time`

Recommended default behavior:

- default field type should be `date`
- `date_time` may be bound when the app needs timestamp precision

Inspector-facing settings:

- `enabled`
- `fieldId`

Authoring note:

- this replaces the old `Field Date` page setting

### `Status`

Functional role:

- identifies the current workflow state of the record

Semantic key:

- `workflowStatus`

Default created field:

- `baseType = single_select`
- default label: `Status`

Compatible existing fields:

- `single_select` fields with an option set suitable for workflow state

Field-owned data:

- `statusVariantMode`
  - `template`
  - `custom`
- optional `statusTemplateKey`
- `options`
- optional `colorMapping`

View-owned semantic data:

- `initialValue`
- `finalValue`

Recommended runtime presets:

- `select`
- `radio_chips`
- `badge`

Accepted authoring rule:

- `Status` must support creating different status variants
- different forms may use different status variant sets
- the field may start from a template or from a fully custom option set
- template-provided options remain editable after creation

Recommended template examples:

- `draft_open_closed`
- `open_in_progress_done`
- `pass_fail_na`
- `active_inactive`

Critical rule:

- workflow status is not a boolean field
- workflow status is not a checkbox group
- workflow status is one current state selected from an explicit option set

Validation rules:

- `initialValue` must exist in the bound field options when present
- `finalValue` must exist in the bound field options when present

Inspector-facing settings:

- `enabled`
- `fieldId`
- `initialValue`
- `finalValue`

Authoring note:

- this replaces the old `Field Status` page setting and the old draft/finish variant settings
- variant selection belongs to the field-authoring flow, not to the view semantic binding itself

## Legacy Translation Into V2

The legacy EzData Page settings should translate as follows:

- `Field By`
  - `view.systemFields.reportedBy.fieldId`
- `Field Date`
  - `view.systemFields.reportedDate.fieldId`
- `Field Status`
  - `view.systemFields.workflowStatus.fieldId`
- `Field Status - Draft variant`
  - `view.systemFields.workflowStatus.initialValue`
- `Field Status - Finish variant`
  - `view.systemFields.workflowStatus.finalValue`

These semantics should not return as detached page dropdowns once the System Fields authoring flow is accepted.

## Inspector Boundary

Current slice-1 view inspector should support:

- enable or disable each role
- bind or unbind a compatible existing field
- for `Status`, choose `initialValue` and `finalValue`

Current slice-1 view inspector should not:

- create new base field structures directly in the inspector
- edit lookup source configuration for `Reported By`
- edit the option set for `Status`

Those actions belong to the palette create flow or the future model-side field editor.

## Current Acceptance Position

Accepted now:

- `Reported By`, `Reported Date`, and `Status` are the first locked `System Fields`
- all System Fields are palette shortcuts with explicit semantic bindings
- `Reported By` uses `contact_lookup`
- `Reported Date` uses `date`
- `Status` uses `single_select` with the `status` preset

Still open:

- whether later phases should add more System Fields
- whether `Reported Date` should offer a first-class `date_time` variant shortcut
- whether `Status` should expose more runtime preset shortcuts directly from the palette
