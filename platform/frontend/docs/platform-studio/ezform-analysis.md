# EZForm Analysis

## Purpose

This document captures what Platform Studio should take from `ezform`, what it should improve, and what it should explicitly reject.

`ezform` is a useful interaction reference for the future form builder, but it is not a production baseline for UI, architecture, or code structure.

The goal is to reuse the strongest ideas from `ezform` while building a better V2 authoring experience that fits the approved Platform Studio direction.

## Overall Verdict

`ezform` should be used primarily as an interaction and authoring-flow reference.

What it proves well:

- a three-zone builder shell is a strong fit for form authoring
- the left palette can be context-aware
- nested container authoring needs level-aware navigation
- a right-side inspector is the correct place for detailed settings
- an authored UI tree can be transformed into runtime-oriented schema contracts

What it does not prove:

- final UI quality
- permission-aware authoring
- locked-schema behavior
- mature editing of existing runtime-backed forms
- a production-ready component model

## Observed EZForm Model

The current `ezform` prototype is built around a three-zone shell:

- left: field palette
- center: form canvas
- right: settings panel

Relevant files:

- `reference-pack:ezform-prototype / src/components/Builder.tsx`
- `reference-pack:ezform-prototype / src/components/MainComponent.tsx`

### Left zone

The left zone is not static. It already reacts to the currently selected parent container.

Relevant file:

- `reference-pack:ezform-prototype / src/components/FieldList/FieldList.tsx`

Observed behavior:

- if no parent container is selected, only root-allowed elements are shown
- if a parent container is selected, the palette is filtered by:
  - `allowedChildTypes`
  - `disabledChildTypes`
  - `allowedParentTypes`

This is one of the strongest ideas in the reference.

### Center zone

The center zone acts as a structural authoring canvas, not a polished visual preview.

Relevant files:

- `reference-pack:ezform-prototype / src/components/FormBuilder/FormCanvas.tsx`
- `reference-pack:ezform-prototype / src/components/FormBuilder/FormField.tsx`

Observed behavior:

- the user works inside the currently selected level
- nested containers are opened by selecting them
- breadcrumb navigation shows the current path
- items are sortable within the current level
- a raw generated `dataSchema` and `uiSchema` dump is shown below the canvas

This center area proves the value of level-aware nested authoring, but it is visually and ergonomically too rough to copy directly.

### Right zone

The right zone is a settings inspector with tabs for:

- selected field or container
- form settings
- grid settings

Relevant files:

- `reference-pack:ezform-prototype / src/components/SettingsPanel/SettingsPanel.tsx`
- `reference-pack:ezform-prototype / src/components/SettingsPanel/FieldSettingsTab.tsx`
- `reference-pack:ezform-prototype / src/components/SettingsPanel/FormSettingsTab.tsx`
- `reference-pack:ezform-prototype / src/components/SettingsPanel/GridSettingsTab.tsx`

This general shape is correct for V2, but the taxonomy and control quality must improve.

## Strong Ideas To Take

### 1. Three-zone authoring shell

V2 should keep the overall shape:

- contextual palette
- central builder surface
- inspector

This is the strongest reusable interaction idea in `ezform`.

### 2. Context-aware palette

V2 should keep and improve the idea that the left palette changes based on the selected container.

Relevant file:

- `reference-pack:ezform-prototype / src/components/FieldList/FieldList.tsx`

This is especially important for containers such as:

- groups
- tabs
- tab items
- subforms

Example already proven by `ezform`:

- `tabs` allows only `tab_item`
- `tab_item` can only exist under `tabs`

Relevant file:

- `reference-pack:ezform-prototype / src/utils/constants.ts`

### 3. Level-aware nested editing

V2 should keep the idea that nested containers are authored by entering the current level and showing:

- where the user is
- what parent is active
- how to go back up

Relevant file:

- `reference-pack:ezform-prototype / src/components/FormBuilder/FormCanvas.tsx`

### 4. Inspector-driven detailed configuration

The right panel should remain the main place for editing:

- selected field settings
- selected container settings
- view-level settings
- optional list/grid settings

The exact tabs may change, but the overall role of the right column is correct.

### 5. Separate authoring model from runtime contracts

`ezform` already shows the value of building an internal authored tree and then converting it into `dataSchema` and `uiSchema`.

Relevant files:

- `reference-pack:ezform-prototype / src/context/FormContext.tsx`
- `reference-pack:ezform-prototype / src/utils/schemaGenerator.ts`

V2 should keep this concept, but with a more explicit boundary between:

- authored UI composition
- model structure
- runtime contracts

## What To Improve

### 1. Do not make drag-and-drop the only add path

`ezform` is too dependent on drag-and-drop for adding items.

Relevant file:

- `reference-pack:ezform-prototype / src/components/Builder.tsx`

V2 should use a hybrid interaction:

- visible palette for discoverability
- click-to-add for speed
- drag-and-drop as an optional advanced interaction

### 2. Replace rough structural list with a stronger builder canvas

The current center zone is more of a structural list than a convincing form-building workspace.

