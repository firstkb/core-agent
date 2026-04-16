# Form Builder Schema Cleanup Contract V1

Status: active  
Date: 2026-04-15

## Purpose

This document defines the first cleanup pass for Form Builder authoring payloads.

Goal:

- keep the three-schema model
- reduce duplicated and default-only data in persisted authoring payloads
- keep canonical model naming in `dataSchema`
- move physical storage/runtime details into an explicit compiled mapping instead of forcing consumers to infer them from labels

This is a contract-cleanup document, not a storage migration script.

## Keep The Three-Schema Split

Do not collapse these layers:

- `dataSchema`
- `layoutBlueprint`
- `uiSchema`

The problem is not the three-schema split itself.
The problem is that current payloads still carry too many duplicated or default-value fields.

## Core Principles

1. `dataSchema` stays model-owned.
2. `layoutBlueprint` stays placement-owned.
3. `uiSchema` stays view-owned.
4. Physical SQL naming must not depend on `label`.
5. Other services must not guess physical column names from labels.
6. Physical storage and SQL projection details belong in a compiled runtime mapping, not in hand-authored field metadata.

## Canonical Naming Rule

`dataSchema.fields[].label` stays the canonical human-readable field name.

Rules:

- `default view` is the accepted editor of canonical field labels
- non-default views may keep local title overrides
- SQL identifiers must continue to use stable aliases such as `storageKey` and runtime aliases
- a single lookup field keeps logical `storageKey = reported_by`
- its physical base-table FK column is derived as `reported_by_id`

## Cleanup Target

The cleanup target is a sparse persisted contract:

- omit fields whose values are defaults
- omit duplicated identifiers
- omit duplicated scope keys
- omit default-view field titles when they equal the canonical label
- keep authoring payloads semantic and compact

## `dataSchema` Cleanup

### Model-Level Fields

Keep:

- `modelId`
- `modelTitle`

Current recommendation:

- keep them for now because `dataSchema` is still useful as a self-contained schema artifact
- revisit later only if the whole payload is guaranteed to travel together with top-level model metadata

### Root And Subform Scope

Keep:

- `schemaScopeId`
- `scopeType`
- `runtime`

For subforms also keep:

- `displayName`
- `subformType`
- `tableKey`

Drop when empty or default:

- empty `runtime` objects during intermediate client state if runtime has not been created yet

### Field-Level Minimum

Persist these as the minimum canonical field shape:

```json
{
  "id": "reported-by",
  "kind": "db_lookup",
  "label": "Reported By",
  "storageKey": "reported_by",
  "schemaScopeId": "root",
  "preset": "contact_lookup",
  "selectionMode": "single",
  "semanticRole": "reportedBy",
  "displayFields": ["Full name", "Email"],
  "sourceLabel": "Contacts",
  "status": "persisted"
}
```

### Remove From Persisted `dataSchema.fields[]`

Remove as duplicated or UI-derived:

- `fieldId`
- `key`
- `displayName`
- `schemaScopeKey`
- `isPersisted`

Remove when value is default:

- `autocomplete: "on"`
- `isLocked: false`

Candidate to remove after frontend compatibility cleanup:

- `family`

Reason:

- `family` is currently presentation/catalog metadata
- it can be derived from `kind`, `preset`, and accepted registry rules

### Keep Only When Semantically Needed

Keep only for the field kinds/presets that need them:

- `preset`
- `selectionMode`
- `semanticRole`
- `displayFields`
- `sourceFilters`
- `sourceLabel`
- `lookupConfig`
- `options`
- `validation`
- `mask`
- `placeholder`
- `inputMode`
- `autocomplete` when it is not the default

## `layoutBlueprint` Cleanup

`layoutBlueprint` is already relatively compact.

Keep:

- `schemaScopeId`
- `containers`
- `fieldPlacements`

Drop when empty/default:

- empty `containers`
- empty `unplacedFieldIds`

Rule:

- if a scope has no containers and no unplaced fields, store only the required placement data

## `uiSchema` Cleanup

