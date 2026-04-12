# Form Builder Backend API Contract

Status: active
Date: 2026-04-09

## Purpose

This document defines the V2 backend lifecycle contract for:

- `loadBuilderDraft`
- `saveBuilderDraft`
- `publishBuilderDraft`

It connects:

- `ps_model`
- `ps_view`
- `rootScope`
- `subformScopes`
- generated storage tables
- canonical SQL data views
- per-view grid SQL views
- lookup-derived SQL outputs

This contract stays transport-agnostic.
It may later map to REST, RPC, or one internal gateway surface.

## Core Lifecycle Rule

The accepted V2 lifecycle is:

1. `loadBuilderDraft`
   - reads the latest builder draft
   - reads the latest publish state
   - does not mutate storage
2. `saveBuilderDraft`
   - persists builder draft metadata
   - validates authoring semantics
   - computes normalized storage/view names
   - does not run DDL
3. `publishBuilderDraft`
   - performs full backend validation
   - reconciles generated storage objects
   - marks model and view versions as published

Important rule:

- `saveBuilderDraft` must never create or alter generated business tables or SQL views
- `publishBuilderDraft` is the only accepted operation that may mutate generated storage objects

## Control Plane vs Generated Objects

### Control Plane

Builder metadata is stored in:

- `ps_model`
- `ps_view`

### Generated Data Plane

Published managed storage is generated as:

- `ps_<root_storage_key>`
- `ps_<root_storage_key>__<subform_table_key>`
- `vw_ps_<scope_storage_key>`
- `vw_ps_<scope_storage_key>__<view_key>_grid`

Important rule:

- `ps_model` and `ps_view` are not business-data tables
- they store authored definitions and lifecycle state

## Ownership Split

### `ps_model` owns

- logical model identity
- model key and storage key
- logical field registry
- structure lock state
- source type
- model version
- model published version
- model-level storage binding summary

### `ps_view` owns

- view identity
- view key and default-view status
- current authored layout
- current authored `viewSettings`
- current authored `filterDefinitions`
- current authored `rootScope`
- current authored `subformScopes`
- view version
- view published version
- latest publish summary for generated view artifacts

## Draft And Publish State

### Recommended Status Vocabulary

Recommended shared status values:

- `draft`
- `published`
- `dirty`
- `archived`

Recommended meaning:

- `draft`
  - row exists but has never been published
- `published`
  - latest saved version is already published
- `dirty`
  - a newer saved draft exists beyond the last published version
- `archived`
  - no longer active for authoring

### Version Rule

Both model and view should carry:

- `version`
- `publishedVersion`

Recommended rule:

- if `version == publishedVersion`, the row is publish-aligned
- if `version > publishedVersion`, the row is dirty

## Operation Contract

## `loadBuilderDraft`

### Purpose

Load the current authored draft and the latest known publish state for one model and one view.

### Request

```json
{
  "modelRef": {
    "id": "mdl_site_audit"
  },
  "viewRef": {
    "id": "view_default"
  },
  "includePublishedArtifacts": true
}
```

Accepted reference forms:

- `id`
- `key`

Recommended resolution rule:

- `modelRef` is required
- `viewRef` is optional only if the backend can resolve one default authored view for the model

### Response

```json
{
  "draft": {
    "model": {},
    "view": {},
    "rootScope": {},
    "subformScopes": []
  },
  "publishState": {
    "modelVersion": 12,
    "modelPublishedVersion": 10,
    "viewVersion": 18,
    "viewPublishedVersion": 17,
    "hasUnpublishedChanges": true,
    "lastPublishedAt": "2026-04-09T13:22:00Z",
    "lastPublishedBy": "usr_123"
  },
  "publishedArtifacts": {
    "rootScope": {},
    "subformScopes": []
  },
  "validationSummary": {
    "canSave": true,
    "canPublish": true,
    "errors": [],
    "warnings": []
  }
}
```

### Behavior

- read `ps_model` and `ps_view`
- return the latest draft definition bundle
- return the latest publish-state metadata
- return the latest published generated-object summary when requested
- do not recompute or mutate storage as a side effect

## `saveBuilderDraft`

### Purpose

Persist the latest builder draft without applying publish-time storage mutations.

### Request

```json
{
  "expectedVersions": {
    "model": 12,
    "view": 18
  },
  "draft": {
    "model": {},
    "view": {},
    "rootScope": {},
    "subformScopes": []
  }
}
```

