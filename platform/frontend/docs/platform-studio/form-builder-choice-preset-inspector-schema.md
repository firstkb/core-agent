# Form Builder Choice Preset Inspector Schema

Status: exact detail reference
Historical status: active
Date: 2026-04-08
Last audited: 2026-04-25
Read rule: Open only after the active Form Builder module docs, and only when exact payload/settings/history detail is needed.
Canonical active docs:

- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

## Purpose

This document locks the first exact inspector settings schema for the accepted choice presets:

- `radio_group`
- `checkbox_group`

These presets are authoring shortcuts over the canonical choice field types:

- `radio_group` -> `single_select`
- `checkbox_group` -> `multi_select`

This document exists to keep one clear boundary:

- the current slice-1 workspace inspector edits view bindings only
- the settings below belong to the model field editor or field-library inspector

This document is the detailed companion to:

- `form-builder-v2-field-contract.md`
- `form-builder-slice-1-inspector-and-view-schema.md`
- `form-builder-field-catalog.md`

Choice field and ready-made preset payload matrices were compacted into `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`.

## Source Provenance

This preset-inspector schema stays grounded in the three original analysis inputs:

- `EXTDB`
  - combobox and checklist-style choice authoring patterns
- `smartapp`
  - current button-based choice rendering, yes/no style buttons, and checklist answer buttons
- `ezform`
  - library-driven field settings and authoring-side inspector expectations

## Scope

This document defines:

- the exact inspector sections for `Radio group` and `Checkbox group`
- the accepted preset-specific settings
- the normalized settings object shape for those presets

This document does not define:

- the full generic field-library inspector
- backend storage for every option source mode
- runtime CSS implementation details
- lookup fields

## Current Acceptance Boundary

- `Radio group` is a ready-made preset over `single_select`
- `Checkbox group` is a ready-made preset over `multi_select`
- both presets are approved for static option sets
- both presets may render as native controls or as buttons
- both presets support vertical or horizontal layout
- button rendering supports per-option color styling

## Inspector Ownership

These settings belong to the model-side field editor, not the slice-1 view workspace inspector.

Meaning:

- the current `selection` tab inside the workspace should not edit these values yet
- when the field library or model field editor is introduced, these settings should appear there

## Shared Inspector Sections

Both presets should use the same high-level inspector sections:

1. `Options`
2. `Selection rules`
3. `Display`
4. `Button styles`

Shared rules:

- `sourceType` is fixed to `static_options` for these presets in the first accepted contract
- the options editor must support add, edit, delete, and reorder
- `Button styles` is shown only when `renderStyle = buttons`

## `radio_group`

Base mapping:

- `baseType = single_select`
- `fieldPreset = radio_group`
- `sourceType = static_options`

### Inspector schema

Section `Options`

- `options`
  - required ordered option editor
- `defaultValue`
  - optional single option id

Section `Selection rules`

- `allowEmpty`
  - boolean
  - default: `false`

Section `Display`

- `renderStyle`
  - enum:
    - `native`
    - `buttons`
  - default: `native`
- `orientation`
  - enum:
    - `vertical`
    - `horizontal`
  - default: `vertical`

Section `Button styles`

- `optionStyles`
  - optional ordered list keyed by option id
- each row supports:
  - `optionId`
  - `backgroundColor`
  - `textColor`
  - `borderColor`

### Normalized settings shape

```json
{
  "sourceType": "static_options",
  "options": [
    { "id": "yes", "label": "Yes", "value": "Yes" },
    { "id": "no", "label": "No", "value": "No" }
  ],
  "defaultValue": "yes",
  "allowEmpty": false,
  "display": {
    "controlType": "radio",
    "renderStyle": "buttons",
    "orientation": "horizontal"
  },
  "optionStyles": [
    {
      "optionId": "yes",
      "backgroundColor": "#2f7d32",
      "textColor": "#ffffff",
      "borderColor": "#2f7d32"
    },
    {
      "optionId": "no",
      "backgroundColor": "#d98a2b",
      "textColor": "#ffffff",
      "borderColor": "#d98a2b"
    }
  ]
}
```

### Notes

- legacy `COMBOBOX (Yes/No)` should migrate to this preset shape
- default `Yes/No` options are only starter content and remain editable
- this preset replaces the need for a separate `Yes / No` ready-made field

## `checkbox_group`

Base mapping:

- `baseType = multi_select`
- `fieldPreset = checkbox_group`
- `sourceType = static_options`

### Inspector schema

Section `Options`

- `options`
  - required ordered option editor
- `defaultValue`
  - optional array of option ids

Section `Selection rules`

- `minSelections`
  - integer
  - minimum: `0`
  - default: `0`
- `maxSelections`
  - optional integer
  - must be greater than or equal to `minSelections` when present

Section `Display`

- `renderStyle`
  - enum:
    - `native`
    - `buttons`
  - default: `native`
- `orientation`
  - enum:
    - `vertical`
    - `horizontal`
  - default: `vertical`

Section `Button styles`

- `optionStyles`
  - optional ordered list keyed by option id
- each row supports:
  - `optionId`
  - `backgroundColor`
  - `textColor`
  - `borderColor`

### Normalized settings shape

```json
{
  "sourceType": "static_options",
  "options": [
    { "id": "pass", "label": "Pass", "value": "Pass" },
    { "id": "fail", "label": "Fail", "value": "Fail" },
    { "id": "na", "label": "NA", "value": "NA" }
  ],
  "defaultValue": [],
  "minSelections": 1,
  "display": {
    "controlType": "checkbox",
    "renderStyle": "buttons",
    "orientation": "horizontal"
  },
  "optionStyles": [
    {
      "optionId": "pass",
      "backgroundColor": "#2f7d32",
      "textColor": "#ffffff",
      "borderColor": "#2f7d32"
    },
    {
      "optionId": "fail",
      "backgroundColor": "#d98a2b",
      "textColor": "#ffffff",
      "borderColor": "#d98a2b"
    },
    {
      "optionId": "na",
      "backgroundColor": "#c9ced8",
      "textColor": "#233044",
      "borderColor": "#c9ced8"
    }
  ]
}
```

### Notes

- `Checkbox group` is the accepted path for checkbox-style multi-option answers
- `required = true` should be treated only as a UI shortcut for `minSelections = 1`
- the canonical rule remains `minSelections`, not a separate ambiguous required toggle

## Validation Rules

- `defaultValue` for `radio_group` must reference one existing option id when present
- every id in `defaultValue` for `checkbox_group` must exist in `options`
- `optionStyles.optionId` must reference an existing option id
- `maxSelections` must not be lower than `minSelections`
- when `renderStyle = native`, the inspector may hide `optionStyles`

## Current Acceptance Position

Accepted now:

- `radio_group` and `checkbox_group` are presets, not base field types
- both use static options in the first approved inspector schema
- both support `native` and `buttons` rendering
- both support `vertical` and `horizontal` layout
- button rendering supports per-option colors

Still open:

- whether later phases should allow dynamic option sources for these presets
- whether chips-style rendering should become part of these presets or remain a separate single-select or multi-select display family
