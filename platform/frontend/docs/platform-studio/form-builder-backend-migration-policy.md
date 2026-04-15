# Form Builder Backend Migration Policy

Status: active
Date: 2026-04-09

## Purpose

This document defines the runtime-apply migration policy for Form Builder V2.

It answers:

- which published changes are additive-safe
- which changes must be rejected in the first slice
- which changes are deferred to a future explicit migration mode

It applies to:

- the additive runtime-apply contour triggered from `saveBuilderDraft`
- managed storage generation
- published model and subform scopes
- SQL data views
- SQL grid views
- lookup-derived outputs

## Core Rule

Accepted first-slice rule:

- ordinary `Save` may apply additive-safe storage changes
- ordinary `Save` must reject destructive or ambiguous storage changes
- complex storage rewrites are reserved for a future explicit migration mode

Important rule:

- SQL views are cheap to recreate
- physical tables and columns are not

## Policy Vocabulary

Recommended policy outcomes:

- `apply`
- `recreate`
- `reject`
- `defer`

Recommended meaning:

- `apply`
  - safe to reconcile during ordinary publish
- `recreate`
  - safe to rebuild deterministically during ordinary publish
- `reject`
  - must fail publish in the first slice
- `defer`
  - not supported in the first slice and reserved for future explicit migration workflow

## Migration Modes

### V2 First Slice

Accepted mode:

- `standard_publish`

Behavior:

- allow additive-safe physical storage changes
- allow deterministic SQL-view regeneration
- reject destructive table or column changes

### Future Mode

Reserved future mode:

- `explicit_migration`

This future mode may later support:

- rename with mapping
- type conversion with migration plan
- data backfill
- staged destructive changes
- operator-reviewed publish workflows

Important rule:

- `explicit_migration` is not part of the current accepted implementation scope
- until it exists, the policy in this document is enforced from ordinary `Save`

## Additive-Safe Changes

The following changes are accepted as `apply` in the first slice when all validations pass.

### Model And Scope Additions

- create a new managed root model that has never been published
- add a new field to an unpublished or published managed root scope
- add a new `DEFAULT` subform to a managed model
- add a new `CHECKLIST` subform to a managed model
- add a new child field to an existing managed subform scope

### View Additions

- create a new UI view on an existing model
- add or reorder layout nodes without changing physical storage
- add or update grid column selections
- add or update view filters
- add or update rules
- add or update `System Fields` bindings when the underlying published field already satisfies contract

### SQL Projection Changes

- recreate canonical SQL data views from current published field definitions
- recreate grid SQL views from current published grid configuration
- add new lookup-derived output columns in SQL views
- remove unused SQL-view-only outputs when deterministic regeneration supports it

### Compatible Physical Changes

- add a new nullable column
- add a new column with a safe backend-managed default
- add a new parent foreign key for a newly created child table
- add backend-owned supporting indexes

## Reject In Standard Publish

The following changes must `reject` ordinary publish in the first slice.

### Destructive Physical Changes

- delete a published physical column
- delete a published child table
- rename a published physical column
- rename a published table or child table
- rename a published parent foreign key column

### Incompatible Type Changes

- change one published base type to an incompatible physical type
- change scalar field to lookup field when storage semantics are incompatible
- change lookup field to scalar field when storage semantics are incompatible
- change `single_select` storage semantics in a way that requires destructive rewrite
- change child field meaning in a way that requires data rewrite

### Published Scope Identity Changes

- change `model.storageKey` after publish
- change published `subform.tableKey`
- move a published field from root scope into subform scope
- move a published field from subform scope into root scope
- move a published field between two subforms

### Unsupported External Cases

- publish managed child tables under `external_locked` model
- mutate external-owned physical columns
- mutate external-owned indexes or foreign keys

## Defer To Future Explicit Migration Mode

The following changes are not accepted in `standard_publish` and should be marked `defer`.

### Rename Workflows

- rename published field storage key with alias mapping
- rename published subform table key with data preservation
- rename published model storage key

### Conversion Workflows

- numeric type conversion with data preservation
- string-to-date or date-to-string conversion
- scalar-to-multi-value conversion
- one lookup family to another lookup family with backfill

