# Form Builder Backend Execution Plan

Status: working
Date: 2026-04-13

## Purpose

This document is the short readiness plan for bringing Form Builder to a clean backend starting point.

It translates the currently agreed product rules into four practical stages:

1. `Contract Lock`
2. `Frontend Refactor`
3. `Backend Draft API`
4. `Publish Slice`

This is an execution document.
It is not the canonical contract.

Use it together with:

- `form-builder-first-contract.md`
- `form-builder-backend-boundary.md`
- `form-builder-backend-scope-payload-contract.md`
- `form-builder-backend-api-contract.md`
- `form-builder-backend-validation-matrix.md`
- `form-builder-backend-migration-policy.md`

## Locked delivery rule

Build only what is necessary for a usable backend-ready Form Builder.
The current objective is readiness for backend implementation, not widening backend scope for its own sake.

Do not build:

- a general migration engine
- destructive publish flows
- automatic cross-view repair
- broad package extraction
- speculative permissions machinery beyond the agreed `root / model / view` needs
- extra backend flows before the authoring contract for `create model -> create view -> save authoring state` is stable

## Locked product decisions

### Minimal-first scope

- the goal is a user-friendly authoring tool, not a universal schema platform
- the first integrated slice should focus on authoring save lifecycle, lock safety, version safety, and clear view drift signals

### Authoring-state rule

- Form Builder `Save` means authoring save only
- Form Builder save must not be treated as site publication
- model/view visibility on the real site is handled later through Navigation Builder and privileges
- model/view `draft/published` must not be treated as the primary user-facing lifecycle for this surface
- if `draft` appears in temporary API names or routes, it is only a technical alias for authoring state

### Route identity rule

- route params keep the names `modelId` and `viewId` for compatibility
- the values carried in those params are immutable stable keys
- example:
  - `site-audit`
  - `field-checklist`
- titles are never identifiers
- database `guid` is internal identity, not the author-facing route id

### View activity rule

- each view carries an explicit `isActive` authoring flag
- the eye indicator in the views list is a view-state signal, not decorative chrome
- `isActive` is controlled from Form Builder authoring, not from Navigation Builder publish state

### Model and view lifecycle

- adding a field is a model-structure change
- removing a field from canvas is a view-only change
- deleting a field from the model is a separate structure action
- renaming in canvas is not the same as renaming the model field

### New field rename rule

- if a field was just added in Form Builder and has never been saved, renaming it updates both:
  - the model draft field label
  - the current view node title
- after the first successful `Save`, the field becomes fixed in the model
- after that point, ordinary rename in canvas updates only the current view
- later model-field rename must be a separate explicit model action

### Versioning rule

- use integer structure versions
- do not use fractional versions such as `0.1` or `0.01`

Accepted fields:

- `modelStructureVersion`
- `viewVersion`
- `lastAlignedModelStructureVersion`

`modelStructureVersion` should increment only when model structure changes, for example:

- field add
- field delete
- field type change
- field storage-key change
- subform add or delete
- model lock-policy change that affects structure

### View drift rule

- each view stores `lastAlignedModelStructureVersion`
- if `modelStructureVersion > lastAlignedModelStructureVersion`, the view is out of date relative to the model structure
- the views list should show a yellow warning triangle in that case
- tooltip copy should stay simple:
  - `Model structure changed`
- if a more specific reason is available, it may append:
  - `Field count changed`

### Locking rule

- `root` may lock model and view separately
- `model` lock and `view` lock are independent controls
- model lock blocks structure edits
- view lock blocks view authoring edits
- field-level lock remains separate from both

### Naming and storage rule

- keep readable named storage keys
- do not switch to abstract physical columns such as `field_1`, `field_2`, or `col_7`
- backend should generate physical names from stable keys

### Field identity rule

Each field must separate:

- immutable identity
  - `field.id`
- author-facing default label
  - `field.displayName`
- storage-safe backend key
  - `field.storageKey`

Important rule:

- `displayName` may change
- `storageKey` must not silently change after publish

### Element tab rule

If a field is already fixed in the model, the `Element` tab should show an informational storage block:

- database icon
- `Label`
- `Storage field`

Before publish this may be presented as projected storage information.
After publish this may present the real backend field name.

## Stage 1 - Contract Lock

### Goal

Freeze the exact behavior that frontend and backend will implement.

### Must lock

- model vs view lifecycle
- new-field rename rule before first save
- post-save view-only rename rule
- remove-from-canvas vs delete-from-model rule
- integer structure versioning
- view drift warning rule
- separate `model` and `view` root locks
- field identity split:
  - `id`
  - `displayName`
  - `storageKey`
