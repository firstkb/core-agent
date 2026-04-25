# Form Builder Choice Fields

Status: exact detail reference
Historical status: active
Date: 2026-04-08
Last audited: 2026-04-25
Read rule: Open only after the active Form Builder module docs, and only when exact payload/settings/history detail is needed.
Canonical active docs:

- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

## Purpose

This document locks the `Choice fields` section for Platform Studio Form Builder V2.

It defines:

- canonical field list
- functional role of each field
- mandatory authoring capabilities
- type-specific field settings
- expected runtime behavior

This document is the detailed companion to:

- `form-builder-field-catalog.md`
- `form-builder-section-tree.md`
- `form-builder-v2-field-contract.md`
- `form-builder-choice-preset-inspector-schema.md`
- `form-builder-multivalue-storage-contract.md`

## Source Provenance

This choice-field matrix stays grounded in the three original analysis inputs:

- `EXTDB`
  - legacy combobox and option-driven field families
- `smartapp`
  - current runtime widgets and overloaded option behavior
- `ezform`
  - authoring-shell expectations for builder-managed field settings

## Scope

This document covers only the `Choice fields` palette section.

It does not define:

- relationship fields
- ready-made field presets
- System Fields
- backend storage design for all future dynamic-source cases

## Canonical Choice Section List

The `Choice fields` section should include these fields, in this order:

1. `single_select`
2. `multi_select`

## Shared Rules For Choice Fields

Both `Single select` and `Multi select` are option-backed model fields.

Both must support builder-side option management.

Both should move toward stable option identity instead of label-only storage.

Mandatory authoring capabilities:

- create `options`
- edit `options`
- delete `options`
- reorder `options`

Minimum shared settings:

- `displayName`
- `key`
- `description`
- `isRequired`
- `isNullable`
- `defaultValue`
- `lockState`
- `sourceType`
- `options`
- optional `orientation`
  - `vertical`
  - `horizontal`
- future stable option identity
  - `optionKey`
  - `optionLabel`

If `sourceType = static_options`, the builder must expose a user-friendly inline options editor.

## Field Matrix

### `single_select`

Functional role:

- one selected value from one managed option set

Expected default UI:

- select dropdown

Supported runtime variants:

- dropdown select
- radio group
- chips or segmented single-choice renderer
- button group

Mandatory settings:

- `sourceType`
  - `static_options`
  - `dynamic_source`
- `options`
- `allowEmpty`
- `allowCustomValues`

Recommended settings:

- `defaultValue`
- `displayLabelField`
- `storedValueField`
- `sortMode`
- `controlType`
  - `select`
  - `radio`
- `renderStyle`
  - `native`
  - `buttons`
  - `chips`
- `orientation`
  - `vertical`
  - `horizontal`
- `optionStyles`
  - available when `controlType = radio` and `renderStyle = buttons`
  - supports per-option button color styling

Authoring requirement:

- when `sourceType = static_options`, the field settings UI must include inline option management for add, edit, delete, and reorder

Current working note:

- this is the canonical base for generic non-workflow status options
- `Radio group` should remain a ready-made preset over `single_select`
- legacy `COMBOBOX (Yes/No)` should normalize to `Radio group` with default `Yes` and `No` options and `renderStyle = buttons`
- those default options remain editable and the option count may grow beyond two

### `multi_select`

Functional role:

- multiple selected values from one managed option set

Expected default UI:

- multi-select picker

Supported runtime variants:

- multi-select dropdown
- checkbox list
- chips picker
- tag-style picker
- button group

Mandatory settings:

- `sourceType`
  - `static_options`
  - `dynamic_source`
  - `tags`
- `options`
- `allowCustomValues`

Recommended settings:

- `defaultValue`
- `minSelections`
- `maxSelections`
- `displayLabelField`
- `storedValueField`
- `sortMode`
- `controlType`
  - `multi_select`
  - `checkbox`
- `renderStyle`
  - `native`
  - `buttons`
  - `chips`
- `orientation`
  - `vertical`
  - `horizontal`
- `optionStyles`
  - available when `controlType = checkbox` and `renderStyle = buttons`
  - supports per-option button color styling

Authoring requirement:

- when `sourceType = static_options`, the field settings UI must include inline option management for add, edit, delete, and reorder

Current working note:

- `Checkbox group` should remain a ready-made preset over `multi_select`
- `required = true` for checkbox-style choice may act as a shortcut for `minSelections = 1`
- `Tags` should remain a ready-made field preset over `multi_select`, not a separate base field type

## Open Backend Note

The frontend authoring contract for options management is accepted now.

The multivalue storage direction is now locked separately in:

- `form-builder-multivalue-storage-contract.md`

That contract covers report-friendly storage for:

- `multi_select`
- `tags`
- future lookup multiselect modes

Inspector-level settings for `Radio group` and `Checkbox group` are locked separately in:

- `form-builder-choice-preset-inspector-schema.md`
