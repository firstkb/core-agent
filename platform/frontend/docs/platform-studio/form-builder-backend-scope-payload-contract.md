# Form Builder Backend Scope Payload Contract

Status: active
Date: 2026-04-09

## Purpose

This document defines the backend-facing payload contract for Form Builder V2.

It answers:

- where builder metadata should live
- how `ps_model` and `ps_view` should be used
- how `rootScope` and `subformScopes` should be serialized
- where generated storage and SQL view metadata should appear

Use `form-builder-backend-execution-plan.md` as the staged execution companion.

## Locked Stage-1 Payload Rules

The first draft API must expose enough state to support the agreed authoring lifecycle:

- a new field may still update model label before the first successful `Save`
- after the first successful `Save`, ordinary canvas rename is view-only
- remove from canvas is not delete from model
- model structure drift is driven by integer `modelStructureVersion`
- a view warning state is derived from:
  - `modelStructureVersion > lastAlignedModelStructureVersion`
- `root` may lock `model` and `view` separately
- route params keep the names `modelId` and `viewId`
- `modelId` resolves by stable model identity
- `viewId` resolves by stable view id, not `view.key`
- database `guid` stays internal and separate from the stable route key
- Form Builder save is authoring save, not site publication

## Control Plane vs Data Plane

Platform Studio V2 should separate:

- control-plane metadata tables
- generated business data tables

Control-plane metadata tables:

- `ps_model`
- `ps_view`

Generated business data tables:

- `ps_<root_storage_key>`
- `ps_<root_storage_key>__<subform_table_key>`

Important rule:

- `ps_model` and `ps_view` store builder definitions
- they do not replace generated runtime/business tables

## Accepted V2 Position

Yes, the backend should persist builder definitions separately as:

- `ps_model`
- `ps_view`

This is the recommended default.

Reason:

- `ModelDefinition` and `ViewDefinition` change at a different lifecycle than business data rows
- one model may own multiple UI views
- one view may need its own grid SQL view and view-level filters
- keeping metadata separate makes publish, versioning, and regeneration easier

## Recommended Metadata Tables

### `ps_model`

One row per logical model.

Recommended columns:

- `_id`
- `_guid`
- `model_key`
- `storage_key`
- `display_name`
- `description`
- `source_type`
- `status`
- `version`
- `structure_version`
- `definition_json`
- `_created_at`
- `_updated_at`

Identity rule:

- `model_key` is the immutable author-facing identifier used by authoring routes
- `_guid` is internal database identity
- `display_name` may change without changing `model_key`
- `status` is optional backend metadata and must not be treated as site publication state for Form Builder UX

What `definition_json` should hold in V2:

- logical field definitions
- model-level lock policy
- storage binding summary
- root data-schema metadata
- field persisted/fixed state
- projected field-storage metadata

### `ps_view`

One row per UI view.

Recommended columns:

- `_id`
- `_guid`
- `model_id`
- `view_key`
- `display_name`
- `view_type`
- `is_active`
- `is_default`
- `status`
- `version`
- `last_aligned_model_structure_version`
- `definition_json`
- `_created_at`
- `_updated_at`

Identity rule:

- `view_key` is the immutable author-facing identifier used by authoring routes
- `_guid` is internal database identity
- `display_name` may change without changing `view_key`
- `is_active` is the view-level authoring flag behind the eye indicator in the views list
- `status` is optional backend metadata and must not be treated as site publication state for Form Builder UX

What `definition_json` should hold in V2:

- root `ViewDefinition`
- root `viewSettings`
- `filterDefinitions`
- `layout`
- `grid` settings
- `rootScope`
- `subformScopes`
- current view-level lock state

## Why Not Create Separate `ps_subform_scope` Tables First

Possible later, but not required in the first slice.

Recommended first slice:

- keep one row in `ps_model`
- keep one row per authored UI view in `ps_view`
- store `rootScope` and `subformScopes` inside `definition_json`

Reason:

- simpler persistence
- fewer moving parts for V2
- scope boundaries still stay explicit in JSON
- later normalization remains possible if needed

## Backend Payload Shape

The backend-facing payload should include:

- model metadata
- view metadata
- root scope payload
- subform scope payloads

Recommended top-level shape:

```json
{
  "model": {
    "id": "mdl_site_audit",
    "key": "site_audit",
    "storageKey": "site_audit",
    "displayName": "Site Audit",
    "sourceType": "managed",
    "status": "draft",
    "version": 1,
    "modelStructureVersion": 3,
    "lockPolicy": {
      "modelLocked": false,
      "viewLocked": false
    }
  },
  "view": {
    "id": "view_default",
    "key": "default",
    "displayName": "Default",
    "viewType": "form",
    "isDefault": true,
    "status": "draft",
    "version": 1,
    "lastAlignedModelStructureVersion": 2,
    "lockState": {
      "viewLocked": false
    }
  },
  "rootScope": {},
  "subformScopes": []
}
```

## `rootScope` Shape

