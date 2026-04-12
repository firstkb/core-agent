# Form Builder Backend Technical Task List

Status: active
Date: 2026-04-09

## Purpose

This document decomposes the accepted Form Builder backend first slice into technical work layers.

It is the execution-oriented companion to:

- `form-builder-backend-first-slice-handoff.md`

It organizes the first slice into the requested layers:

- schema and migrations
- persistence repository
- draft API
- publish service
- SQL view generator
- validation service

## Execution Rule

Recommended delivery strategy:

1. land schema and migrations first
2. land persistence repository second
3. land draft API on top of persistence
4. land validation service before full publish
5. land publish service and SQL view generator together
6. wire publish responses with generated artifact summary last

Important rule:

- `saveBuilderDraft` should be shippable before `publishBuilderDraft`
- `publishBuilderDraft` should not start until validation service and SQL view generation contracts are explicit in code

## Layer 1: Schema And Migrations

### Goal

Create the minimal backend database surfaces required for metadata persistence and publish tracking.

### Tasks

- create migration for `ps_model`
- create migration for `ps_view`
- add primary keys, guids, created/updated timestamps
- add `version` and `published_version`
- add `definition_json`
- add `published_artifacts_json` to `ps_view`
- add uniqueness constraints:
  - `ps_model.model_key`
  - `ps_model.storage_key`
  - `ps_view(model_id, view_key)`
- add foreign key from `ps_view.model_id` to `ps_model._id`
- define indexes required for fast draft load by model/view key

### Output

- tenant-schema migrations for `ps_model`
- tenant-schema migrations for `ps_view`

### Done Criteria

- migrations apply cleanly on empty tenant database
- migrations are idempotent within normal migration workflow
- unique constraints match the accepted naming rules
- rows can store full builder draft payloads for one root scope and multiple subform scopes

## Layer 2: Persistence Repository

### Goal

Create a repository layer that loads and persists Form Builder metadata without mixing it with publish-time storage generation.

### Tasks

- implement `ModelRepository` for `ps_model`
- implement `ViewRepository` for `ps_view`
- implement load by model id
- implement load by model key
- implement load view by id
- implement load view by `(model_id, view_key)`
- implement save/update with optimistic concurrency
- implement persistence mapping:
  - model-owned concerns into `ps_model.definition_json`
  - view-owned concerns into `ps_view.definition_json`
- implement published-artifact summary persistence into `ps_view.published_artifacts_json`
- implement normalized serialization for `rootScope` and `subformScopes`

### Output

- repository methods usable by both draft API and publish service

### Done Criteria

- one full draft payload can round-trip through repository load/save
- no publish-time DDL happens in repository layer
- version conflict is detectable and returned deterministically

## Layer 3: Draft API

### Goal

Implement `loadBuilderDraft` and `saveBuilderDraft` on top of metadata persistence only.

### Tasks

- define request/response DTOs for `loadBuilderDraft`
- define request/response DTOs for `saveBuilderDraft`
- implement model/view resolution by id or key
- implement default-view resolution when allowed
- implement `loadBuilderDraft`
- implement `saveBuilderDraft`
- return:
  - `draft`
  - `publishState`
  - `validationSummary`
- optionally return `publishedArtifacts` on load
- add structured error responses for:
  - `not_found`
  - `version_conflict`
  - `validation_failed`

### Output

- first real draft persistence API surface

### Done Criteria

- frontend can load one full saved draft
- frontend can save one full edited draft
- stale writes fail with `version_conflict`
- save does not create or mutate generated runtime storage objects

## Layer 4: Validation Service

### Goal

Centralize backend validation logic so both save and publish use the same contract with different enforcement levels.

### Tasks

- implement contract-shape validation
- implement scope validation
- implement placement validation
- implement system-field validation
- implement binding validation
- implement same-scope rules validation
- implement naming and uniqueness validation
- implement projected storage-name validation
- implement filter and grid validation
- implement lock and source-type validation
- split validation entry points:
  - `validateForSave`
  - `validateForPublish`
- implement structured result model:
  - `errors[]`
  - `warnings[]`
  - `canSave`
  - `canPublish`
- implement error-code mapping:
  - `validation_failed`
  - `lock_violation`
  - `storage_collision`
  - `external_source_incompatible`
  - `migration_mode_required`

### Output

- one validation service callable from both draft API and publish service

### Done Criteria

