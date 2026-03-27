# Platform Builder V2

## Purpose

This folder is the source of truth for the V2 reset of Platform Builder.

It exists because the previous implementation proved that the technical foundation can be useful, but the product direction drifted into a diagnostics-heavy admin surface instead of a focused authoring tool.

V2 starts from a different product assumption:

- Platform Builder should feel like a small set of strong builders
- the main job is authoring, not inspecting metadata
- the first-class builders are `Forms` and `Navigation`
- permissions and runtime concerns must support those builders, not dominate them

## Strategy Verdict

The owner strategy is correct and materially stronger than continuing to iterate on the current builder UI.

Why this direction is better:

- it puts the highest-value authoring job first: building data-backed UI
- it reduces the number of top-level surfaces
- it aligns with the proven need for multiple UI schemas over one data schema
- it treats `ezform` as an interaction reference instead of trying to keep the current cockpit UI alive
- it keeps room for deep permission rules such as locked schemas and locked fields

Main correction to the strategy:

- use `ezform` as a reference for interaction patterns and editing flow
- do not copy its code or legacy UI literally
- treat the current Platform Builder implementation as technical reference only

## Product Scope

V2 should start with two primary builders:

1. `Forms`
2. `Navigation`

This is enough for a meaningful Platform Builder V1.

Do not add many top-level pages unless they are proven necessary.
The likely shape is:

- one Platform Builder entry in the left rail area
- that entry opens `Forms` first
- later, optional supporting builder surfaces can be added if justified

Platform Builder should not be mixed into the main tenant sidebar as if it were a normal app module.
It is a builder workspace, not tenant runtime navigation.

## Builder 1: Forms

`Forms` is the main V2 builder.

Its job is not just to edit forms.
Its job is to manage the relationship between:

- data schemas
- UI schemas
- form/list/detail/grid variants
- behavior hooks
- nested structures

### Required concepts

#### Data Schema

A data schema defines the stable structural contract:

- entity name
- fields
- field types
- relations
- child collections
- constraints and field capabilities

#### UI Schema

A UI schema defines one presentation of a data schema.

Examples:

- detail view
- form view
- list/grid view
- compact mobile variant
- role-specific variant

Multiple UI schemas may point to the same data schema.

### Required authoring model

The Forms builder must support:

- a clear list of data schemas
- a clear list of UI schemas under each data schema
- fast opening of a chosen UI schema into a real builder workspace
- structured visual editing, not metadata-only editing
- nested structures such as sections, groups, tabs, and subforms
- binding existing fields into the UI
- configuring meaningful field/view properties
- preview with mock data until the backend is ready

### Permissions and locking

This must be designed early, not bolted on later.

Required permission capabilities:

- create a schema that is locked for structural editing
- allow some users to create or edit UI schemas without changing the data schema
- lock individual fields even when the schema remains otherwise editable
- distinguish between:
  - schema owners
  - UI authors
  - navigation authors
  - publishers or release owners

Minimum lock model:

- schema lock
- field lock
- UI-schema-only authoring permission
- readonly visibility for restricted users

Strongly recommended additions:

- schema versioning or clone-to-new-version workflow
- field deprecation state
- inherited UI schema from a locked base

## Builder 2: Navigation

`Navigation` is the second primary V2 builder.

The navigation builder should remain compact and direct.
The attached screenshot points in a more correct direction than the current inspector-heavy builder, but it still needs true editing behavior.

### Required navigation capabilities

- create hierarchy
- reorder nodes
- move nodes between parents
- define labels and icons
- attach a target
- configure visibility/access

### Recommended target types

- UI schema
- static tool
- external link
- route or internal runtime target

### Module concept

Do not force a separate `Module` object yet.

For V2, prefer a simpler model:

- navigation node types such as `group`, `item`, `divider`
- target types attached to items

If later evidence shows that `Module` has real behavior beyond a navigation grouping concept, it can be promoted into a first-class object.
Until then, keep the model smaller.

