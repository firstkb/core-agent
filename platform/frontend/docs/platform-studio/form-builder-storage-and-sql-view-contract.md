# Form Builder Storage And SQL View Contract

Status: active
Date: 2026-04-09

## Purpose

This document defines the concrete V2 draft for:

- physical table naming
- physical field naming
- generated SQL view naming
- lookup-derived output columns
- how SQL view outputs should surface back into Form Builder UI

Important:

- naming-specific decisions in this document are superseded by `form-builder-runtime-naming-contract-v1-1.md`
- continue using this document for the broader storage/query split, not as the latest naming authority

It exists to align:

- Form Builder authoring
- backend DDL generation
- SQL query/read surfaces
- grid and readonly display UX

## Core Separation

Platform Studio must keep these four layers separate:

1. `ModelDefinition`
   - logical business schema
2. `StorageTableDefinition`
   - physical table contract
3. `StorageViewDefinition`
   - SQL read/query contract
4. `ViewDefinition`
   - Form Builder UI layout, filters, grid, actions

Important rule:

- a Form Builder `ViewDefinition` is not the same thing as a database SQL view

Also:

- `ps_model` and `ps_view` are metadata/control-plane tables
- `ps_<root_storage_key>` and `ps_<root_storage_key>__<subform_table_key>` are generated business-data tables

## Accepted V2 Position

- each root form creates one managed root table
- each managed `Subform` creates one managed child table
- `DEFAULT` and `CHECKLIST` subforms follow the same child-table storage rule
- each storage scope also gets one canonical SQL data view
- each UI view may additionally get one SQL grid view
- lookup-derived readable columns live in SQL views, not in base tables

## Naming Policy

### Prefixes

The storage layer should use one stable prefix set.

Accepted default:

- physical table prefix: `ps_`
- SQL view prefix: `vw_ps_`

Rejected for the default contract:

- mixing `ps_` and `fb_`
- using multiple prefixes in the same runtime

Reason:

- `ps_` maps cleanly to `Platform Studio`
- `vw_ps_` keeps SQL views visibly separate from physical tables

### Multivalue Companion Table

Scopes that contain multivalue fields may also generate one multivalue bridge table.

Pattern:

- `ps_<scope_storage_key>__mv`

Examples:

- `ps_site_audit__mv`
- `ps_site_audit__findings__mv`

Purpose:

- store repeated values for:
  - `multi_select`
  - `tags`
  - dedicated lookup-multiple entries such as `DB lookup multi`, `Contacts`, `Companies`, and `Projects`

Non-applicable case:

- `DB lookup value` does not use relation-style helper outputs
- it stores the chosen scalar source value directly in the main scope table

### Scope Keys

Every generated storage object should derive from stable keys, not labels.

Recommended source keys:

- root model: `model.storageKey`
- subform: `subform.tableKey`
- UI view: `view.key`

Do not derive storage names from:

- translated labels
- current display names
- numeric temporary node ids

## Table Naming

### Root Table

Pattern:

- `ps_<root_storage_key>`

Examples:

- `ps_site_audit`
- `ps_incident`
- `ps_corrective_action`

### Subform Child Table

Pattern:

- `ps_<root_storage_key>__<subform_table_key>`

Examples:

- `ps_site_audit__findings`
- `ps_site_audit__attachments`
- `ps_incident__checklist_items`

Reason:

- the child table stays readable
- the parent scope stays obvious
- multiple subforms under one root model remain collision-safe

## Physical Column Naming

### Recommended Default

Base-table columns should stay short.

Pattern:

- scalar field: `<field_storage_key>`
- lookup foreign key: `<field_storage_key>_id`
- parent foreign key in child table: `<parent_root_key>_id`

Examples inside `ps_site_audit`:

- `site_name`
- `reported_date`
- `reported_by_id`
- `project_id`

Examples inside `ps_site_audit__findings`:

- `_id`
- `site_audit_id`
- `item_id`
- `result`
- `notes`

### Why Not Prefix Every Column With The Table Name

Rejected as the default:

- `ps_site_audit_site_name`
- `ps_site_audit_reported_date`

Reason:

- names become noisy and long
- SQL becomes harder to read
- indexes and joins become harder to inspect
- readable output naming is better solved at the SQL view layer

### System Columns

Each managed table should contain:

- `_id`
- `tenant_id`
- `_guid`
- `_created_at`
- `_updated_at`
- `_row_version`

Tenant rule:

- generated root/subform tables must persist `tenant_id`
- canonical data views must project `tenant_id`
- grid SQL views inherit `tenant_id` from their canonical data view
- tenant-aware lookup joins must include `tenant_id` when joining tenant-scoped sources such as `users`, `company`, `projects`, or managed Form Builder data views

