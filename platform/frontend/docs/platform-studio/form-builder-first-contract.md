# Form Builder First Contract

Status: active
Date: 2026-04-07

## Purpose

This document locks the first backend-facing Form Builder contract before real FE/BE parallelization begins.
It defines what the first integrated slice must support and what stays deferred.

The current objective is readiness for backend implementation.
It is not permission to widen backend behavior before the authoring lifecycle is stable from `create model` through `create view` and `Save`.

Use `form-builder-backend-execution-plan.md` as the staged execution guide.
This document remains the canonical first-slice contract.

## Scope of the first locked contract

The first Form Builder contract covers:

- model list
- model detail
- view list for a model
- view detail
- one editable layout draft tree per view
- coherent save semantics for the current model draft plus the current view draft
- model and field lock state
- structure-version and view-drift signals
- explicit `isActive` state for each view

Important scope note:

- Form Builder `Save` is authoring save only
- site publication and real navigation exposure are handled later by Navigation Builder
- model/view `draft` or `published` must not be treated as the primary product-facing lifecycle here
- canonical route/API naming for this authoring lifecycle is `authoring`; if `draft` appears, treat it only as a temporary compatibility alias for authoring state

## Canonical domain objects

The first shared contract should use these stable terms:

- `ModelDefinition`
- `ModelFieldDefinition`
- `ViewDefinition`
- `LayoutNode`
- `LockPolicy`
- `StorageBinding`

## Included persisted surfaces

### Model list

Each row must support enough data to render the current master-detail list:

- `id`
- optional `guid`
- `key`
- `name`
- `displayName`
- optional `description`
- optional `storageKey`
- `isStructureLocked`
- `canEditViewsOnly`
- `modelStructureVersion`

### Model detail

The first detail payload must support:

- model metadata used in the detail header
- stable route identity through `key`
- optional internal identity through `guid`
- the model field list
- field lock state
- view summaries for that model
- model storage identity used by backend integration
- model structure version

### View list and detail

Each view must support:

- `id`
- optional `guid`
- `modelId`
- `key`
- `name`
- `displayName`
- optional `description`
- `kind` or `viewType`
- `isActive`
- version or concurrency token
- `lastAlignedModelStructureVersion`
- view lock state

Route rule:

- route params may still be called `modelId` and `viewId`
- the values carried in them are immutable stable keys
- titles are never identifiers
- `guid` is internal database identity and must not replace the stable key in authoring routes

### Layout draft tree

The persisted authored layout must support:

- stable node ids
- parent-child structure
- ordered children
- node type
- node settings
- optional field binding
- optional visibility/config metadata needed by the current workspace

The first contract does not persist purely local navigation state such as:

- selected node id
- currently opened parent level
- palette search query
- inspector tab selection
- other ephemeral workspace UI state

## Lock model

The first contract must carry:

- model structure lock
- view-authoring lock
- field-level lock state
- whether the current authoring context is effectively `views only`

The first contract does not need the final generalized access-policy model yet.
It only needs enough lock information to keep the current Form Builder UI honest.

## Locked lifecycle rules

The first contract must keep these behaviors explicit:

- adding a field is a model-structure change
- removing a field from canvas is a view-only unbind
- deleting a field from the model is a separate structure action
- if a field was added and has not yet been saved, renaming it updates:
  - the model field default label
  - the current view node title
- after the first successful `Save`, ordinary rename in canvas updates only the current view
- view drift is driven by integer structure versions:
  - `modelStructureVersion`
  - `lastAlignedModelStructureVersion`
- the views list should be able to show a warning state when:
  - `modelStructureVersion > lastAlignedModelStructureVersion`

## Save semantics

The first integrated save path should follow these rules:

- Form Builder saves one active builder draft at a time
- that save is authoring save, not site publish
- one save writes:
  - the current model draft changes needed by the active view
  - current view metadata
  - the current layout draft
- the first successful save fixes newly added fields in the model
- after a field is fixed, ordinary canvas rename must not silently rewrite the model field label or storage identity
- the response returns the stored model payload, the stored view payload, and updated versions or concurrency tokens
- lock state echoed by the server wins over stale client assumptions
- version mismatch must be treated as an edit conflict, not as silent overwrite

## Explicitly out of scope for the first backend slice

- publish and release workflow
- runtime rendering contract finalization
- model creation flow
- model deletion flow
- view creation flow
- view clone flow
- view deletion flow
- export flows
- automatic cross-view repair
- destructive model-field migration workflow
- Navigation Builder implementation
- Action Builder implementation

Reason:

- the current UI still keeps create/export actions disabled
- the first backend slice should stabilize read/save behavior before widening the command surface

## First FE/BE parallelization rule

Frontend and backend may move in parallel only after this contract stays fixed.

Expected frontend work after the lock:

- transport adapters
- load/save wiring
- error and conflict states
- replacement of local-only persistence for the locked surfaces

Expected backend work after the lock:

- list/detail endpoints for models and views
- persisted view draft storage
- lock-aware save validation
- versioned save responses