### Field Nodes

Persist the minimum:

```json
{
  "id": "field-1776293583915-grvrt3",
  "type": "field",
  "fieldId": "reported-by",
  "order": 3
}
```

Keep only when needed:

- `parentId` when the node is inside a container
- `title` only when it is a local override
- `visibility` only when it is not `"visible"`
- `required` only when `true`
- `helperText` only when non-empty
- `rules` only when at least one requirement or visibility rule exists

### Default View Rule

For field nodes in the `default view`:

- if node title equals canonical `dataSchema.label`, do not persist `title`
- the view should resolve the visible label from `dataSchema.label`

### Non-Default View Rule

For field nodes in non-default views:

- persist `title` only when it intentionally overrides canonical label

### Scope-Level Cleanup

Drop when default/empty:

- `unplacedFieldIds: []`
- empty `filterDefinitions`
- empty `systemFields` except where system fields are actually bound
- empty `viewSettings`

### `viewSettings` Cleanup

Keep:

- explicit grid columns
- explicit per-view actions overrides
- explicit corrective-action settings

Drop when default/empty:

- `sorting.direction: "asc"` if no explicit sort field exists
- action flags that simply equal the global default
- disabled `correctiveAction` blocks with no custom config

## What Must Not Be Removed

Do not remove:

- `label` from `dataSchema`
- `storageKey` from `dataSchema`
- `runtime` from root/subform scope
- `viewSettings.list.columns`
- `systemFields`

Reason:

- these are not accidental duplicates
- they express canonical field meaning, runtime identity, and actual view behavior

## Compiled Runtime Mapping

Other services should not derive physical storage from raw labels.

Instead, backend should expose an explicit compiled runtime mapping.

Recommended shape:

```json
{
  "rootScope": {
    "tableName": "ps_test_inspection",
    "dataViewName": "vw_test_inspection",
    "systemColumns": {
      "idColumn": "_id",
      "tenantIdColumn": "tenant_id",
      "guidColumn": "_guid",
      "createdAtColumn": "_created_at",
      "updatedAtColumn": "_updated_at"
    },
    "fields": [
      {
        "fieldId": "reported-by",
        "kind": "db_lookup",
        "storageKey": "reported_by",
        "physicalColumnName": "reported_by_id",
        "dataViewColumnName": "reported_by",
        "lookupOutputColumns": [
          "reported_by__label",
          "reported_by__company_name",
          "reported_by__title",
          "reported_by__phone"
        ]
      }
    ]
  }
}
```

### Compiled Mapping Rules

For scalar fields:

- `physicalColumnName = <storageKey>`
- `dataViewColumnName = <storageKey>`

For single lookup fields:

- `physicalColumnName = <storageKey>_id`
- `dataViewColumnName = <storageKey>`

For multivalue fields:

- no single base-table `physicalColumnName`
- use multivalue table metadata instead

For subforms:

- expose `parentForeignKey`
- expose scope table name
- expose scope data view name

## Why Compiled Mapping Is Needed

This solves the `reported_by` vs `reported_by_id` confusion cleanly:

- authoring schema keeps the logical field identity
- runtime mapping exposes the exact physical storage
- consuming services do not need to guess from `kind` unless they want to

## Rollout Strategy

### Stage 1

Define the sparse target contract and compiled runtime mapping surface.

### Stage 2

Make backend/frontend save paths omit duplicated and default-value keys while still accepting the current verbose payloads on load.

### Stage 3

Update debug output and downstream integrations to prefer the sparse contract and compiled runtime mapping.

### Stage 4

Remove compatibility-only duplicated keys from persisted payloads once all active surfaces are aligned.

## Accepted V1 Decisions

- keep `label` in `dataSchema`
- keep `storageKey` in `dataSchema`
- drop duplicated field identity keys from persisted field payloads
- drop default-view field `title` when it matches canonical label
- add compiled runtime mapping for physical storage and SQL projection details
- treat `reported_by` as the logical field key and `reported_by_id` as the physical lookup FK column