## SQL View Generation Model

### Canonical Data View

Each storage scope gets one canonical data view.

Pattern:

- `vw_ps_<scope_storage_key>`

Examples:

- `vw_ps_site_audit`
- `vw_ps_site_audit__findings`

Purpose:

- flatten lookup labels and metadata
- expose derived readonly outputs
- provide one stable backend query surface per scope

### Grid SQL View

Each UI view may get one grid SQL view.

Pattern:

- `vw_ps_<scope_storage_key>__<view_key>_grid`

Examples:

- `vw_ps_site_audit__default_grid`
- `vw_ps_site_audit__manager_grid`
- `vw_ps_site_audit__findings__default_grid`

Reason:

- one model may own multiple Form Builder views
- grid composition is a UI-view concern, not only a model concern

Identifier-length rule:

- when the raw PostgreSQL identifier would exceed 63 bytes, the runtime must shorten it deterministically and append a hash suffix
- shortening must preserve uniqueness across sibling runtime views
- the raw authoring key remains the source identity, while the shortened SQL identifier is only the physical database name

### Grid Projection Rule

Grid SQL views must not be a full `SELECT *` clone of the canonical data view.

Accepted rule:

- always include system columns from the canonical data view:
  - `_id`
  - `tenant_id`
  - `_guid`
  - `_created_at`
  - `_updated_at`
  - `_row_version`
- child-scope grid SQL views must additionally include the parent foreign key
- then include only the visible authored bindings from `viewSettings.list.columns`

If a scope has no authored grid columns:

- still generate the grid SQL view
- project only the system columns and, for child scopes, the parent foreign key

Reason:

- grid composition is view-owned
- runtime grid width must track authored grid intent
- system columns remain available for generic backend/query flows even when the UI grid is not configured yet

### Canonical Rule

- do not generate one SQL view per random layout variant
- do generate:
  - one canonical data view per storage scope
  - zero or more grid SQL views per `ViewDefinition`

## Lookup-Derived Output Columns

### Principle

`DB lookup` fields should continue storing only the foreign key in the base table.

Human-readable and helper columns should be generated in SQL views as derived outputs.

Exception:

- `DB lookup value` stores the selected scalar source value directly
- therefore it does not require lookup-derived output columns for normal display, grid use, or filters

### Output Naming

Pattern:

- label output: `<field_storage_key>__label`
- metadata output: `<field_storage_key>__<meta_key>`

Critical rule:

- output naming is based on the field instance storage key
- do not name derived outputs only by preset family
- if two company lookups exist, each field instance must generate its own output family

Examples:

For field instance `reported_by_id`:

- `reported_by__label`
- `reported_by__title`
- `reported_by__company_name`
- `reported_by__company_id`
- `reported_by__phone`

For field instance `company_id`:

- `company__label`
- `company__type`
- `company__main_company_name`
- `company__state`

For field instance `project_id`:

- `project__label`
- `project__num`
- `project__name`
- `project__company_name`

For a second company lookup field such as `vendor_company_id`:

- `vendor_company__label`
- `vendor_company__type`
- `vendor_company__main_company_name`
- `vendor_company__state`

### Why `__`

The double underscore makes it clear that:

- this is not a physical input column
- this is a derived SQL-view output
- it belongs to the lookup family of one base field

## JSON Shapes

### `StorageTableDefinition`

```json
{
  "scopeId": "root",
  "scopeType": "ROOT",
  "bindingType": "managed",
  "tablePrefix": "ps_",
  "tableName": "ps_site_audit",
  "storageKey": "site_audit",
  "parentTableName": null,
  "parentForeignKey": null,
  "systemColumns": [
    "_id",
    "_guid",
    "_created_at",
    "_updated_at",
    "_row_version"
  ],
  "columns": [
    {
      "fieldId": "site-name",
      "fieldKey": "site_name",
      "physicalColumnName": "site_name",
      "physicalType": "text",
      "nullable": true
    },
    {
      "fieldId": "reported-by",
      "fieldKey": "reported_by",
      "physicalColumnName": "reported_by_id",
      "physicalType": "bigint",
      "nullable": true,
      "relation": {
        "kind": "lookup_fk",
        "targetSource": "users"
      }
    }
  ]
}
```

### `MultiValueStorageDefinition`

