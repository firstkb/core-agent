# Form Builder Relationships

Status: active
Date: 2026-04-08

## Purpose

This document defines the current working contract for the `Relationships` section in Platform Studio Form Builder V2.

It exists to separate two concerns that were mixed together in legacy behavior:

- the accepted V2 lookup-backed relationship field
- relationship presets such as `Contact`, `Company`, and `Project`

This document is the detailed companion to:

- `form-builder-field-catalog.md`
- `form-builder-section-tree.md`
- `form-builder-v2-field-contract.md`
- `form-builder-page-and-filter-notes.md`

## Source Provenance

This relationship matrix stays grounded in the three original analysis inputs:

- `EXTDB`
  - lookup configuration UI, stored lookup params, form-type overloads, and checklist configuration
- `smartapp`
  - current runtime widget behavior for field `30`, modal dictionary behavior, ajax lookup behavior, and checklist rendering
- `ezform`
  - builder-facing expectations for explicit field settings and library-driven authoring

## Scope

This document covers only the `Relationships` palette section.

It does not define:

- `System Fields`
- choice-field presets
- page filters
- any future platform-native relation primitive
- the full `Subform` contract

## Canonical Relationships Section List

The `Relationships` section should include these create options, in this order:

1. `db_lookup`
2. `db_lookup_multi`
3. `contact_lookup`
4. `contacts_lookup`
5. `company_lookup`
6. `companies_lookup`
7. `project_lookup`
8. `projects_lookup`

Registry meaning:

- `db_lookup`
  - base field type
- `db_lookup_multi`
  - authoring shortcut over `db_lookup`
- the six relationship `*_lookup` entries
  - presets over `db_lookup`

## Current Boundary

- `DB lookup`
  - the accepted relationship field for source-model selection, explicit field selection, and runtime dictionary behavior
- `Contact`, `Contacts`, `Company`, `Companies`, `Project`, and `Projects`
  - presets that should compile over `DB lookup`, not new field primitives
- future platform-native relation semantics
  - out of the accepted tree for now

## `db_lookup`

Functional role:

- select one record from another model or lookup-backed source
- store one identifier or selected key
- display source data through either a search-select control or a modal dictionary widget

Required authoring capabilities:

- choose the source model or lookup source
- choose which source fields participate in lookup display
- choose which source field is stored as the actual value
- define source-side filters
- define dependent filters based on current form values
- control the runtime display mode

Recommended settings:

- `sourceModel`
- `storedValueField`
  - usually document id or another stable key
- `displayFields`
  - ordered list of source fields used for runtime display
- optional `displayTemplate`
- `searchFields`
- `sourceFilter`
- `dependentFilters`
- `allowEmpty`
- `displayMode`
  - `search_select`
  - `catalog_modal`
- `selectionMode`
  - `single`
  - `multiple`
- optional `groupByField`
- optional `itemLabelFields`
- optional `placeholder`

Selection note:

- lookup single and lookup multiple are now separate authoring choices
- multiselect lookup-backed fields must reuse the shared multivalue storage family
- do not invent a lookup-only storage exception for multiselect behavior
- `selectionMode` is compile-time metadata, not a freeform post-create toggle
- after field creation the builder should treat `selectionMode` as locked

## `db_lookup` Display Mode Contract

Current V2 rule for new authored fields:

- the builder should let the user choose `displayMode` explicitly
- do not infer the runtime mode only from legacy field count when the field is authored in V2

Display modes:

- `search_select`
  - searchable select with ajax calls against the chosen model dictionary
- `catalog_modal`
  - modal dictionary with grouped sections and explicit select buttons for each item

Legacy-compatible interpretation:

- current legacy behavior stores one ordered lookup param string such as `form^fieldA|fieldB|fieldC`
- the runtime then infers display behavior from the selected field count and order
- V2 should use explicit `displayMode` and explicit display structure settings instead

Recommended normalization:

- `storedValueField`
  - explicit field for the value that will be saved
- `groupByField`
  - explicit field for category or group heading when the modal dictionary is used
- `itemLabelFields`
  - explicit ordered fields rendered as the selectable item label
- `displayTemplate`
  - explicit label template used mainly by `search_select` presets
- `displayMode`
  - explicit major runtime mode for the field

Compatibility note:

- if a migrated field has no explicit `displayMode`
  - the importer may infer one from legacy lookup params
- if the migrated legacy lookup picks only one non-key display field
  - normalize to `displayMode = search_select`
- if the migrated legacy lookup picks two or more non-key display fields
  - normalize to `displayMode = catalog_modal`
  - treat the first display field as `groupByField`
  - treat the remaining display fields as `itemLabelFields`

For newly authored fields:

- `displayMode` should be required
- the builder should not hide this decision behind legacy heuristics

