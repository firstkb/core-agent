# Form Builder Ready-made Fields

Status: exact detail reference
Historical status: active
Date: 2026-04-08
Last audited: 2026-04-25
Read rule: Open only after the active Form Builder module docs, and only when exact payload/settings/history detail is needed.
Canonical active docs:

- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

## Purpose

This document locks the accepted `Ready-made fields` section for Platform Studio Form Builder V2.

These items are palette-friendly shortcuts layered on top of accepted base field types.

They are not standalone backend field primitives.

## Source Provenance

This section stays grounded in the three original analysis inputs:

- `EXTDB`
  - legacy convenience choices such as email-like text, phone-like text, today-like date defaults, and `COMBOBOX` style choice rendering
- `smartapp`
  - current runtime expectations for input behavior, ajax-backed search, and button-style option rendering
- `ezform`
  - builder-shell expectation that common authored shortcuts should appear as separate create options without becoming new base types

## Accepted Ready-made Fields

The accepted `Ready-made fields` section contains exactly:

- `Email`
- `Phone`
- `URL`
- `Suggest text`
- `Tags`
- `Date today`
- `Radio group`
- `Checkbox group`

## Preset Contract

### `Email`

Function:

- quick email field without forcing the user to start from plain `Short text`

Compile target:

- `baseType = short_text`
- `fieldPreset = email`

Locked settings:

- `placeholder`
- `autocomplete = email`
- `inputMode = email`
- `displayFormat`
- `validation = email`

### `Phone`

Function:

- quick phone field with phone-oriented entry behavior

Compile target:

- `baseType = short_text`
- `fieldPreset = phone`

Locked settings:

- `placeholder`
- `autocomplete = tel`
- `inputMode = tel`
- `displayFormat`
- `mask`
- `validation`

### `URL`

Function:

- quick link field with url-oriented validation and entry behavior

Compile target:

- `baseType = short_text`
- `fieldPreset = url`

Locked settings:

- `placeholder`
- `autocomplete = url`
- `inputMode = url`
- `displayFormat`
- `validation = url`

### `Suggest text`

Function:

- quick text field with ajax suggestions from the same field domain while still allowing a custom typed value

Compile target:

- `baseType = short_text`
- `fieldPreset = suggest_text`

Locked settings:

- `suggestConfig.sourceMode`
  - current accepted value: `same_field_distinct_values`
- `suggestConfig.searchMode`
  - `contains`
  - `prefix`
- `suggestConfig.minQueryLength`
- `suggestConfig.maxResults`
- `suggestConfig.allowCustomValue`

Detailed contract is locked in:

- `form-builder-suggest-text-field-contract-v1.md`

### `Date today`

Function:

- quick date field preconfigured with the current date as its default value

Compile target:

- `baseType = date`
- `fieldPreset = date_today`

Locked settings:

- `defaultValueMode = today`
- `displayFormat`
- `readonly`
  - optional

### `Tags`

Function:

- tag-oriented preset layered on top of `Multi select`
- supports existing tags, user-created tags, or creation-only tagging flows

Compile target:

- `baseType = multi_select`
- `fieldPreset = tags`

Locked settings:

- `tagMode`
  - `select_existing`
  - `select_or_create`
  - `create_only`
- `options`
  - available when existing tag suggestions are used
- `maxTags`
  - optional

Authoring rules:

- `select_existing`
  - user chooses only from the existing tag list
- `select_or_create`
  - user may choose from the existing tag list and create new tags
- `create_only`
  - user may enter only new tag values and is not shown an existing suggestion list

### `Radio group`

Function:

- single-choice preset rendered as radio controls or colored button choices

Compile target:

- `baseType = single_select`
- `fieldPreset = radio_group`

Locked settings:

- `options`
- `renderStyle`
  - `native`
  - `buttons`
- `orientation`
  - `vertical`
  - `horizontal`
- `optionStyles`
  - per-option color styling for button mode
- dynamic option management
  - add
  - edit
  - delete
  - reorder

Important note:

- option labels stay fully editable
- this is the accepted V2 normalization for legacy `COMBOBOX (Yes/No)` behavior

Detailed model-side inspector rules are locked in:

- `form-builder-choice-preset-inspector-schema.md`

### `Checkbox group`

Function:

- multi-choice preset rendered as checkbox controls or colored button choices

Compile target:

- `baseType = multi_select`
- `fieldPreset = checkbox_group`

Locked settings:

- `options`
- `renderStyle`
  - `native`
  - `buttons`
- `orientation`
  - `vertical`
  - `horizontal`
- `optionStyles`
  - per-option color styling for button mode
- `minSelections`
- `maxSelections`
  - optional
- dynamic option management
  - add
  - edit
  - delete
  - reorder

Detailed model-side inspector rules are locked in:

- `form-builder-choice-preset-inspector-schema.md`

## Locked Decisions

- `Radio group` and `Checkbox group` stay in `Ready-made fields`, not in `Basic fields`
- `Radio group` and `Checkbox group` are create shortcuts, not new base field types
- generic non-workflow status fields should use `Single select` or `Radio group`
- `Status` remains only in `System Fields` when workflow semantics are needed

## Companion Docs

- `form-builder-field-catalog.md`
- `form-builder-choice-fields.md`
- `form-builder-choice-preset-inspector-schema.md`
- `form-builder-section-tree.md`