```json
{
  "scopeId": "root",
  "scopeType": "ROOT",
  "tableName": "ps_site_audit__mv",
  "storageKey": "site_audit__mv",
  "ownerForeignKey": "site_audit_id",
  "columns": [
    "_id",
    "site_audit_id",
    "field_key",
    "value_kind",
    "value_key",
    "value_label",
    "lookup_target_id",
    "sort_order"
  ]
}
```

### `StorageViewDefinition`

```json
{
  "scopeId": "root",
  "scopeType": "ROOT",
  "viewKind": "data",
  "viewKey": "canonical",
  "viewName": "vw_ps_site_audit",
  "sourceTableName": "ps_site_audit",
  "joins": [
    {
      "joinKey": "reported_by",
      "joinType": "left",
      "targetTable": "users",
      "alias": "reported_by",
      "on": "ps_site_audit.reported_by_id = reported_by.users_id"
    }
  ],
  "columns": [
    {
      "columnName": "_id",
      "sourceKind": "table_column",
      "sourceColumn": "_id"
    },
    {
      "columnName": "site_name",
      "sourceKind": "table_column",
      "sourceColumn": "site_name"
    },
    {
      "columnName": "reported_by__label",
      "sourceKind": "lookup_output",
      "originFieldId": "reported-by",
      "outputKey": "label"
    },
    {
      "columnName": "reported_by__company_name",
      "sourceKind": "lookup_output",
      "originFieldId": "reported-by",
      "outputKey": "company_name"
    }
  ]
}
```

### `LookupOutputDefinition`

```json
{
  "id": "lookup-output-reported-by-label",
  "originFieldId": "reported-by",
  "originFieldKey": "reported_by",
  "outputKey": "label",
  "columnName": "reported_by__label",
  "label": "Reported By",
  "dataType": "text",
  "outputKind": "label",
  "storageSource": "sql_view_only",
  "usableIn": {
    "formReadonly": true,
    "grid": true,
    "filters": true
  }
}
```

## Builder UI / UX Implications

### 1. Form Builder Must Not Treat Lookup Outputs As Normal Fields

Do not add lookup outputs into the main field library as createable model fields.

They should appear as:

- readonly display sources
- grid column candidates
- filter candidates where the backend exposes support

### 2. `Grid` Tab Must Support Two Binding Families

Grid columns should support:

- regular model fields
- lookup outputs

Recommended binding shape:

```json
{
  "bindingType": "lookup_output",
  "fieldId": "reported-by",
  "outputId": "lookup-output-reported-by-label",
  "visible": true,
  "order": 2
}
```

### 3. Form Layout Needs A Readonly Output Binding Node

The form runtime should support rendering a readonly display node from:

- a normal field
- a lookup-derived output

Recommended UX:

- in readonly display settings, let the user choose:
  - `Field value`
  - `Lookup output`

### 4. Filters Need Backend-Aware Output Availability

The filter editor should only expose lookup outputs that:

- exist in the generated SQL view
- are marked filterable by backend capabilities

### 5. Scope Awareness Must Stay Intact

Root and subform scopes should each surface:

- their own storage table
- their own multivalue bridge table when needed
- their own canonical data view
- their own grid SQL views

Subform outputs must not be flattened into root-level builder choices unless explicitly bridged by backend aggregation.

## Required Future Form Builder Changes

### Library And Contracts

- add `lookupOutputs[]` to the backend-facing scope payload
- add `multiValueStorage`
- add `StorageTableDefinition`
- add `MultiValueStorageDefinition`
- add `StorageViewDefinition`
- add `LookupOutputDefinition`

### Grid Tab

- support `bindingType = field | lookup_output`
- show lookup outputs grouped under the parent lookup field

### Form Display

- add readonly display binding mode for lookup outputs
- do not expose lookup outputs as editable form fields

### Filters

- allow lookup outputs as filter targets only when backend marks them supported
- keep raw SQL-view-only outputs out of ordinary field creation flows

### Debug / Schema Inspection

- show:
  - physical table name
  - canonical data view name
  - grid SQL view name(s)
  - generated lookup outputs

## Recommended First Slice

The smallest reliable first backend slice is:

1. generate one managed table per scope
2. generate one multivalue bridge table per scope only when needed
3. generate one canonical SQL data view per scope
4. generate lookup label outputs for `Contact`, `Company`, `Project`
5. expose lookup outputs in `Grid` tab only

Do not start by exposing lookup outputs everywhere in the form runtime.

Grid is the safest first proving surface.

## Companion Docs

- `data-schema-storage-rules.md`
- `form-builder-backend-boundary.md`
- `form-builder-schema-scope-contract.md`
- `form-builder-grid-columns-contract.md`
- `form-builder-view-settings-contract.md`