### Required Behavior

`saveBuilderDraft` must:

- validate JSON shape and required contract keys
- validate scope correctness
- validate root-only concerns stay on root scope
- validate `Section` root-only placement inside each scope
- validate `CHECKLIST` subform constraints
- validate stable key uniqueness
- normalize storage object names from stable keys
- persist model-owned and view-owned concerns separately
- update versions only for the surfaces that changed

`saveBuilderDraft` must not:

- create or alter `ps_<root_storage_key>` tables
- create or alter child tables
- create or alter SQL data views
- create or alter SQL grid views

### Persistence Mapping

Recommended first-slice mapping:

- update `ps_model` when logical model concerns changed
- update `ps_view` when view/layout/filter/grid concerns changed

Typical model-owned draft concerns:

- `model.key`
- `model.storageKey`
- logical field registry
- subform storage keys
- lock policy

Typical view-owned draft concerns:

- `view.key`
- layout tree
- `viewSettings`
- `filterDefinitions`
- `rootScope.uiSchema`
- `subformScopes[].uiSchema`
- `rootScope.viewSettings`
- `subformScopes[].viewSettings`

### Response

```json
{
  "draft": {
    "model": {},
    "view": {},
    "rootScope": {},
    "subformScopes": []
  },
  "publishState": {
    "modelVersion": 13,
    "modelPublishedVersion": 10,
    "viewVersion": 19,
    "viewPublishedVersion": 17,
    "hasUnpublishedChanges": true
  },
  "validationSummary": {
    "canSave": true,
    "canPublish": true,
    "errors": [],
    "warnings": []
  }
}
```

### No-Op Rule

Recommended rule:

- if the normalized incoming draft is identical to the persisted draft, return the same version tokens without incrementing versions

## `publishBuilderDraft`

### Purpose

Apply full validation and reconcile generated storage objects for the current draft.

### Request

```json
{
  "modelRef": {
    "id": "mdl_site_audit"
  },
  "viewRef": {
    "id": "view_default"
  },
  "expectedVersions": {
    "model": 13,
    "view": 19
  },
  "publishMode": "apply"
}
```

Accepted `publishMode` values:

- `apply`
- `validate_only`

Recommended default:

- `apply`

### Required Behavior

`publishBuilderDraft` must:

- load the latest saved draft
- enforce optimistic concurrency with `expectedVersions`
- run full publish-time validation
- compute the storage plan for root and subform scopes
- reconcile managed tables
- reconcile canonical SQL data views
- reconcile per-view SQL grid views
- compute and persist lookup-derived SQL outputs
- mark model and view published versions
- persist publish summary metadata

### Validation At Publish Time

Publish must reject:

- storage naming collisions
- illegal structural changes under lock
- unsupported destructive storage mutations
- invalid parent-child subform storage relationships
- invalid lookup-output generation definitions
- invalid grid columns against current field or lookup-output registry
- invalid `CHECKLIST` composition

### First-Slice Publish Safety Rule

Recommended first-slice limitation:

- allow additive and compatible storage mutations
- reject destructive or ambiguous schema mutations unless a future migration mode is explicitly introduced

Examples that may be rejected in the first slice:

- changing one published field to an incompatible base type
- changing a published subform table key
- removing a published field that still backs data or grid outputs

### Response

```json
{
  "draft": {
    "model": {},
    "view": {},
    "rootScope": {},
    "subformScopes": []
  },
  "publishState": {
    "modelVersion": 13,
    "modelPublishedVersion": 13,
    "viewVersion": 19,
    "viewPublishedVersion": 19,
    "hasUnpublishedChanges": false,
    "lastPublishedAt": "2026-04-09T14:05:00Z",
    "lastPublishedBy": "usr_123"
  },
  "storageResults": {
    "rootScope": {
      "table": {
        "name": "ps_site_audit",
        "action": "reused"
      },
      "dataView": {
        "name": "vw_ps_site_audit",
        "action": "recreated"
      },
      "gridViews": [
        {
          "name": "vw_ps_site_audit__default_grid",
          "action": "recreated"
        }
      ],
      "lookupOutputs": [
        {
          "columnName": "reported_by__label",
          "outputKind": "label",
          "action": "recreated"
        }
      ]
    },
    "subformScopes": []
  },
  "validationSummary": {
    "canSave": true,
    "canPublish": true,
    "errors": [],
    "warnings": []
  }
}
```