V2 should show:

- a stronger visual composition surface
- a clearer selected-node state
- better nested-container affordances
- inline insert targets where useful

### 3. Remove raw schema dumps from the main builder

The generated `dataSchema` and `uiSchema` output should not live in the main authoring screen.

If needed, these should be available through:

- developer mode
- diagnostics drawer
- advanced inspector section

### 4. Improve settings taxonomy

The current tab set in `ezform` is useful, but too rough for V2.

V2 should likely organize the right panel around:

- element settings
- view settings
- list or grid settings when the current view type supports them
- advanced diagnostics only when intentionally opened

### 5. Support true existing-schema authoring

`ezform` accepts `scheme` and `schemeUI` props, but the current reference does not show a mature hydrate-and-edit flow for existing contracts.

Relevant files:

- `reference-pack:ezform-prototype / src/components/MainComponent.tsx`
- `reference-pack:ezform-prototype / src/context/FormContext.tsx`

V2 must support:

- opening an existing model
- opening an existing view
- editing an existing authored structure
- preserving stable ids and mappings where required

## What To Reject

V2 should not copy the following directly:

- the MUI-based visual style
- the current rough canvas rendering
- raw JSON output in the main screen
- the exact file/module structure
- drag-only creation as the main add interaction
- unrestricted mixing of model and UI authoring

`ezform` is a reference for builder behavior, not a literal implementation template.

## Palette Strategy For V2

The left side should stay visible.

Do not replace it with a hidden action button menu only.

Recommended V2 approach:

- keep a visible contextual palette
- add a small search/filter input
- use clear, recognizable icons for each palette item
- allow click-to-add as the default action
- support drag-and-drop as optional power-user behavior
- optionally add inline `Add` actions on containers and canvas targets

Why this is better than a hidden-only menu:

- better discoverability
- better learning curve
- faster scanning of what is available at the current level
- clearer feedback when container rules change the allowed set

Palette presentation rules for V2:

- each item should have a meaningful icon
- data-field items should visually differ from layout and container items
- common widgets should be immediately recognizable:
  - checkbox
  - text field
  - number
  - select
  - group
  - tabs
  - subform
- the palette should look like a tool library, not a plain text list

## Recommended V2 Palette Categories

The palette should be organized, not flat.

Recommended categories:

- Data fields
- Layout
- Containers
- Static content
- Advanced

These categories should be filtered by:

- current container type
- current view type
- lock state
- current actor permissions

## Locked Schema And Locked Field Rules

This must be built into the Form Builder from the beginning.

### Locked data schema

When the data schema is locked:

- no new data fields may be added
- no model structure may be changed
- no model-level field definitions may be edited

Allowed work should depend on the exact permission mode.

### UI-only authoring mode

When the user is allowed to edit UI only:

- existing bound fields may be rearranged
- view layout may be changed within allowed limits
- view-level settings may be changed
- field presentation settings may be changed in the inspector

Disallowed actions:

- adding new data fields
- editing field data types
- editing core model constraints

### Locked field behavior

When an individual field is locked:

- that field cannot be structurally changed at the model level
- the UI may still be allowed to:
  - move it
  - hide it
  - change presentation settings

This should be policy-driven and explicit.

### Palette behavior in locked modes

The left palette must react to lock state.

Examples:

- in full model-edit mode, show layout, containers, and allowed data-field creation options
- in UI-only mode, hide or disable model-creation items and expose only allowed UI composition elements
- in strict readonly mode, disable add actions entirely and keep the builder in inspection mode

## Recommended V2 Builder Shape

The future V2 Form Builder should use the following shape:

- left: contextual palette with categories and search
- center: visual builder canvas with structure awareness
- optional outline or breadcrumb for nested levels
- right: inspector for selected element, container, or view

This means `ezform` is directionally correct, but V2 should be more product-focused, more permission-aware, and less technical in its default presentation.

## Take / Improve / Reject Summary

### Take

- three-zone builder shell
- contextual palette
- nested container rules
- level-aware navigation
- inspector-first detailed settings
- authoring-tree to contract transformation

### Improve

- stronger visual canvas
- click-to-add plus drag-and-drop
- category-based palette
- cleaner right-panel taxonomy
- proper editing of existing authored forms
- lock-aware and actor-aware behavior

### Reject

- direct visual/code copying
- drag-only add flow
- raw schema dumps in the main screen
- rough MUI prototype look
- unrestricted model/UI editing model

## Final Recommendation

Platform Studio should treat `ezform` as the main interaction reference for the future Form Builder.

The correct reuse strategy is:

- take the shell model
- take the context-aware palette concept
- take the nested-container authoring logic
- take the transformation boundary idea
- rebuild the rest around V2 product rules, permissions, and visual quality

The key V2 correction is this:

`ezform` assumes a mostly unrestricted authoring flow.

Platform Studio must support:

- locked data schemas
- locked fields
- UI-only authoring
- readonly users

That permission and locking model should shape the final builder behavior from the start rather than being added later.
