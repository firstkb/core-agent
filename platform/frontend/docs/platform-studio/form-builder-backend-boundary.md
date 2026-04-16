# Form Builder To Backend Boundary

## Purpose

This document defines the early boundary between Form Builder and the future backend implementation.

The goal is not to freeze final API details too early.
The goal is to make sure the visual builder, the schema model, and the backend service layer evolve toward the same shape.

This document should make the later backend phase easier once the visual builder becomes stable.

Use `form-builder-backend-execution-plan.md` as the staged implementation guide.
This document remains the boundary contract.

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

## Locked Early-Integration Rules

The first backend-ready pass should stay intentionally small and user-friendly.
Do not build a general migration engine or speculative permissions layer before it is needed.

The boundary must already support these locked rules:

- adding a field changes model structure
- removing a field from canvas changes only the current view
- deleting a field from the model is a separate structure action
- if a field is new and has not yet been saved, rename in canvas updates model label plus current view title
- after the first successful `Save`, rename in the `default` view may still update canonical model label
- default-view label-only rename must not advance `modelStructureVersion`
- in non-default views, ordinary rename in canvas updates only the current view
- use integer `modelStructureVersion`; do not use fractional values such as `0.1`
- if `modelStructureVersion > lastAlignedModelStructureVersion`, the UI may show the yellow view-drift warning
- `root` may lock `model` and `view` separately
- each field must separate:
  - immutable `id`
  - author-facing `displayName`
  - backend-facing `storageKey`

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
- `BackendFormBuilderPayload`

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

Metadata persistence recommendation:

- persist logical model definitions in `ps_model`
- persist authored UI view definitions in `ps_view`
- keep generated business tables separate from these metadata tables

## Recommended Domain Split

### 1. ModelDefinition

Represents the logical model.

Recommended shape:

- `id`
- optional `guid`
- `key`
- `displayName`
- `storageKey`
- `description`
- `sourceType`
- `storageBinding`
- `structureLock`
- `modelStructureVersion`
- `fieldLockMode`
- `status`
- `version`
- `fields`
- `metadata`

Identity rule:

- `key` is the immutable author-facing identifier used in Form Builder routes
- `guid` is internal database identity
- `displayName` may change without changing `key`
- `status` must not be treated as site publication state for the Form Builder UX

### 2. ModelFieldDefinition

Represents one logical field of the model.

Recommended shape:

- `id`
- `key`
- `displayName`
- `storageKey`
- `description`
- `baseType`
- optional `fieldPreset`
- `isRequired`
- `isNullable`
- `defaultValue`
- optional `validation`
- `relation`
- `storage`
- `isPersisted`
- `lockState`
- `filterCapabilities`
- `listCapabilities`
- `metadata`

### 3. ViewDefinition

Represents one UI definition built on top of a model.

Recommended shape:

- `id`
- `modelId`
- optional `guid`
- `key`
- `displayName`
- `viewType`
- `isActive`
- `isDefault`
- `status`
- `layout`
- `systemFields`
- `viewSettings`
- `filterDefinitions`
- `permissions`
- `version`
- `lastAlignedModelStructureVersion`
- `lockState`
- `metadata`

Identity rule:

- `key` is the immutable author-facing identifier used in Form Builder routes
- `guid` is internal database identity
- `displayName` may change without changing `key`
- `isActive` is the authoring flag behind the eye indicator in the views list
- `status` must not be treated as site publication state for the Form Builder UX

Recommended minimum `viewSettings` concerns:

- `iconDataUrl`
- `correctiveAction.enabled`
- `correctiveAction.sourceType`
- `correctiveAction.modelKey`
- `actions.canAdd`
- `actions.canView`
- `actions.canEdit`
- `actions.canDelete`
- `list.sorting.fieldId`
- `list.sorting.direction`
- `list.columns[]`

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
- optional `rules`
- optional `binding`
- optional `runtimePreset`

### Subform Child Collection Rule

Current accepted rule:

- each `subform` node represents a managed child collection
- each managed subform creates its own child table in storage
- the backend should generate the parent-child relation and supporting indexes
- each managed subform owns its own embedded schema scope with dedicated `dataSchema` and `uiSchema`
- accepted `subformType` values are:
  - `DEFAULT`
  - `CHECKLIST`
- `CHECKLIST` changes runtime orchestration, but it does not remove the child-table boundary

### Schema Scope Rule

Current accepted rule:

- one builder document owns the root scope and all subform scopes together
- the root scope owns root `systemFields`, `viewSettings`, and `filterDefinitions`
- subform scopes must not own root-only view concerns such as `System Fields`, `Corrective Action`, root actions, or root list filters
- `DEFAULT` subform scopes may still own local child-table grid columns inside their own `viewSettings.list.columns`
- child fields and child layout should remain inside the subform scope instead of being flattened into the root scope

### 5. LockPolicy

Represents model and field edit restrictions.

Recommended dimensions:

- `structureLocked`
- `viewLocked`
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
- `dataViewName`
- optional `gridViewNamePattern`
- `namingPolicy`
- `fieldStorageOverrides`
- optional `lookupOutputs`
- `externalSource`

Companion contracts:

- `form-builder-storage-and-sql-view-contract.md`
- `form-builder-backend-scope-payload-contract.md`
- `form-builder-backend-api-contract.md`
- `form-builder-backend-validation-matrix.md`
- `form-builder-backend-object-generation-matrix.md`
- `form-builder-backend-migration-policy.md`

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
- field persisted/fixed state

### View persistence

Recommended persisted concerns:

- view record
- layout document
- system field bindings
- view settings
- filter definitions
- view-level permissions
- view version
- `lastAlignedModelStructureVersion`

This separation allows:

- many views for one model
- locked model with editable views
- external table support with local UI composition

## Versioning And Concurrency

The backend boundary should plan for optimistic concurrency from the start.

Recommended rule:

- each model and view carries a version token
- model structure drift uses a separate integer `modelStructureVersion`
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