### Idempotency Rule

Recommended rule:

- repeated publish with the same draft versions and no unresolved drift should return a successful no-op or `reused` storage result instead of creating duplicate objects

## Scope Object Responsibilities During Publish

### Root Scope

For `rootScope`, publish may reconcile:

- one root managed table
- one canonical root SQL data view
- zero or more grid SQL views for the current view
- lookup-derived readable outputs for root lookup fields

### Subform Scopes

For each `subformScope`, publish may reconcile:

- one managed child table
- one canonical child-scope SQL data view
- zero or more child-scope grid SQL views for `DEFAULT` subforms
- lookup-derived readable outputs for child lookup fields

Important rule:

- `CHECKLIST` does not remove the child-table boundary
- `CHECKLIST` simply changes runtime orchestration and child-scope validation rules

## Multiple Views Per Model

One model may own multiple UI views.

This creates two publish layers:

- model-scope artifacts
  - tables
  - canonical SQL data views
- view-scope artifacts
  - grid SQL views
  - view publish summary

Recommended rule:

- publishing one view may still reconcile model-scope artifacts if the current saved draft changed model-owned structure
- grid SQL views stay tied to the specific `view.key`

## Structured Error Contract

Recommended error result shape:

```json
{
  "error": {
    "code": "version_conflict",
    "message": "The draft is stale.",
    "details": {}
  }
}
```

Recommended error codes:

- `not_found`
- `version_conflict`
- `validation_failed`
- `lock_violation`
- `storage_collision`
- `external_source_incompatible`
- `migration_mode_required`
- `publish_failed`

## Recommended Backend Payload Types

### `LoadBuilderDraftResponse`

```json
{
  "draft": "BackendFormBuilderPayload",
  "publishState": "BuilderPublishState",
  "publishedArtifacts": "PublishedArtifactSummary",
  "validationSummary": "BuilderValidationSummary"
}
```

### `SaveBuilderDraftRequest`

```json
{
  "expectedVersions": {
    "model": "number",
    "view": "number"
  },
  "draft": "BackendFormBuilderPayload"
}
```

### `PublishBuilderDraftRequest`

```json
{
  "modelRef": "ModelRef",
  "viewRef": "ViewRef",
  "expectedVersions": {
    "model": "number",
    "view": "number"
  },
  "publishMode": "apply | validate_only"
}
```

### `BuilderPublishState`

```json
{
  "modelVersion": "number",
  "modelPublishedVersion": "number",
  "viewVersion": "number",
  "viewPublishedVersion": "number",
  "hasUnpublishedChanges": "boolean",
  "lastPublishedAt": "ISO datetime",
  "lastPublishedBy": "string"
}
```

### `PublishedArtifactSummary`

```json
{
  "rootScope": {
    "storageTable": "StorageTableDefinition",
    "dataView": "StorageViewDefinition",
    "gridViews": ["StorageViewDefinition"],
    "lookupOutputs": ["LookupOutputDefinition"]
  },
  "subformScopes": [
    {
      "scopeId": "string",
      "storageTable": "StorageTableDefinition",
      "dataView": "StorageViewDefinition",
      "gridViews": ["StorageViewDefinition"],
      "lookupOutputs": ["LookupOutputDefinition"]
    }
  ]
}
```

## UI/UX Implications For Form Builder

The frontend builder should assume:

- `loadBuilderDraft` returns the latest normalized draft and publish state
- `saveBuilderDraft` may return canonicalized keys or storage names
- `publishBuilderDraft` returns the latest generated storage summary

The frontend should show:

- draft vs published state
- stale-write conflicts
- publish errors separately from save errors
- generated grid and lookup-output availability only after the backend confirms them

Recommended UI rule:

- do not pretend that generated storage artifacts already exist after `saveBuilderDraft`
- treat them as planned or projected until `publishBuilderDraft` succeeds

## Companion Contracts

- `form-builder-backend-boundary.md`
- `form-builder-storage-and-sql-view-contract.md`
- `form-builder-backend-scope-payload-contract.md`
- `form-builder-backend-validation-matrix.md`
- `form-builder-backend-object-generation-matrix.md`
- `form-builder-backend-migration-policy.md`
