# Static Models Schema Contract v1

Status: accepted
Date: 2026-04-15

## Purpose

This document freezes the final `Data Schema` and `UI Schema` contract for Static Models Integration v1.

It is the source of truth for:

- static model `ps_model.definition_json`
- static model `ps_view.definition_json`
- required runtime metadata on static model scopes
- the ownership split between `dataSchema`, `layoutBlueprint`, and `uiSchema`
- what static model metadata is required before seed migrations are written

This document does not define the per-table field map itself.
That remains table-specific work.

## Scope

This contract applies to the first static-model slice for:

- `company`
- `companytype`
- `events`
- `jobtype`
- `mails`
- `projects`
- `state`
- `timezone`
- `users`

Current first-slice rule:

- static models in this slice are root-scope models
- they do not introduce Form Builder subform scopes in the initial seed
- `projectsaccess` remains outside this contract and outside the first static-model seed

## Ownership Split

Static models follow the same three-schema ownership split as managed models.

`ps_model.definition_json` owns:

- `dataSchema`
- `layoutBlueprint`

`ps_view.definition_json` owns:

- `uiSchema`

Accepted rule:

- one static model owns one canonical `dataSchema`
- one static model owns one canonical `layoutBlueprint`
- each authored static-model view owns its own `uiSchema`
- the default view remains the primary editor for the shared model-owned layout

## Static Model Source Type

Static models use:

- `sourceType = external`

Accepted meaning:

- Form Builder does not own the physical source table
- Form Builder does own the managed canonical data view `vw_*`
- Form Builder does own the authored grid views `vg_*`

## Frozen Data Schema Contract

### Required Top-Level Shape

Static-model `ps_model.definition_json` must contain:

```json
{
  "dataSchema": {
    "modelId": "users",
    "modelTitle": "Users",
    "rootScope": {},
    "subformScopes": []
  },
  "layoutBlueprint": {
    "rootScope": {},
    "subformScopes": []
  }
}
```

Current first-slice rule:

- `subformScopes` is an empty array for static models
- do not omit it

### `dataSchema.rootScope`

Static-model `dataSchema.rootScope` must contain:

- `schemaScopeId = "root"`
- `scopeType = "ROOT"`
- `fields`
- `runtime`

Example:

```json
{
  "schemaScopeId": "root",
  "scopeType": "ROOT",
  "fields": [],
  "runtime": {
    "rtAlias": "users",
    "tableName": "users",
    "mvTableName": "",
    "dataViewName": "vw_users",
    "sourceIdColumn": "id",
    "sourceTenantIdColumn": "tenant_id",
    "sourceGuidColumn": "guid",
    "sourceCreatedAtColumn": "created_at",
    "sourceUpdatedAtColumn": "updated_at"
  }
}
```

Accepted rules:

- `runtime` is required
- `tableName` points to the canonical tenant table
- `dataViewName` points to the Form Builder-managed canonical read surface
- explicit source system-column mapping is required for static models
- static models must not rely on runtime heuristics for system columns

### `dataSchema.rootScope.fields`

`fields` contains only authored business fields and explicit custom/widget fields.

Accepted rules:

- do not include raw storage-system columns as ordinary business fields
- do not include sensitive fields that must never become authorable fields
- field order in `dataSchema` is canonical model order, not one specific view order
- every static-model field must have a stable `fieldId`
- every static-model field must have a stable `storageKey`

Explicit exclusion already accepted:

- `users.password`

### Static Field Source Mapping

Static-model fields must carry explicit source mapping.

Example scalar field:

```json
{
  "family": "core",
  "id": "email",
  "kind": "short_text",
  "label": "Email",
  "displayName": "Email",
  "fieldId": "email",
  "storageKey": "email",
  "schemaScopeId": "root",
  "status": "persisted",
  "runtime": {
    "sourceColumnName": "email",
    "sourceValueKind": "scalar"
  }
}
```

Example lookup field:

```json
{
  "family": "preset",
  "id": "company-id",
  "kind": "db_lookup",
  "label": "Business Unit",
  "displayName": "Business Unit",
  "fieldId": "company-id",
  "storageKey": "company_id",
  "schemaScopeId": "root",
  "status": "persisted",
  "runtime": {
    "sourceColumnName": "company_id",
    "sourceValueKind": "lookup_id"
  }
}
```

Example custom widget field:

```json
{
  "family": "custom",
  "id": "project-access-manager",
  "kind": "custom_widget",
  "label": "Project Access",
  "displayName": "Project Access",
  "fieldId": "project-access-manager",
  "storageKey": "project_access_manager",
  "schemaScopeId": "root",
  "status": "persisted",
  "widgetKey": "project_access_manager",
  "runtime": {
    "sourceValueKind": "virtual"
  }
}
```