### Scope Restructuring

- split one published subform into two child tables
- merge two published subforms into one child table
- extract published root fields into a new child scope
- inline published child fields back into root scope

### Required Data Migrations

- backfill a new non-nullable field from existing rows
- derive new stored values from historical lookup outputs
- migrate checklist result encoding across published rows

## SQL View Policy

### Canonical Data Views

Canonical SQL data views are `recreate` by default.

Accepted rule:

- if the published field registry changes compatibly, regenerate the canonical SQL data view

### Grid SQL Views

Grid SQL views are `recreate` by default.

Accepted rule:

- grid projection changes do not imply physical-table migration
- grid SQL views may be dropped and recreated deterministically

### Lookup-Derived Outputs

Lookup-derived outputs are `recreate` by default.

Accepted rule:

- lookup outputs follow SQL-view generation policy
- they are not migration blockers unless naming or source contract becomes invalid

## Field-Level Policy Matrix

| Change type | Standard publish | Notes |
| --- | --- | --- |
| add new field | apply | If naming and type validation pass |
| change label only | apply | UI-only |
| change helper text only | apply | UI-only |
| change grid inclusion/order | apply | Grid SQL view may recreate |
| change filter config | apply | View-only |
| change rules | apply | View-only |
| rename storage key | reject | Future explicit migration only |
| delete published field | reject | Future explicit migration only |
| incompatible base-type change | reject | Future explicit migration only |
| compatible SQL-view-only lookup output change | recreate | SQL-view layer only |

## Subform Policy Matrix

| Change type | Standard publish | Notes |
| --- | --- | --- |
| add new subform | apply | Creates new child table |
| add field inside subform | apply | Child-table additive change |
| add grid config to `DEFAULT` subform | apply | Grid SQL view may recreate |
| add grid config to `CHECKLIST` subform | reject | Checklist child grid is unsupported |
| rename subform table key | reject | Future explicit migration only |
| delete published subform | reject | Future explicit migration only |
| convert `DEFAULT` to `CHECKLIST` after publish | reject | Runtime and data semantics shift too much for first slice |
| convert `CHECKLIST` to `DEFAULT` after publish | reject | Same reason |

## System Field Policy

| Change type | Standard publish | Notes |
| --- | --- | --- |
| bind `Reported By` to an already compatible field | apply | Metadata-only if storage already matches |
| bind `Reported Date` to an already compatible field | apply | Metadata-only if storage already matches |
| bind `Status` to an already compatible field | apply | Metadata-only if storage already matches |
| rebind system role to a different published field with same compatible storage | apply | View semantic layer |
| rebind system role in a way that requires physical rewrite | reject | Future explicit migration only |

## Runtime-Apply Behavior

When ordinary `Save` runtime apply encounters:

- `apply`
  - continue and reconcile
- `recreate`
  - rebuild deterministic query artifacts
- `reject`
  - fail runtime apply with structured error
- `defer`
  - fail runtime apply with structured error indicating future migration workflow requirement

Recommended error-code mapping:

- ordinary storage incompatibility: `storage_collision`
- unsupported destructive migration: `runtime_apply_failed`
- future migration required: `migration_mode_required`

## UI/UX Guidance

The frontend builder should present:

- ordinary save as:
  - authoring persist first
  - safe additive runtime apply second
- destructive or restructuring changes as blocked runtime-apply outcomes

Recommended UX language:

- `Ready to save`
- `Runtime apply blocked`
- `Requires manual migration`
- `Blocked by destructive change`

Important rule:

- the UI should not imply that rename or destructive schema rewrite is already supported

## First-Slice Recommendation

For the first backend slice:

- keep physical-table policy conservative
- keep SQL-view policy deterministic
- prefer explicit rejection over clever migration inference
- preserve published data safety over authoring convenience

## Companion Contracts

- `form-builder-backend-api-contract.md`
- `form-builder-backend-validation-matrix.md`
- `form-builder-backend-object-generation-matrix.md`
- `form-builder-storage-and-sql-view-contract.md`
