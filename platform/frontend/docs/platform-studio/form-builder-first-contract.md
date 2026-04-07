# Form Builder First Contract

Status: active
Date: 2026-04-07

## Purpose

This document locks the first backend-facing Form Builder contract before real FE/BE parallelization begins.
It defines what the first integrated slice must support and what stays deferred.

## Scope of the first locked contract

The first Form Builder contract covers:

- model list
- model detail
- view list for a model
- view detail
- one editable layout draft tree per view
- model and field lock state
- save semantics for authored view metadata and layout draft

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
- `key`
- `name`
- optional `description`
- `isStructureLocked`
- `canEditViewsOnly`

### Model detail

The first detail payload must support:

- model metadata used in the detail header
- the model field list
- field lock state
- view summaries for that model

### View list and detail

Each view must support:

- `id`
- `modelId`
- `key`
- `name`
- optional `description`
- `kind` or `viewType`
- `isActive`
- version or concurrency token

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
- field-level lock state
- whether the current authoring context is effectively `views only`

The first contract does not need the final generalized access-policy model yet.
It only needs enough lock information to keep the current Form Builder UI honest.

## Save semantics

The first integrated save path should follow these rules:

- Form Builder saves one view draft at a time
- one save writes view metadata plus the layout draft together
- the response returns the stored view payload plus the updated version or concurrency token
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