- storage-info block rule in `Element` tab

### Concrete outputs

- update the builder contract docs so these rules are explicit
- update shared typed contracts so they can represent these fields
- remove any doc/code ambiguity where semantics still depend on field labels or titles

### Exit criteria

- no open ambiguity remains around when model data changes vs when view data changes
- no open ambiguity remains around when a field label may still update the model
- no open ambiguity remains around which version number drives the yellow warning triangle

## Stage 2 - Frontend Refactor

### Goal

Make the current `tenant-web` Form Builder state match the locked contract before wiring backend transport.

### Must implement

- introduce draft shape for model and current view that can be saved coherently
- stop treating model state and view state as two unrelated local-storage flows
- represent:
  - `modelStructureVersion`
  - `viewVersion`
  - `lastAlignedModelStructureVersion`
  - `displayName`
  - `storageKey`
  - model lock state
  - view lock state
  - field fixed/persisted state
- implement the new-field rename rule:
  - before first save -> rename updates model draft and view node
  - after first save -> rename updates view node only
- add the yellow warning triangle in the views list
- add root controls for separate model and view locks
- add storage info section in `Element` tab for fixed fields

### Must clean up

- remove remaining behavior that infers special semantics from field labels
- keep `remove from canvas` as a pure view action
- keep `delete from model` out of ordinary node deletion flows

### Exit criteria

- current frontend behavior matches the locked lifecycle without backend
- the UI can express all required states for backend responses
- the local authoring model is ready to swap from local persistence to transport-backed draft load/save

## Stage 3 - Backend Draft API

### Goal

Deliver the first real integrated draft lifecycle without publish-time storage mutation.

### Must implement

- `ps_model`
- `ps_view`
- `loadBuilderDraft`
- `saveBuilderDraft`
- optimistic concurrency for model and view draft saves
- backend lock validation for:
  - model lock
  - view lock
  - field lock
- backend validation for:
  - scope correctness
  - stable key presence
  - version conflicts
  - root-only concerns
  - field binding correctness

### API expectations

The draft API should return enough data for frontend to render:

- model draft
- current view draft
- versions
- lock state
- projected storage info
- validation errors
- validation warnings

### Must not implement in this stage

- DDL execution
- physical table creation
- physical column mutation
- SQL view generation
- destructive migration handling

### Exit criteria

- frontend loads model/view draft from backend instead of local-only persistence
- save returns authoritative versions and lock echo
- stale write and lock violation paths are handled cleanly in UI

### Current status

Implemented in the current pass:

- tenant metadata tables `ps_model` and `ps_view`
- tenant authoring routes:
  - `GET /app/platform-studio/forms/models/{modelId}/views/{viewId}/authoring`
  - `PUT /app/platform-studio/forms/models/{modelId}/views/{viewId}/authoring`
- legacy compatibility aliases remain temporarily available:
  - `GET /app/platform-studio/forms/models/{modelId}/views/{viewId}/draft`
  - `PUT /app/platform-studio/forms/models/{modelId}/views/{viewId}/draft`
- optimistic version checks for model and view save
- backend lock validation for model and view
- `tenant-web` workspace backend hydration/save wiring with local `404` fallback
- stable-key preparation in frontend contracts and route handling

Still deferred from later stages:

- publish lifecycle
- generated storage reconciliation
- full backend validation matrix beyond the current minimal draft slice

Important focus note:

- do not widen Stage 3 further until the authoring contract stays stable for model creation, view creation, and save semantics

## Stage 4 - Publish Slice

### Goal

Add safe publish-time reconciliation only after draft lifecycle is stable.

### Must implement

- `publishBuilderDraft`
- publish-time validation split from save-time validation
- additive-safe managed storage generation
- canonical SQL view generation
- per-view grid SQL view generation where allowed
- published artifact summary

### Allowed publish behavior

- add new field
- add new subform
- regenerate SQL views
- reconcile additive-safe storage changes

### Must reject in the first slice

- destructive storage changes
- published storage-key rename
- published table rename
- delete published field
- delete published subform
- incompatible type rewrite

### Exit criteria

- safe publish works for additive changes
- blocked publish paths return explicit structured errors
- draft save and publish remain clearly separate operations

## Recommended implementation order

1. lock contract and typed shape
2. refactor frontend state and UI behavior
3. wire `loadBuilderDraft` and `saveBuilderDraft`
4. stabilize concurrency and lock handling
5. add publish slice

## Out of scope for this pass

- automatic multi-view repair when model changes
- destructive schema migration
- rename-with-data-preservation workflow
- clone/export widening
- generalized workflow engine
- deep runtime release packaging