- save-time and publish-time validation outcomes follow the accepted matrix
- warning vs error behavior is deterministic
- validation does not silently mutate payloads

## Layer 5: SQL View Generator

### Goal

Generate canonical data views, grid views, and lookup-derived outputs from published scope definitions.

### Tasks

- implement canonical data view naming
- implement grid view naming
- implement SQL projection builder for root scope
- implement SQL projection builder for managed child scopes
- implement lookup-derived output projection builder
- implement root grid projection builder
- implement `DEFAULT` subform grid projection builder
- explicitly skip `CHECKLIST` child grid generation
- implement generation outputs as structured plan before execution
- support `external_locked.rootScope` only where read projection is supported

### Output

- deterministic SQL view generation plan
- executable SQL for canonical data views
- executable SQL for grid views

### Done Criteria

- root data view generation works for managed model
- child data view generation works for managed subform
- grid view generation works for root and `DEFAULT` subform
- lookup-derived outputs appear in generated SQL views only

## Layer 6: Publish Service

### Goal

Implement `publishBuilderDraft` as the single backend operation that reconciles runtime storage artifacts.

### Tasks

- define request/response DTOs for `publishBuilderDraft`
- load latest saved draft through repository
- enforce optimistic concurrency
- call `validateForPublish`
- compute object-generation plan by scope
- apply migration policy:
  - `apply`
  - `recreate`
  - `reject`
  - `defer`
- reconcile managed root table
- reconcile managed child tables
- reconcile parent foreign keys
- reconcile canonical SQL data views
- reconcile grid SQL views
- reconcile lookup-derived outputs
- update `published_version`
- persist `published_artifacts_json`
- return `storageResults` and `publishState`

### Output

- first working publish lifecycle for managed Form Builder models

### Done Criteria

- publish succeeds for one managed root form
- publish succeeds for one managed model with one `DEFAULT` subform
- publish succeeds for one managed model with one `CHECKLIST` subform
- publish rejects destructive or deferred migration cases
- publish returns per-scope artifact actions like `create`, `recreate`, `reuse`, `skip`, `forbid`

## Cross-Layer Task: Migration Policy Enforcement

### Goal

Make sure the first slice stays conservative and safe.

### Tasks

- classify changes as additive-safe vs destructive
- reject published storage-key rename
- reject published subform-table-key rename
- reject destructive field deletion
- reject incompatible published type changes
- reject `DEFAULT <-> CHECKLIST` published conversion
- surface `migration_mode_required` for future-only cases

### Done Criteria

- publish never attempts destructive rewrite implicitly
- blocked publish explains whether it is a hard rejection or future migration-mode case

## Cross-Layer Task: Published Artifact Summary

### Goal

Expose generated runtime objects back to the frontend after publish.

### Tasks

- define persisted summary shape
- persist root artifact summary
- persist subform artifact summaries
- return:
  - storage table names
  - data view names
  - grid view names
  - lookup output names
  - action state per artifact

### Done Criteria

- frontend can distinguish planned artifacts from published artifacts
- published artifact summary is stable across repeated load calls

## Suggested Ticket Split

### Ticket Group A

- schema and migrations
- repository primitives

### Ticket Group B

- draft DTOs
- `loadBuilderDraft`
- `saveBuilderDraft`

### Ticket Group C

- validation service
- naming and scope checks

### Ticket Group D

- SQL view generator
- lookup output generator

### Ticket Group E

- publish service
- migration policy enforcement
- published artifact summary

## Recommended Critical Path

Critical path:

1. schema and migrations
2. repository
3. draft API
4. validation service
5. SQL view generator
6. publish service

Parallelizable side work:

- error-code contract
- published-artifact response shaping
- repository serialization helpers

## First Backend Demo Target

The slice is demo-ready when backend can show:

- create one managed model draft
- save one root form and one subform scope
- load the same draft back
- publish and create:
  - one root table
  - one child table
  - one canonical data view per scope
  - one grid SQL view where allowed
  - one set of lookup outputs
- reject one destructive publish case with structured error

## Canonical References

- `form-builder-backend-first-slice-handoff.md`
- `form-builder-backend-api-contract.md`
- `form-builder-backend-validation-matrix.md`
- `form-builder-backend-object-generation-matrix.md`
- `form-builder-backend-migration-policy.md`
- `form-builder-storage-and-sql-view-contract.md`