Accepted `sourceValueKind` values for this slice:

- `scalar`
- `lookup_id`
- `virtual`

Accepted rules:

- static models must store `runtime.sourceColumnName` for every source-backed field
- `virtual` fields do not need a `sourceColumnName`
- static-model runtime mapping must be explicit even when `storageKey` and source column are identical

## Frozen Layout Blueprint Contract

### Required Top-Level Shape

`layoutBlueprint` must contain:

```json
{
  "rootScope": {
    "schemaScopeId": "root",
    "containers": [],
    "fieldPlacements": [],
    "unplacedFieldIds": []
  },
  "subformScopes": []
}
```

Accepted rules:

- the shared static-model layout belongs to `layoutBlueprint`
- it is model-owned, not view-owned
- authored views must not fork the canonical layout structure into separate model shapes

### Root Layout Rule

Static models may still use:

- scope-root placements through `__scope_root__`
- root-level sections
- root-level groups
- other accepted layout containers already covered by the three-schema contract

Accepted rule:

- the default view remains the primary editor of the shared static-model layout
- secondary views consume that shared layout and apply their own `uiSchema` composition rules

## Frozen UI Schema Contract

### Required Top-Level Shape

Every authored static-model view must contain:

```json
{
  "uiSchema": {
    "rootScope": {},
    "subformScopes": []
  }
}
```

Current first-slice rule:

- `subformScopes` is an empty array for static models
- do not omit it

### `uiSchema.rootScope`

`uiSchema.rootScope` must contain:

- `schemaScopeId = "root"`
- `nodes`
- `unplacedFieldIds`
- `filterDefinitions`
- `viewSettings`
- `runtime`

Example:

```json
{
  "schemaScopeId": "root",
  "nodes": [],
  "unplacedFieldIds": [],
  "filterDefinitions": {
    "defaultFilters": {
      "conditions": [],
      "logic": "and"
    },
    "quickFilters": [],
    "version": 1
  },
  "viewSettings": {
    "actions": {
      "canAdd": true,
      "canDelete": true,
      "canEdit": true,
      "canView": true
    },
    "list": {
      "columns": [],
      "sorting": {
        "direction": "asc"
      }
    }
  },
  "runtime": {
    "viewRtAlias": "default",
    "dataViewName": "vw_users",
    "gridViewName": "vg_users__default"
  }
}
```

Accepted rules:

- `runtime` is required on every authored static-model view
- `gridViewName` is view-owned and varies per authored view
- `dataViewName` is shared across views of the same model root scope

### `uiSchema.rootScope.nodes`

`nodes` stores only view-local authored composition:

- field titles
- helper text
- local visibility
- node order
- local field placement
- custom content nodes

Accepted rules:

- `uiSchema.nodes` is allowed to override field titles locally
- local title overrides do not change the canonical SQL column contract
- in the default view, the field title editor may update canonical `dataSchema.label`
- default-view label-only rename is metadata-only and must not advance structure-drift state
- in non-default views, local title overrides do not change `dataSchema.label`

### `viewSettings.list.columns`

For static models, `viewSettings.list.columns` must include the full grid-eligible field set for the current view with `visible` flags.

Accepted rules:

- each grid-eligible field appears at most once
- grid visibility is view-owned
- non-grid fields and widget-only fields may be excluded
- saving one view must not mutate another view's grid column state

Why this is frozen:

- it prevents selected columns from disappearing after save
- it lets the grid picker preserve hidden-but-available columns deterministically

## Multi-View Rule For Static Models

Static models may own multiple authored views.

Accepted rules:

- one model may seed one or more authored views
- each authored view owns its own `uiSchema`
- all authored views share one canonical `dataSchema`
- all authored views share one canonical `layoutBlueprint`
- all authored views share one canonical `vw_*`
- each authored view owns its own `vg_*`

Example:

- `users`
  - canonical data view: `vw_users`
  - authored views:
    - `Contacts` -> `vg_users__default`
    - `List of Accounts` -> `vg_users__accounts`

## Contract Freeze For The Current Slice

The following are now frozen for static models:

1. static models use the same three-schema split as managed models
2. static models are root-scope-only in the first seed slice
3. static models require explicit scope runtime metadata
4. static models require explicit field source mapping
5. static models keep one canonical `vw_*` per scope
6. static models keep one `vg_*` per authored view
7. static-model `uiSchema.rootScope.viewSettings.list.columns` stores the full available grid field set with `visible` flags

## Companion Docs

- `form-builder-three-schema-contract.md`
- `form-builder-backend-scope-payload-contract.md`
- `form-builder-static-models-integration-v1.md`
- `form-builder-static-models-execution-plan-v1.md`
- `form-builder-static-models-migration-draft-v1.md`
