# Form Builder Backend API Contract

Status: active
Date: 2026-04-09

## Purpose

This document defines the V2 backend lifecycle contract for:

- `loadBuilderDraft`
- `saveBuilderDraft`
- the additive runtime-apply contour executed from `saveBuilderDraft`
- a future explicit migration operation reserved for later

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

Important current note:

- the current required Form Builder contract is about authoring-state load/save plus additive runtime apply
- model/view `status` is not part of the first mandatory product-facing contract
- canonical REST transport naming for authoring-state load/save is `/authoring`; if `draft` appears in operation names or temporary routes, treat it only as a compatibility alias for authoring state, not as the user-facing lifecycle
- site publication and privileges are deferred to Navigation Builder

## Core Lifecycle Rule

The accepted V2 lifecycle is:

1. `loadBuilderDraft`
   - reads the latest builder draft
   - reads the latest runtime-apply state
   - does not mutate storage
2. `saveBuilderDraft`
   - persists builder draft metadata
   - validates authoring semantics
   - computes normalized storage/view names
   - after a successful authoring persist, starts one additive runtime-apply contour
   - may create missing managed tables
   - may add missing columns to existing managed tables
   - may create or deterministically recreate canonical SQL data views
   - may create or deterministically recreate grid SQL views
   - must not delete tables, columns, or SQL views
   - must keep the saved authoring state even if runtime apply fails
3. future explicit migration operation
   - reserved for later destructive or ambiguous storage changes
   - not part of the current product-facing lifecycle

Important rule:

- `saveBuilderDraft` now owns additive runtime reconciliation for managed storage
- site publication and privileges still belong to Navigation Builder, not to Form Builder `Save`
- destructive storage changes remain out of scope for ordinary `Save`

## Control Plane vs Generated Objects

### Control Plane

Builder metadata is stored in:

- `ps_model`
- `ps_view`

### Generated Data Plane

Managed storage applied from `saveBuilderDraft` is generated as:

- `ps_<root_storage_key>`
- `ps_<root_storage_key>__<subform_table_key>`
- `vw_ps_<scope_storage_key>`
- `vw_ps_<scope_storage_key>__<view_key>_grid`

Important rule:

- `ps_model` and `ps_view` are not business-data tables
- they store authored definitions and runtime state

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

## Draft And Runtime State

### Deferred Status Vocabulary

This section is deferred until a broader runtime lifecycle becomes active.
Do not treat it as required for the current product-facing implementation.

Possible shared status values later:

- `draft`
- `published`
- `dirty`
- `archived`

Recommended meaning:

- `draft`
  - row exists but has never completed runtime apply
- `published`
  - legacy compatibility label only; do not use this as the primary Form Builder UX concept
- `dirty`
  - a newer saved authoring version exists beyond the last successfully applied runtime version
- `archived`
  - no longer active for authoring

### Version Rule

Both model and view should carry:

- `version`
- `publishedVersion`

Recommended rule:

- if `version == publishedVersion`, the row is runtime-aligned
- if `version > publishedVersion`, the row has saved authoring changes beyond the last successful runtime apply

## Operation Contract

## `loadBuilderDraft`

### Purpose