## `db_lookup` Checklist Composition

Important boundary:

- checklist behavior should not create a second relationship field type
- it is a composition pattern built from `Subform` plus child fields

Observed legacy composition:

- parent subform uses `subformType = CHECKLIST`
- one child `db_lookup` field acts as the dictionary source for checklist items
- one child result field stores the answer such as `Pass`, `Fail`, or `NA`
  - legacy authoring often used `COMBOBOX (custom selections)`
  - V2 should normalize this to child `single_select`
  - recommended authoring path is `Radio group` over `single_select`
  - runtime may render the answer as button-style radio choices
- optional child fields may carry notes and files

Observed checklist settings:

- `Lookup Field`
  - points to the child `db_lookup` field that supplies the source catalog
- `Result Field`
  - points to the child `single_select` answer field used for checklist responses

Runtime implication:

- grouped checklist sections come from the lookup display structure
- flat checklist rows come from a lookup source with no category grouping
- checklist composition does not own corrective-action workflow behavior

V2 position:

- keep `db_lookup` in `Relationships`
- keep checklist-specific orchestration in the future `Subform` or checklist contract
- allow checklist builders to reference a `db_lookup` field as the source dictionary field
- keep child-table ownership on the `Subform` side, not on `db_lookup`
- keep `Corrective Action` outside the checklist relationship contract and attach it at the view level

## Lookup Presets

### `contact_lookup`

- preset over `db_lookup`
- sets the source model to the shared contact and user source
- default `displayMode`: `search_select`
- default display template: `users_firstname + ' ' + users_lastname`
- default search fields:
  - `users_firstname`
  - `users_lastname`
- uses backend ajax dictionary search by default
- compiles to:
  - `baseType = db_lookup`
  - `fieldPreset = contact_lookup`
  - `selectionMode = single`

### `contacts_lookup`

- preset over `db_lookup`
- same source and defaults as `contact_lookup`
- creates a multiselect contact lookup authoring path
- compiles to:
  - `baseType = db_lookup`
  - `fieldPreset = contact_lookup`
  - `selectionMode = multiple`

### `company_lookup`

- preset over `db_lookup`
- sets the source model to companies
- default `displayMode`: `search_select`
- default display template: `company_name`
- default search fields:
  - `company_name`
- uses backend ajax dictionary search by default
- compiles to:
  - `baseType = db_lookup`
  - `fieldPreset = company_lookup`
  - `selectionMode = single`

### `companies_lookup`

- preset over `db_lookup`
- same source and defaults as `company_lookup`
- creates a multiselect company lookup authoring path
- compiles to:
  - `baseType = db_lookup`
  - `fieldPreset = company_lookup`
  - `selectionMode = multiple`

### `project_lookup`

- preset over `db_lookup`
- sets the source model to projects
- default `displayMode`: `search_select`
- default display template: `projects_num + ', ' + projects_name`
- common alternative display template: `projects_name`
- default search fields:
  - `projects_num`
  - `projects_name`
- uses backend ajax dictionary search by default
- compiles to:
  - `baseType = db_lookup`
  - `fieldPreset = project_lookup`
  - `selectionMode = single`

### `projects_lookup`

- preset over `db_lookup`
- same source and defaults as `project_lookup`
- creates a multiselect project lookup authoring path
- compiles to:
  - `baseType = db_lookup`
  - `fieldPreset = project_lookup`
  - `selectionMode = multiple`

### `db_lookup_multi`

- authoring shortcut over `db_lookup`
- keeps generic source selection instead of preset source defaults
- compiles to:
  - `baseType = db_lookup`
  - `selectionMode = multiple`

All lookup presets and shortcuts must still allow the user to change:

- filters
- display fields
- display template
- search fields
- display mode

Locked authoring rule:

- the user chooses `single` vs `multiple` at create time through the palette item they add
- the `Element` tab should not expose a mutable `selectionMode` switch after creation
- if shown at all, `selectionMode` should be readonly metadata only

## Current Acceptance Position

Accepted now:

- `db_lookup` stays as a real relationship field
- `db_lookup_multi` is accepted as a palette shortcut over `db_lookup`
- `db_lookup` must support model selection plus explicit field selection
- `db_lookup` must expose an explicit `displayMode` for new authored fields
- `db_lookup` must support both ajax search-select and grouped modal dictionary behavior
- checklist composition may reuse `db_lookup` as a source field
- `Contact`, `Contacts`, `Company`, `Companies`, `Project`, and `Projects` remain presets
- single and multiple lookup authoring must use separate palette entries
- `selectionMode` is create-time only

Still open:

- exact migrated shape for legacy ordered lookup params
- whether a future platform-native relation primitive is ever needed at all
