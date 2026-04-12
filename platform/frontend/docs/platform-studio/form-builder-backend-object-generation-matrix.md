# Form Builder Backend Object Generation Matrix

Status: active
Date: 2026-04-09

## Purpose

This document defines what backend objects are generated, reused, or forbidden during `publishBuilderDraft`.

It covers:

- `managed` model
- `external_locked` model
- `rootScope`
- `DEFAULT` subform
- `CHECKLIST` subform
- SQL grid views
- lookup-derived outputs

It exists to make publish behavior explicit before backend implementation.

## Core Rule

Accepted rule:

- `publishBuilderDraft` is the only lifecycle operation that may generate or reconcile runtime storage objects

Important rule:

- generated objects depend on both model source type and scope type

## Outcome Vocabulary

Recommended outcome vocabulary:

- `create`
- `recreate`
- `reuse`
- `skip`
- `forbid`

Recommended meaning:

- `create`
  - object does not exist yet and should be created
- `recreate`
  - object exists but should be regenerated from the latest published draft
- `reuse`
  - object already matches the published draft and may remain unchanged
- `skip`
  - no object should be generated for this case
- `forbid`
  - the publish request must fail if this generation path would be required

## Generation Layers

Backend publish may work across three layers:

1. control-plane metadata
   - `ps_model`
   - `ps_view`
2. storage objects
   - physical tables
   - parent-child foreign keys
   - indexes
3. read/query objects
   - canonical SQL data views
   - per-view SQL grid views
   - lookup-derived SQL outputs

Important rule:

- `ps_model` and `ps_view` are always updated as metadata during successful publish
- the generation matrix below focuses on data-plane and query-plane objects

## Matrix By Model Source Type

### `managed` model

| Object family | Root scope | `DEFAULT` subform | `CHECKLIST` subform | Notes |
| --- | --- | --- | --- | --- |
| physical table | create/recreate/reuse | create/recreate/reuse | create/recreate/reuse | Managed storage exists for root and for each subform |
| parent-child foreign key | skip | create/recreate/reuse | create/recreate/reuse | Only child tables need parent linkage |
| physical indexes | create/recreate/reuse | create/recreate/reuse | create/recreate/reuse | Backend-owned, not authored directly in builder |
| canonical SQL data view | create/recreate/reuse | create/recreate/reuse | create/recreate/reuse | One data view per storage scope |
| SQL grid view | create/recreate/reuse | create/recreate/reuse | skip | `CHECKLIST` does not use child grid projection |
| lookup-derived outputs | create/recreate/reuse | create/recreate/reuse | create/recreate/reuse | Derived in SQL views, not base tables |

### `external_locked` model

| Object family | Root scope | `DEFAULT` subform | `CHECKLIST` subform | Notes |
| --- | --- | --- | --- | --- |
| physical table | skip | forbid | forbid | Backend must not create or mutate external-owned storage |
| parent-child foreign key | skip | forbid | forbid | External locked should not publish managed child tables in V2 slice 1 |
| physical indexes | skip | forbid | forbid | External-owned |
| canonical SQL data view | create/recreate/reuse | skip | skip | Allowed only as backend-managed read projection over the external root source when supported |
| SQL grid view | create/recreate/reuse | skip | skip | View-specific projection over the external-compatible root source |
| lookup-derived outputs | create/recreate/reuse | skip | skip | Only when backed by allowed SQL read projections |

## Matrix By Scope Type

### `rootScope`

For `rootScope`, publish may generate:

- one managed root table for `managed` models
- one canonical root SQL data view
- zero or more root grid SQL views
- root lookup-derived outputs

For `rootScope`, publish must not generate:

- child foreign keys
- child-only row tables

### `subformScope` with `subformType = DEFAULT`

For `DEFAULT` subform scope, publish may generate:

- one managed child table
- one parent foreign key from child to root table
- one canonical child SQL data view
- zero or more child grid SQL views
- child lookup-derived outputs

### `subformScope` with `subformType = CHECKLIST`

For `CHECKLIST` subform scope, publish may generate:

- one managed child table
- one parent foreign key from child to root table
- one canonical child SQL data view
- child lookup-derived outputs

For `CHECKLIST` subform scope, publish must skip:

- child grid SQL view generation

Important rule:

- `CHECKLIST` changes runtime orchestration, not storage-table existence

## Matrix By View Concern

### Canonical SQL Data View

Canonical SQL data view generation is:

- per storage scope
- independent from individual random layout changes
- allowed for:
  - `managed.rootScope`
  - `managed.subformScope`
  - `external_locked.rootScope` when supported by backend mapping

Canonical SQL data view generation is not allowed in the first slice for:

- child scopes under `external_locked`

### SQL Grid View

Grid SQL view generation is:

- per `ViewDefinition`
- per scope
- only for scopes that support grid runtime

Accepted generation cases:

- `managed.rootScope`
- `managed.DEFAULT subform`
- `external_locked.rootScope` when grid projection over the external source is supported

Skipped generation cases:

- `managed.CHECKLIST subform`
- `external_locked.DEFAULT subform`
- `external_locked.CHECKLIST subform`

### Lookup-Derived Outputs

Lookup-derived outputs are generated:

- in SQL views only
- never in physical tables
- per lookup field that declares approved readable outputs

Accepted generation cases:

- root lookup fields on managed models
- child lookup fields on managed subforms
- root lookup fields on external locked models when the read projection is supported

## Matrix By Object Type

| Object type | `managed.root` | `managed.DEFAULT` | `managed.CHECKLIST` | `external_locked.root` | `external_locked.DEFAULT` | `external_locked.CHECKLIST` |
| --- | --- | --- | --- | --- | --- | --- |
| `ps_<scope>` table | create/recreate/reuse | create/recreate/reuse | create/recreate/reuse | skip | forbid | forbid |
| parent foreign key | skip | create/recreate/reuse | create/recreate/reuse | skip | forbid | forbid |
| canonical `vw_ps_<scope>` | create/recreate/reuse | create/recreate/reuse | create/recreate/reuse | create/recreate/reuse | skip | skip |
| `vw_ps_<scope>__<view_key>_grid` | create/recreate/reuse | create/recreate/reuse | skip | create/recreate/reuse | skip | skip |
| lookup-derived outputs in SQL views | create/recreate/reuse | create/recreate/reuse | create/recreate/reuse | create/recreate/reuse | skip | skip |

## Notes On `recreate` vs `reuse`

Recommended rule:

- physical tables should prefer `reuse` unless a compatible additive change requires `create`-like migration handling
- SQL views should commonly use `recreate` when the published draft changed their projection
- lookup-derived outputs normally follow SQL view regeneration

Recommended first-slice backend behavior:

- prefer deterministic `recreate` for SQL views
- prefer guarded additive reconciliation for tables
- reject ambiguous destructive storage changes instead of auto-migrating them

## Parent-Child Relationship Objects

For managed subforms, publish should reconcile:

- child table existence
- parent foreign key column
- supporting indexes for parent lookup

Recommended naming:

- child table parent fk column: `<root_storage_key>_id`

Example:

- root table: `ps_site_audit`
- child table: `ps_site_audit__findings`
- parent fk column in child table: `site_audit_id`

## Grid Generation Rule

Grid SQL view generation depends on approved grid settings in the authored view.

Accepted rule:

- if a scope has no enabled grid columns, backend may still:
  - skip grid-view generation
  - or generate a minimal default grid view

Recommended first-slice choice:

- generate a grid view only when the view has at least one approved visible grid column

## Lookup Output Generation Rule

Lookup outputs should be generated only for approved lookup families and approved output keys.

Examples:

- `reported_by__label`
- `reported_by__company_name`
- `project__label`
- `project__company_name`
- `company__main_company_name`

Important rule:

- lookup outputs are query/read artifacts
- they are not create-able model fields in Form Builder

## Publish Summary Contract

`publishBuilderDraft` should return generation outcomes per scope.

Recommended shape:

```json
{
  "storageResults": {
    "rootScope": {
      "table": {
        "name": "ps_site_audit",
        "action": "reuse"
      },
      "dataView": {
        "name": "vw_ps_site_audit",
        "action": "recreate"
      },
      "gridViews": [
        {
          "name": "vw_ps_site_audit__default_grid",
          "action": "recreate"
        }
      ],
      "lookupOutputs": [
        {
          "columnName": "reported_by__label",
          "action": "recreate"
        }
      ]
    },
    "subformScopes": [
      {
        "scopeId": "subform-findings",
        "table": {
          "name": "ps_site_audit__findings",
          "action": "reuse"
        },
        "dataView": {
          "name": "vw_ps_site_audit__findings",
          "action": "recreate"
        },
        "gridViews": [
          {
            "name": "vw_ps_site_audit__findings__default_grid",
            "action": "recreate"
          }
        ],
        "lookupOutputs": []
      }
    ]
  }
}
```

## UI/UX Guidance For Form Builder

Frontend should use this matrix to drive expectations:

- `managed` model publish can create planned storage artifacts
- `external_locked` publish should not promise managed child storage
- `CHECKLIST` should not surface grid-generation expectations
- lookup-derived outputs should appear as published read artifacts, not editable fields

Recommended builder behavior:

- show generated-artifact summaries after publish
- show unsupported-generation cases clearly before publish
- do not promise child scopes for `external_locked` until a future contract explicitly allows them

## Companion Contracts

- `form-builder-backend-boundary.md`
- `form-builder-storage-and-sql-view-contract.md`
- `form-builder-backend-scope-payload-contract.md`
- `form-builder-backend-api-contract.md`
- `form-builder-backend-validation-matrix.md`
- `form-builder-backend-migration-policy.md`