Load the current authored draft and the latest known runtime-apply state for one model and one view.

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
  "runtimeApply": {
    "status": "failed",
    "message": "Authoring was saved, but runtime apply did not complete.",
    "storageResults": {
      "rootScope": {},
      "subformScopes": []
    }
  },
  "validationSummary": {
    "canSave": true,
    "canPublish": false,
    "errors": [],
    "warnings": []
  }
}
```

### Behavior

- read `ps_model` and `ps_view`
- return the latest draft definition bundle
- return the latest runtime-alignment metadata
- return the latest generated-object summary when requested
- do not recompute or mutate storage as a side effect

## `saveBuilderDraft`

### Purpose

Persist the latest builder draft, then run additive runtime apply without destructive storage mutations.

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
- after a successful authoring persist, reconcile additive-safe managed runtime storage

`saveBuilderDraft` runtime apply may:

- create missing `ps_<root_storage_key>` tables
- create missing child tables
- add missing columns to existing managed tables
- create or deterministically recreate SQL data views
- create or deterministically recreate SQL grid views

`saveBuilderDraft` runtime apply must not:

- delete tables
- delete columns
- delete SQL views
- perform destructive rename/move migration
- rollback the already-saved authoring draft when runtime apply fails

### Runtime-Apply Failure Rule

If runtime apply fails after the authoring draft has already been persisted:

- the saved authoring state remains authoritative
- the operation returns a runtime failure summary
- the UI must surface this as:
  - authoring saved
  - runtime apply failed
- the workspace remains conceptually dirty relative to runtime until the next successful `Save`

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
    "canPublish": false,
    "errors": [],
    "warnings": []
  }
}
```

### No-Op Rule

Recommended rule:

- if the normalized incoming draft is identical to the persisted draft, return the same version tokens without incrementing versions

## Future Explicit Migration Operation

The older `publishBuilderDraft` concept is no longer the current product-facing lifecycle.

Current accepted rule:

- ordinary `Save` already performs additive runtime apply
- destructive or ambiguous changes remain blocked
- a future explicit migration operation may later handle:
  - rename with mapping
  - destructive drops
  - scope moves with data preservation
  - reviewed migration workflows

That future operation is reserved and intentionally unspecified in the current implementation slice.

## Scope Object Responsibilities During Runtime Apply

### Root Scope

For `rootScope`, runtime apply from `saveBuilderDraft` may reconcile:

- one root managed table
- one canonical root SQL data view
- zero or more grid SQL views for the current view
- lookup-derived readable outputs for root lookup fields

### Subform Scopes

For each `subformScope`, runtime apply from `saveBuilderDraft` may reconcile:

- one managed child table
- one canonical child-scope SQL data view
- zero or more child-scope grid SQL views for `DEFAULT` subforms
- lookup-derived readable outputs for child lookup fields

Important rule:

- `CHECKLIST` does not remove the child-table boundary
- `CHECKLIST` simply changes runtime orchestration and child-scope validation rules

## Multiple Views Per Model

One model may own multiple UI views.

This creates two runtime layers:

- model-scope artifacts
  - tables
  - canonical SQL data views
- view-scope artifacts
  - grid SQL views
  - view runtime summary

Recommended rule:

- saving one view may still reconcile model-scope artifacts if the current saved draft changed model-owned structure
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
- `runtime_apply_failed`

## Recommended Backend Payload Types

### `LoadBuilderDraftResponse`

```json
{
  "draft": "BackendFormBuilderPayload",
  "publishState": "BuilderRuntimeState",
  "publishedArtifacts": "PublishedArtifactSummary",
  "runtimeApply": "RuntimeApplySummary",
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

### `BuilderRuntimeState`

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

### `RuntimeApplySummary`

```json
{
  "status": "applied | applied_with_warnings | failed",
  "message": "string",
  "storageResults": "PublishedArtifactSummary"
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

- `loadBuilderDraft` returns the latest normalized draft and runtime state
- `saveBuilderDraft` may return canonicalized keys or storage names
- `saveBuilderDraft` also returns the latest runtime-apply summary

The frontend should show:

- saved authoring state vs runtime-applied state
- stale-write conflicts
- runtime-apply errors separately from authoring-save errors
- generated grid and lookup-output availability only after the backend confirms them

Recommended UI rule:

- if runtime apply succeeds during `saveBuilderDraft`, treat generated artifacts as real
- if runtime apply fails, show that authoring is saved but runtime is still out of date

## Companion Contracts

- `form-builder-backend-boundary.md`
- `form-builder-storage-and-sql-view-contract.md`
- `form-builder-backend-scope-payload-contract.md`
- `form-builder-backend-validation-matrix.md`
- `form-builder-backend-object-generation-matrix.md`
- `form-builder-backend-migration-policy.md`