## What Should Not Be Top-Level Pages Yet

The owner instinct here is mostly right.

V2 does not currently need many separate pages.

Avoid making these first-class builders too early:

- Publish
- Runtime diagnostics
- Access dashboards
- Workflow dashboards
- registry overviews

These can exist as:

- contextual panels
- modal flows
- secondary tabs
- advanced settings

Only promote them to top-level pages when the product behavior clearly requires it.

## UX Rules

These are mandatory for V2.

### Forms

- the user lands in a master-detail object-and-screen workflow, not a summary dashboard
- the selected object detail stays on the same screen as the object list
- the selected screen opens into a real builder workspace
- the workspace centers the composed UI, not metadata cards
- tree, palette, and inspector support the canvas; they do not replace it

### Navigation

- the user sees and edits the tree directly
- reordering and moving must be first-class actions
- target assignment must be direct and understandable
- metadata belongs in secondary panels, not as the main experience

### Global

- one dominant task per screen
- progressive disclosure for ids, diagnostics, and technical metadata
- minimum steps from intent to result
- no cockpit-style control panel layouts

## Reference Usage

### `ezform`

Use as a reference for:

- builder interaction patterns
- structured visual editing
- palette/canvas/inspector ideas
- nested editing ergonomics

Do not use as a reference for:

- direct code reuse
- direct UI copying
- unexamined legacy assumptions

### `EXTDB`

Use as a reference for:

- proven business scenarios
- schema and UI relationships
- access patterns
- hidden operational needs

Do not use as a reference for:

- frontend architecture
- legacy implementation style
- overloaded object model without cleanup

### Current Platform Builder Implementation

Use as a reference for:

- draft/view mutation patterns
- preview path
- route wiring ideas
- typed contracts already worth preserving

Do not use as a reference for:

- screen layout
- information density
- product interaction model

## Implementation Boundaries

V2 should be delivered in bounded phases.

### Phase 1: V2 Product Frame

- define the Forms information architecture
- define the Navigation information architecture
- define permission and locking rules
- define target model for navigation
- decide where Platform Builder enters from the shell

### Phase 2: Forms Builder Foundation

- schema list + UI schema list
- open UI schema into builder workspace
- structured visual editing foundation
- mock preview

### Phase 3: Schema Permissions and Locking

- schema lock
- field lock
- UI-only authoring roles
- readonly states

### Phase 4: Navigation Builder

- editable tree
- reorder/move
- target assignment
- access rules

### Phase 5: Supporting Runtime Controls

- publish or dynamic model decision
- preview safety rules
- release workflow only if product-necessary

## Non-Goals For V2 Foundation Work

Do not spend the first slice on:

- giant builder dashboards
- runtime observability surfaces
- publish-center-first UX
- generalized metadata control panels
- deep technical diagnostics as primary UI

## Archiving the Current Builder

This V2 folder is also the home for archived reference material about the current Platform Builder implementation.

Important boundary:

- `platform/frontend/docs/platform-builder-v2/old-code-reference` is the normal place for reference documents, inventories, screenshots, and decisions
- the preferred long-term rule is still: do not keep active TypeScript or React source files inside `docs/`
- temporary exception: if the owner explicitly asks for a short-lived code dump during cleanup, a temporary snapshot may be placed under `platform/frontend/docs/platform-builder-v2/old-code-reference`
- that temporary snapshot must be treated as disposable archive material, not as a live source location
- the current temporary snapshot is intentionally reduced to a tiny draft/view reference subset rather than a full source dump
- after cleanup stabilizes, the temporary code dump should be removed or replaced with file maps and notes

## Decision Summary

The correct direction is:

- stop iterating on the current Platform Builder UI as the product baseline
- keep useful contracts and technical learnings
- reset the product around `Forms` and `Navigation`
- treat permissions and locking as core design work
- enter Platform Builder from the left rail area, not the tenant sidebar
