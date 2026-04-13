# Form Builder Basic Fields

Status: active
Date: 2026-04-08

## Purpose

This document locks the `Basic fields` section for Platform Studio Form Builder V2.

It defines, for each basic field:

- canonical `baseType`
- functional role
- stored value shape
- type-specific model settings
- compatible field presets
- compatible runtime presets
- expected filter operators

This document is the detailed companion to:

- `form-builder-field-catalog.md`
- `form-builder-section-tree.md`
- `form-builder-v2-field-contract.md`
- `form-builder-slice-1-inspector-and-view-schema.md`
- `form-builder-backend-boundary.md`

## Source Provenance

This basic-field matrix stays grounded in the three original analysis inputs:

- `EXTDB`
  - legacy field ids and legacy type families
- `smartapp`
  - current runtime behavior, template usage, and overloaded field semantics
- `ezform`
  - builder-facing schema split and authoring-shell expectations

V2 normalization rule:

- a basic field may be renamed or clarified in V2
- but it must still be explainable from the observed behavior or structure in these three sources
- if a field looks new in V2, the document should explain whether it came from direct legacy mapping, runtime normalization, or authoring normalization

## Scope

This document covers only the `Basic fields` palette section.

It does not define:

- choice fields
- lookup and relation fields
- System Fields
- ready-made fields as their own palette section
- page or view settings
- filter-definition JSON schema

## Core Rules

- Every entry in this section is a real `baseType` on `ModelFieldDefinition`.
- A basic field is model-backed data, not just a UI block.
- `fieldPreset` may specialize a basic field, but does not replace its `baseType`.
- `runtimePreset` belongs to the view binding, not to the model field.
- `Rich text` in this section is a model field and must not be confused with the `Rich text block` content element.
- `Signature`, `Geo point`, and `Attachment` are base field types.
- `signature_pad` and `geo_capture` are runtime presets layered on top of those base field types.

## Shared Settings For All Basic Fields

Every basic field should expose these shared model-level settings:

- `displayName`
- `key`
- `description`
- `isRequired`
- `isNullable`
- `defaultValue`
- `lockState`
- optional `storage.keyOverride`
- optional `metadata`

The basic-field library should also expose these shared input and presentation settings when compatible with the underlying control:

- `placeholder`
- `inputMode`
- `autocomplete`
- `displayFormat`

Every bound field node in a view may also expose these shared view-binding settings:

- `title`
- `helperText`
- `visibility`
- `runtimePreset` when compatible

Type-specific settings below are additive to these shared settings.

## Canonical Basic Section List

The `Basic fields` section should include these fields, in this order:

1. `short_text`
2. `long_text`
3. `rich_text`
4. `integer`
5. `decimal`
6. `currency`
7. `boolean`
8. `date`
9. `date_time`
10. `signature`
11. `geo_point`
12. `attachment`

## Field Matrix

### `short_text`

Functional role:

- single-line textual value for names, identifiers, codes, titles, and short answers

Stored value shape:

- `string`

Type-specific model settings:

- `validation.minLength`
- `validation.maxLength`
- `validation.trimMode`
  - `none`
  - `trim`
- `validation.format`
  - `plain`
  - `email`
  - `phone`
  - `url`
- optional `validation.pattern`
- optional `validation.mask`
- optional `placeholder`
- optional `inputMode`
- optional `autocomplete`

Compatible field presets:

- `email`
- `phone`
- `url`

Compatible runtime presets:

- `readonly_card`

Expected filter operators:

- `eq`
- `neq`
- `contains`
- `not_contains`
- `in`
- `is_empty`
- `is_not_empty`

Current builder status:

- already represented in the placeholder runtime as `text`

### `long_text`

Functional role:

- multi-line unstructured text for notes, comments, descriptions, and narrative answers

Stored value shape:

- `string`

Type-specific model settings:

- `validation.minLength`
- `validation.maxLength`
- optional `metadata.historicalUpdates`
- optional `placeholder`
- optional `inputMode`
- optional `autocomplete`

Compatible field presets:

- none in the core section

Compatible runtime presets:

- `readonly_card`

Expected filter operators:

- `contains`
- `not_contains`
- `is_empty`
- `is_not_empty`

Current builder status:

- already represented in the placeholder runtime as `long_text`
- legacy `memo with updates` should map to `long_text` plus `metadata.historicalUpdates`

Authoring shortcut:

- `Long text historical`
  - compiles to `long_text`
  - sets `metadata.historicalUpdates = true`
  - runtime/backend should treat writes as append-history entries, not plain destructive overwrite

### `rich_text`

Functional role:

- model-backed formatted content for stored instructions, composed notes, or structured narrative fields

Stored value shape:

- sanitized HTML string

Type-specific model settings:

- optional `validation.maxLength`
- `metadata.editorProfile`
  - `basic`
  - `full`
- `metadata.sanitizeMode`
  - `strict`
  - `relaxed`
- `metadata.allowLinks`
- `metadata.allowImages`

Compatible field presets:

- none in the core section

Compatible runtime presets:

- `readonly_card`

Expected filter operators:

- `contains`
- `not_contains`
- `is_empty`
- `is_not_empty`

Current builder status:

- already represented as `rich_text` in the placeholder field-kind list
- editor foundation is not implemented yet
- recommended shared editor foundation: `Tiptap OSS`
- implementation should start in `ui-kit` and `ui-lab`, not directly inside Form Builder
- must stay separate from the non-data `Rich text block` content element

### `integer`

Functional role:

- whole-number quantity for counts, indexes, sequence values, and discrete numeric measurements

Stored value shape:

- integer number

Type-specific model settings:

- `validation.minValue`
- `validation.maxValue`
- `validation.step`
- `validation.allowNegative`
- optional `displayFormat`
- optional `metadata.unit`

Compatible field presets:

- none in the core section
- preset overlays such as `readonly_numeric` may wrap this base type from the `Ready-made fields` section later

Compatible runtime presets:

- `readonly_card`

Expected filter operators:

- `eq`
- `neq`
- `gt`
- `gte`
- `lt`
- `lte`
- `between`
- `in`
- `is_empty`
- `is_not_empty`

Current builder status:

- not yet represented as its own placeholder kind
- current placeholder `number` must be split into `integer` and `decimal`

### `decimal`

Functional role:

- fractional numeric value for measurements, ratios, scores, and precise quantities

Stored value shape:

- decimal number

Type-specific model settings:

- `validation.minValue`
- `validation.maxValue`
- `validation.step`
- `validation.precision`
- `validation.allowNegative`
- optional `displayFormat`
- optional `metadata.unit`

Compatible field presets:

- none in the core section
- preset overlays such as `readonly_numeric` may wrap this base type from the `Ready-made fields` section later

Compatible runtime presets:

- `readonly_card`

Expected filter operators:

- `eq`
- `neq`
- `gt`
- `gte`
- `lt`
- `lte`
- `between`
- `in`
- `is_empty`
- `is_not_empty`

Current builder status:

- not yet represented as its own placeholder kind
- current placeholder `number` must be split into `integer` and `decimal`

### `currency`

Functional role:

- monetary amount with fixed currency semantics

Stored value shape:

- decimal number stored as the amount
- field metadata stores the currency behavior

Type-specific model settings:

- `validation.minValue`
- `validation.maxValue`
- `validation.precision`
- `validation.allowNegative`
- optional `displayFormat`
- `metadata.currencyCode`

Compatible field presets:

- none in the core section
- preset overlays such as `readonly_numeric` may wrap this base type from the `Ready-made fields` section later

Compatible runtime presets:

- `readonly_card`

Expected filter operators:

- `eq`
- `neq`
- `gt`
- `gte`
- `lt`
- `lte`
- `between`
- `in`
- `is_empty`
- `is_not_empty`

Current builder status:

- already represented in the placeholder runtime as `currency`

### `boolean`

Functional role:

- true or false value for binary state

Stored value shape:

- `boolean`

Type-specific model settings:

- optional `defaultValue`
- optional `metadata.trueLabel`
- optional `metadata.falseLabel`

Compatible field presets:

- none in the basic-field section itself
- binary labeled choice presets should live over `single_select`, not as boolean base-type specializations

Compatible runtime presets:

- `readonly_card`

Expected filter operators:

- `eq`
- `neq`
- `is_empty`
- `is_not_empty`

Current builder status:

- already represented in the placeholder runtime as `boolean`

### `date`

Functional role:

- calendar date without time-of-day

Stored value shape:

- ISO date string

Type-specific model settings:

- `validation.minDate`
- `validation.maxDate`
- optional `displayFormat`

Compatible field presets:

- `date_today`

Compatible runtime presets:

- `readonly_card`

Expected filter operators:

- `eq`
- `neq`
- `gt`
- `gte`
- `lt`
- `lte`
- `between`
- `relative_date`
- `is_empty`
- `is_not_empty`

Current builder status:

- already represented in the placeholder runtime as `date`

### `date_time`

Functional role:

- timestamp with both date and time

Stored value shape:

- ISO date-time string

Type-specific model settings:

- `validation.minDateTime`
- `validation.maxDateTime`
- optional `displayFormat`
- `metadata.timePrecision`
  - `minute`
  - `second`
- `metadata.timezoneMode`
  - `local`
  - `utc`

Compatible field presets:

- none in the core section

Compatible runtime presets:

- `readonly_card`

Expected filter operators:

- `eq`
- `neq`
- `gt`
- `gte`
- `lt`
- `lte`
- `between`
- `relative_date`
- `is_empty`
- `is_not_empty`

Current builder status:

- already represented in the placeholder runtime as `date_time`

### `signature`

Functional role:

- captured handwritten or drawn signature tied to one record

Stored value shape:

- asset reference with optional stroke-data metadata

Type-specific model settings:

- `metadata.captureProfile`
- `metadata.storeStrokeData`
- `metadata.exportMimeType`

Compatible field presets:

- none in the core section

Compatible runtime presets:

- `signature_pad`
- `readonly_card`

Expected filter operators:

- `is_empty`
- `is_not_empty`

Current builder status:

- not yet represented in the current placeholder field-kind list
- legacy signature behavior currently leaks through title markers and should be replaced by this explicit base type

### `geo_point`

Functional role:

- geographic point stored as one latitude and longitude pair

Stored value shape:

- object with `lat` and `lng`

Type-specific model settings:

- `metadata.captureMode`
  - `device`
  - `map_pin`
  - `manual`
- `metadata.storeAccuracy`
- optional `validation.requiredAccuracyMeters`

Compatible field presets:

- none in the core section

Compatible runtime presets:

- `geo_capture`
- `readonly_card`

Expected filter operators:

- `is_empty`
- `is_not_empty`

Current builder status:

- not yet represented in the current placeholder field-kind list
- spatial operators are intentionally deferred from slice 1

### `attachment`

Functional role:

- uploaded file or file collection attached to one record

Stored value shape:

- array of attachment references

Type-specific model settings:

- `metadata.maxFiles`
- `validation.maxFileSizeMb`
- `validation.allowedMimeTypes`
- optional `metadata.captureSources`
  - `upload`
  - `camera`

Compatible field presets:

- none in the core section

Compatible runtime presets:

- `readonly_card`

Expected filter operators:

- `is_empty`
- `is_not_empty`

Current builder status:

- not yet represented in the current placeholder field-kind list

## Current Frontend Gap Relative To The Locked Basic Section

Already present in the current placeholder runtime:

- `short_text`
- `long_text`
- `currency`
- `boolean`
- `date`
- `date_time`

Partially present but still too coarse:

- `number`
  - must split into `integer` and `decimal`

Missing as explicit basic field kinds:

- `rich_text`
- `signature`
- `geo_point`
- `attachment`

## Step 2 Implication

When the team moves to the next step and fills each section completely, the `Basic fields` section should be expanded in the builder seed data and UI to include the full locked list from this document.