```json
{
  "scopeId": "root",
  "scopeType": "ROOT",
  "dataSchema": {
    "modelId": "mdl_site_audit",
    "fields": []
  },
  "uiSchema": {
    "viewId": "view_default",
    "layout": []
  },
  "storageTable": {
    "tableName": "ps_site_audit",
    "storageKey": "site_audit",
    "scopeType": "ROOT"
  },
  "multiValueStorage": {
    "tableName": "ps_site_audit__mv",
    "storageKey": "site_audit__mv",
    "ownerForeignKey": "site_audit_id"
  },
  "dataView": {
    "viewName": "vw_ps_site_audit",
    "viewKind": "data"
  },
  "gridViews": [
    {
      "viewKey": "default",
      "viewName": "vw_ps_site_audit__default_grid",
      "viewKind": "grid"
    }
  ],
  "lookupOutputs": [
    {
      "id": "lookup-output-reported-by-label",
      "originFieldId": "reported-by",
      "columnName": "reported_by__label",
      "label": "Reported By",
      "outputKind": "label"
    }
  ]
}
```

## `subformScopes[]` Shape

```json
{
  "scopeId": "subform-findings",
  "scopeType": "SUBFORM",
  "parentSubformNodeId": "node-findings",
  "subformType": "DEFAULT",
  "tableKey": "findings",
  "dataSchema": {
    "modelId": "mdl_site_audit",
    "fields": []
  },
  "uiSchema": {
    "viewId": "view_default",
    "layout": []
  },
  "storageTable": {
    "tableName": "ps_site_audit__findings",
    "storageKey": "site_audit__findings",
    "scopeType": "SUBFORM",
    "parentTableName": "ps_site_audit",
    "parentForeignKey": "site_audit_id"
  },
  "multiValueStorage": {
    "tableName": "ps_site_audit__findings__mv",
    "storageKey": "site_audit__findings__mv",
    "ownerForeignKey": "site_audit__findings_id"
  },
  "dataView": {
    "viewName": "vw_ps_site_audit__findings",
    "viewKind": "data"
  },
  "gridViews": [
    {
      "viewKey": "default",
      "viewName": "vw_ps_site_audit__findings__default_grid",
      "viewKind": "grid"
    }
  ],
  "lookupOutputs": []
}
```

## Contract Shapes

### `BackendFormBuilderPayload`

```json
{
  "model": "ModelEnvelope",
  "view": "ViewEnvelope",
  "rootScope": "BackendRootScopePayload",
  "subformScopes": ["BackendSubformScopePayload"]
}
```

### `BackendRootScopePayload`

```json
{
  "scopeId": "root",
  "scopeType": "ROOT",
  "dataSchema": "ModelDefinition",
  "uiSchema": "ViewDefinition",
  "storageTable": "StorageTableDefinition",
  "multiValueStorage": "MultiValueStorageDefinition | null",
  "dataView": "StorageViewDefinition",
  "gridViews": ["StorageViewDefinition"],
  "lookupOutputs": ["LookupOutputDefinition"]
}
```

### `BackendSubformScopePayload`

```json
{
  "scopeId": "string",
  "scopeType": "SUBFORM",
  "parentSubformNodeId": "string",
  "subformType": "DEFAULT | CHECKLIST",
  "tableKey": "string",
  "dataSchema": "ModelDefinition",
  "uiSchema": "ViewDefinition",
  "storageTable": "StorageTableDefinition",
  "multiValueStorage": "MultiValueStorageDefinition | null",
  "dataView": "StorageViewDefinition",
  "gridViews": ["StorageViewDefinition"],
  "lookupOutputs": ["LookupOutputDefinition"]
}
```

## Persistence Recommendation

### `ps_model.definition_json`

Should persist:

- logical field catalog
- storage binding summary
- root-model metadata
- `modelStructureVersion`
- lock policy and field persisted state

### `ps_view.definition_json`

Should persist:

- layout tree
- root `viewSettings`
- `filterDefinitions`
- `rootScope`
- `subformScopes`
- grid bindings
- lookup-output bindings used by the UI
- `lastAlignedModelStructureVersion`
- view-level lock state

## Builder UI / UX Implications

### What The UI Should Understand

The Form Builder should become aware that every scope can expose:

- `storageTable`
- `multiValueStorage`
- `dataView`
- `gridViews[]`
- `lookupOutputs[]`

### What The UI Should Not Do

The Form Builder should not:

- expose raw SQL object names in the normal field palette
- treat `lookupOutputs[]` as editable model fields
- let ordinary authors think in DDL terms in the default UX

### Debug / Advanced UX

The debug or advanced inspector can safely expose:

- generated table name
- canonical data view name
- grid SQL view names
- available lookup outputs
- field `Label`
- field `Storage field`

## Recommended First Backend Slice

1. persist `ps_model`
2. persist `ps_view`
3. generate `storageTable` per scope
4. generate `multiValueStorage` per scope only when needed
5. generate `dataView` per scope
6. generate `gridViews[]` per authored UI view
7. generate lookup outputs for approved lookup presets
8. return them inside `rootScope` and `subformScopes`

## Companion Docs

- `form-builder-storage-and-sql-view-contract.md`
- `form-builder-backend-boundary.md`
- `form-builder-schema-scope-contract.md`
- `data-schema-storage-rules.md`
