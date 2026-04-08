# Form Builder To Backend Boundary

## Purpose

This document defines the early boundary between Form Builder and the future backend implementation.

The goal is not to freeze final API details too early.
The goal is to make sure the visual builder, the schema model, and the backend service layer evolve toward the same shape.

This document should make the later backend phase easier once the visual builder becomes stable.

## Scope

This boundary covers:

- model metadata
- view metadata
- field definitions
- layout composition
- permissions and locking
- physical storage mapping
- external locked tables
- validation and persistence responsibilities

This boundary does not yet define:

- final REST vs RPC transport style
- final publish or release workflow
- final database migration engine
- final runtime rendering protocol

## Product Language vs Backend Language

The visible product language may continue to evolve.
The backend contract should stay stable even if the UI copy changes.

Recommended rule:

- UI may say `Model` and `View`
- legacy material may still say `Object` and `Screen`
- backend contract should use stable internal terms

Recommended backend terms:

- `ModelDefinition`
- `ModelFieldDefinition`
- `ViewDefinition`
- `LayoutNode`
- `LockPolicy`
- `StorageBinding`

## Core Principle

The Form Builder should not write directly in database terms.

The Form Builder should author:

- business-level model structure
- UI composition
- authoring metadata
- lock and permission intent

The backend should own:

- physical storage naming
- DDL generation
- indexes
- relationships
- system columns
- persistence validation
- concurrency handling

## Recommended Domain Split

### 1. ModelDefinition

Represents the logical model.

Recommended shape:

- `id`
- `key`
- `displayName`
- `description`
- `sourceType`
- `storageBinding`
- `structureLock`
- `fieldLockMode`
- `status`
- `version`
- `fields`
- `metadata`

### 2. ModelFieldDefinition

Represents one logical field of the model.

Recommended shape:

- `id`
- `key`
- `displayName`
- `description`
- `baseType`
- optional `fieldPreset`
- `isRequired`
- `isNullable`
- `defaultValue`
- optional `validation`
- `relation`
- `storage`
- `lockState`
- `filterCapabilities`
- `listCapabilities`
- `metadata`

### 3. ViewDefinition

Represents one UI definition built on top of a model.

Recommended shape:

- `id`
- `modelId`
- `key`
- `displayName`
- `viewType`
- `isDefault`
- `status`
- `layout`
- `systemFields`
- `viewSettings`
- `filterDefinitions`
- `permissions`
- `version`
- `metadata`

### 4. LayoutNode

Represents authored UI structure.

Recommended node categories:

- container nodes
- layout nodes
- content nodes
- bound-field nodes
- action nodes

Recommended baseline node types:

- `section`
- `group`
- `tabs`
- `tab_item`
- `subform`
- `text`
- `divider`
- `field`

Each node should support:

- stable `id`
- `type`
- `parentId`
- `order`
- `settings`
- `visibility`
- optional `binding`
- optional `runtimePreset`

### 5. LockPolicy

Represents model and field edit restrictions.

Recommended dimensions:

- `structureLocked`
- `uiOnlyAuthoringAllowed`
- `fieldLocks`
- `readonlyActors`
- `ownerActors`

### 6. StorageBinding

Represents backend-owned storage mapping.

Recommended shape:

- `bindingType`
  - `managed`
  - `external`
- `tableName`
- `tablePrefix`
- `namingPolicy`
- `fieldStorageOverrides`
- `externalSource`

## Model Source Types

The backend must support more than one model source.

Recommended source types:

- `managed`
  - builder owns logical structure and physical table generation
- `external_locked`
  - backend maps to an existing physical table and the model structure is locked
- `external_mirrored`
  - future mode if partial synchronization is needed later

For V2, `managed` and `external_locked` are the important ones.

## Required Authoring Capabilities

The Form Builder will need these backend-level capabilities.

### Model capabilities

- list models
- create model
- get model detail
- update model metadata
- update model structure
- lock or unlock structure
- list model fields
- create field
- update field
- lock field
- delete field when allowed

### View capabilities

- list views for a model
- create view
- clone view
- update view metadata
- update view layout
- set default view
- delete view

### Validation capabilities

- validate model key
- validate field key
- validate storage naming collisions
- validate layout binding correctness
- validate lock-rule violations

## Locked Schema Rules

The backend contract must support the rules already approved for V2.

### Managed locked model

When a managed model is structurally locked:

- model structure updates are rejected
- new physical fields are rejected
- field type changes are rejected
- storage changes are rejected

Allowed behavior depends on view permissions:

- views may still be created
- views may still be edited if policy allows UI-only authoring

### External locked model

When a model maps to an external locked table:

- the model is treated as structurally locked
- backend schema mutations are rejected
- Form Builder may still create and edit views

This mode is necessary for tables such as:

- `users`
- other platform-owned system tables

## Field Lock Rules

Each field should have its own lock state in addition to model-level lock state.

Recommended field lock outcomes:

- a locked field cannot be changed structurally
- a locked field may still be used in views
- UI-only settings may remain editable if policy allows it

This is important because model structure and UI composition do not always share the same mutability rules.

## Storage Responsibilities

The Form Builder should not own DDL rules directly.
The backend should own storage generation based on model intent.

The backend should derive or validate:

- physical table name
- physical column names
- system columns
- indexes
- relationships
- foreign keys
- storage-safe uniqueness

Reference:

- `platform/frontend/docs/platform-studio/data-schema-storage-rules.md`
- `platform/frontend/docs/platform-studio/form-builder-slice-1-inspector-and-view-schema.md`

## Recommended Persistence Shapes

The backend should persist model and view authoring separately.

### Model persistence

Recommended persisted concerns:

- model record
- field records
- lock policies
- storage binding
- structural version

### View persistence

Recommended persisted concerns:

- view record
- layout document
- system field bindings
- view settings
- filter definitions
- view-level permissions
- view version

This separation allows:

- many views for one model
- locked model with editable views
- external table support with local UI composition

## Versioning And Concurrency

The backend boundary should plan for optimistic concurrency from the start.

Recommended rule:

- each model and view carries a version token
- update operations require the latest known version
- conflicts return a structured version mismatch result

Suggested backend behavior:

- reject stale writes
- return latest persisted state
- allow UI to offer reload or merge behavior later

## Validation Ownership

Validation should be split intentionally.

### Form Builder validation

The Form Builder should validate:

- missing required labels
- obvious duplicate visible names in the current editing flow
- illegal layout moves
- invalid element placement in the current container
- obvious lock-state restrictions in the current UI

### Backend validation

The backend must validate:

- stable key uniqueness
- physical storage collisions
- relation validity
- field type legality
- lock-policy enforcement
- version safety
- external table compatibility

The UI should help the user early, but the backend must remain the final authority.

## Preview Boundary

For the current V2 direction, preview can remain local-first in the Form Builder.

That means:

- the Form Builder may generate preview state locally
- backend is not required for every preview render

But the backend contract should still leave room for:

- validated preview bundles
- server-side compatibility checks
- future runtime packaging

## Suggested Backend Service Groups

The future backend can be split into service groups instead of one large builder service.

Recommended grouping:

### Model service

- create or update models
- validate fields
- manage locks
- manage storage binding

### View service

- create or update views
- persist layout documents
- validate bindings
- set default view

### Storage service

- generate managed storage
- inspect external tables
- compute indexes and relations
- maintain migrations

### Validation service

- naming checks
- compatibility checks
- rule enforcement

These can still be implemented behind one API surface initially.

## First Backend Milestone

When the visual builder is stable enough, the first backend milestone should not try to solve everything.

Recommended first milestone:

1. persist models
2. persist fields
3. persist views
4. persist layout documents
5. enforce lock rules
6. support managed model creation
7. support external locked table mapping

Explicitly defer at first if needed:

- advanced publish workflow
- runtime release packaging
- full migration history UX
- advanced list/grid runtime behavior
- complex workflow hooks

## Suggested Minimal Contract Outcomes

The first backend-ready Form Builder should be able to send and receive:

- model summary list
- model detail bundle
- view list for a model
- one full view document
- lock state and permissions
- validation results
- version tokens

That is enough to move from mock authoring toward real persistence.

## Final Recommendation

The most important boundary rule is this:

- Form Builder owns authoring intent
- backend owns persistence, storage, enforcement, and generated physical details

If this rule stays clear, the current visual work can evolve without forcing later backend work to reverse-engineer UI state.

The best next step after the visual builder stabilizes is not a giant backend rewrite.
It is implementing the smallest backend surface that can persist:

- one model
- its fields
- multiple views
- one layout tree
- one lock policy

That will make the transition from mock state to real backend materially smoother.
