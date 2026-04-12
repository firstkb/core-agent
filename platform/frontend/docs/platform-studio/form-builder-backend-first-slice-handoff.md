# Form Builder Backend First Slice Handoff

Status: active
Date: 2026-04-09

## Purpose

This document is the short execution handoff for the first real backend slice of Form Builder V2.

It compresses the current backend contract into one implementation-ready scope.

This first slice should deliver:

- metadata tables `ps_model` and `ps_view`
- `loadBuilderDraft`
- `saveBuilderDraft`
- `publishBuilderDraft`
- backend validation split for `save` vs `publish`
- publish-time generation of managed storage and SQL views
- strict migration limits for safe first delivery

## Scope

### Must Implement

- persist model metadata in `ps_model`
- persist view metadata in `ps_view`
- store `rootScope` and `subformScopes` inside view definition JSON
- support `managed` model source type
- support `external_locked` at root-view metadata level
- implement draft load/save lifecycle
- implement publish lifecycle
- implement optimistic concurrency
- implement backend validation matrix
- implement publish-time object generation matrix
- enforce first-slice migration policy

### Can Be Deferred

- explicit migration workflows
- destructive schema rewrites
- rename with data preservation
- child scopes under `external_locked`
- runtime release packaging
- advanced merge UX for version conflicts

## Minimal Storage Surfaces

### Metadata Tables

#### `ps_model`

Minimum required columns:

- `_id`
- `_guid`
- `model_key`
- `storage_key`
- `display_name`
- `source_type`
- `status`
- `version`
- `published_version`
- `definition_json`
- `_created_at`
- `_updated_at`

#### `ps_view`

Minimum required columns:

- `_id`
- `_guid`
- `model_id`
- `view_key`
- `display_name`
- `view_type`
- `is_default`
- `status`
- `version`
- `published_version`
- `definition_json`
- `published_artifacts_json`
- `_created_at`
- `_updated_at`

### Generated Objects

For `managed` models:

- root table: `ps_<root_storage_key>`
- child table: `ps_<root_storage_key>__<subform_table_key>`
- root data view: `vw_ps_<scope_storage_key>`
- child data view: `vw_ps_<scope_storage_key>`
- grid view: `vw_ps_<scope_storage_key>__<view_key>_grid`

For `external_locked` models in the first slice:

- no managed root table creation
- no managed child table creation
- optional root SQL read projections only if backend mapping supports them

## Draft Lifecycle

### `loadBuilderDraft`

Must:

- load current `ps_model` row
- load current `ps_view` row
- return normalized draft payload
- return publish state
- return latest published artifact summary when requested

Must not:

- mutate storage
- recompute DDL as a side effect

### `saveBuilderDraft`

Must:

- validate contract shape
- validate scope rules
- validate bindings and same-scope rules
- validate keys and projected names
- persist draft metadata
- update versions only where changes occurred

Must not:

- create physical tables
- alter physical tables
- create SQL views
- alter SQL views

## Publish Lifecycle

### `publishBuilderDraft`

Must:

- load latest saved draft
- enforce optimistic concurrency
- run full publish validation
- reconcile managed root table when applicable
- reconcile managed child tables when applicable
- reconcile canonical SQL data views
- reconcile per-view grid SQL views
- compute lookup-derived SQL outputs
- update `published_version`
- persist published artifact summary

Must return:

- updated publish state
- per-scope artifact results
- structured errors on failure

## Validation Responsibilities

### Save-Time Errors

`saveBuilderDraft` must block on:

- malformed payload shape
- invalid ids, keys, and scope relationships
- root-only rule violations
- invalid `CHECKLIST` composition
- invalid bindings
- same-scope rule violations
- lock violations already knowable from metadata
- stale version tokens

### Save-Time Warnings

`saveBuilderDraft` may warn on:

- projected storage naming collisions
- projected SQL-view naming collisions
- projected lookup-output collisions
- external-source compatibility risk

### Publish-Time Errors

`publishBuilderDraft` must additionally block on:

- real table or column collisions
- incompatible published-schema mutations
- SQL data view generation failures
- SQL grid view generation failures
- lookup-output generation failures
- publish-time drift from actual backend state

## Object Generation Rules

### `managed.rootScope`

Generate or reconcile:

- root physical table
- canonical root SQL data view
- root grid SQL views
- root lookup-derived outputs

### `managed.DEFAULT subform`

Generate or reconcile:

- child table
- parent foreign key
- canonical child SQL data view
- child grid SQL views
- child lookup-derived outputs

### `managed.CHECKLIST subform`

Generate or reconcile:

- child table
- parent foreign key
- canonical child SQL data view
- child lookup-derived outputs

Do not generate:

- child grid SQL views

### `external_locked.rootScope`

Allow only:

- metadata persistence
- view persistence
- optional root SQL read projections when backend mapping supports them

Do not allow in first slice:

- managed root table creation
- managed child scopes
- child table generation

## Migration Policy Limits

### Allowed In Standard Publish

- create new managed model
- add new field
- add new `DEFAULT` subform
- add new `CHECKLIST` subform
- add child field
- regenerate SQL views
- add lookup-derived outputs
- update layout, grid, filters, rules, and system-field bindings when storage-compatible

### Rejected In Standard Publish

- delete published field
- rename published storage key
- rename published subform table key
- rename published model storage key
- incompatible type change
- move published field across scopes
- convert published `DEFAULT` to `CHECKLIST`
- convert published `CHECKLIST` to `DEFAULT`

### Deferred To Future Explicit Migration Mode

- rename with mapping
- type conversion with data preservation
- split or merge published subforms
- backfill non-nullable fields
- destructive schema rewrite

## Recommended Endpoint Or Command Set

Transport style is still open, but the first slice should expose these three operations:

- `loadBuilderDraft`
- `saveBuilderDraft`
- `publishBuilderDraft`

Minimum supporting behaviors:

- model/view resolution by id or key
- structured validation result payloads
- structured publish artifact result payloads
- structured version conflict responses

## Recommended Implementation Order

1. Create `ps_model` and `ps_view`
2. Implement normalization and persistence for builder draft payload
3. Implement `loadBuilderDraft`
4. Implement `saveBuilderDraft`
5. Implement save-time validation
6. Implement publish-time validation
7. Implement managed root table generation
8. Implement managed child table generation
9. Implement canonical SQL data views
10. Implement grid SQL views
11. Implement lookup-derived outputs
12. Persist published artifact summary

## Definition Of Done

The first slice is done when:

- one managed model can be created and saved
- one managed view can be created and saved
- one root scope and one subform scope can publish successfully
- publish creates the expected managed tables and SQL views
- publish returns per-scope artifact summary
- incompatible destructive changes are rejected
- stale writes are rejected
- `CHECKLIST` child grid generation is blocked

## Canonical References

- `form-builder-backend-boundary.md`
- `form-builder-storage-and-sql-view-contract.md`
- `form-builder-backend-scope-payload-contract.md`
- `form-builder-backend-api-contract.md`
- `form-builder-backend-validation-matrix.md`
- `form-builder-backend-object-generation-matrix.md`
- `form-builder-backend-migration-policy.md`
