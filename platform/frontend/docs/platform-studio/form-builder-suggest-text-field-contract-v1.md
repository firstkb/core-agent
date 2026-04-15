# Suggest Text Field Contract v1

Status: accepted
Date: 2026-04-15

## Purpose

This document defines the missing free-text suggestion field required for static models and ordinary managed models.

It covers the case where the user needs:

- combobox-like text entry
- ajax search suggestions
- suggestions built from existing values of the same domain
- the ability to type a new custom value
- plain text storage instead of a foreign-key relation

## Accepted Position

`Suggest text` is accepted as a ready-made preset over `short_text`.

It is not:

- a new base storage primitive
- a `db_lookup`
- a `single_select`
- a tag or multivalue field

Compile target:

- `baseType = short_text`
- `fieldPreset = suggest_text`

## Functional Role

`Suggest text` is for text fields where:

- existing values should help the user through suggestions
- the saved value remains a scalar string
- the user is not forced to choose from a locked dictionary

Typical examples:

- city
- trade
- department name
- free-text classification with recurring existing values

## Storage Contract

Stored value shape:

- `string`

Accepted rules:

- the stored value is plain text
- no foreign key is stored
- no helper lookup output columns are generated
- grid, filters, and form display use the stored text directly

## Suggestion Source Contract

Current accepted source mode:

- distinct existing values from the same logical field domain

Working model:

- backend queries distinct non-empty values
- suggestions are filtered by the current search string
- suggestions are tenant-scoped where the model is tenant-scoped

Current accepted v1 source rule:

- the suggestion source is the same model field domain
- do not introduce arbitrary cross-table suggestion sources in v1

## Authoring Contract

Example field shape:

```json
{
  "family": "preset",
  "id": "city",
  "kind": "short_text",
  "label": "City",
  "displayName": "City",
  "fieldId": "city",
  "storageKey": "city",
  "schemaScopeId": "root",
  "status": "persisted",
  "preset": "suggest_text",
  "suggestConfig": {
    "sourceMode": "same_field_distinct_values",
    "searchMode": "contains",
    "minQueryLength": 1,
    "maxResults": 20,
    "allowCustomValue": true
  }
}
```

## Locked Settings

`suggest_text` supports:

- `suggestConfig.sourceMode`
  - current accepted value: `same_field_distinct_values`
- `suggestConfig.searchMode`
  - `contains`
  - `prefix`
- `suggestConfig.minQueryLength`
- `suggestConfig.maxResults`
- `suggestConfig.allowCustomValue`

Current accepted defaults:

- `sourceMode = same_field_distinct_values`
- `searchMode = contains`
- `minQueryLength = 1`
- `maxResults = 20`
- `allowCustomValue = true`

## Runtime Behavior

The runtime input behaves like a searchable combobox.

Accepted behavior:

- the user may type freely
- ajax suggestions appear while typing
- the user may choose one existing suggestion
- the user may keep a custom value that is not in the suggestion list
- selecting a suggestion writes its text value into the field
- clearing the field returns the stored value to empty text or null according to normal `short_text` nullability rules

## Backend Boundary

The backend suggestion endpoint should:

- query the same field domain
- return distinct, non-empty values
- filter by query string
- apply tenant scoping when the model is tenant-scoped
- return only text suggestions

Not accepted in v1:

- cross-table custom SQL sources
- grouped suggestion sections
- FK persistence
- automatic conversion into lookup fields

## Boundary Against Other Field Types

Use `suggest_text` when:

- the value must stay text
- suggestions are helpful but not mandatory
- the owner wants both select-existing and write-new behavior

Do not use `suggest_text` when:

- the value must preserve a durable relation key
  - use `db_lookup`
- the value must be restricted to a fixed list
  - use `single_select`
- multiple values must be stored
  - use `multi_select` or `tags`

## Grid And Filter Behavior

`Suggest text` follows `short_text` semantics for:

- grid display
- sort behavior
- filters

Expected filter operators:

- `eq`
- `neq`
- `contains`
- `not_contains`
- `in`
- `is_empty`
- `is_not_empty`

## Accepted Registry Position

`Suggest text` is a ready-made preset.

Accepted palette projection:

- `Ready-made fields` -> `Suggest text`

Accepted compile identity:

- `baseType = short_text`
- `fieldPreset = suggest_text`

## Companion Docs

- `form-builder-ready-made-fields.md`
- `form-builder-v2-field-contract.md`
- `form-builder-core-data-fields.md`
- `form-builder-static-models-execution-plan-v1.md`
