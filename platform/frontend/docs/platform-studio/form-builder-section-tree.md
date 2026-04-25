# Form Builder Section Tree

Status: exact detail reference
Historical status: active
Date: 2026-04-08
Last audited: 2026-04-25
Read rule: Open only after the active Form Builder module docs, and only when exact payload/settings/history detail is needed.
Canonical active docs:

- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

## Purpose

This document provides one complete review tree for all current Form Builder sections and the items that belong to each section.

It exists to support section-by-section review before the final list is locked in implementation.

For the final accepted implementation gate, use:

- `form-builder-accepted-registry.md`

Each node includes:

- section placement
- item type
- short functional description
- canonical registry
- compile target
- review status

This is a working review artifact that should make later refinement easier than reviewing isolated lists one by one.

## Source Provenance

This tree must stay grounded in the three original inputs:

- `EXTDB`
  - legacy EzData builder source for field ids, legacy field families, and EzData Page semantics
- `smartapp`
  - current runtime source for real rendering behavior, EJS templates, field overloads, and UI expectations
- `ezform`
  - authoring-shell source for schema split, builder organization, and editor structure

V2 synthesis rule:

- if a node is normalized or renamed in V2, it must still be explainable from one or more of these three sources
- do not introduce a V2 node with no traceable basis in `EXTDB`, `smartapp`, or `ezform`

## Status Legend

- `locked`
  - already aligned with the current V2 contract
- `candidate`
  - intended to exist, but detailed implementation or final naming still needs follow-up
- `review`
  - visible in the tree on purpose because its final shape is still a decision point

## Tree Rules

- This tree includes layout, content, fields, System Fields, and ready-made fields in one place for review convenience.
- Not every node in the tree is a backend `baseType`.
- `System Fields` are palette shortcuts with view semantics, not standalone base field types.
- `System Fields` are root-level only and do not belong inside subforms or nested scopes.
- `Ready-made fields` are authoring shortcuts layered on top of a base field type.
- `Layout` may also expose user-facing shortcuts layered on top of canonical layout nodes.
- `Layout` and `Content` nodes are part of the builder palette but are not model fields.

## Canonical Registries

The system should treat these registries as the canonical ontology, even when the palette groups them differently for UX:

- `Field Types Registry`
  - real model-backed field primitives that define value shape, validation family, and storage intent
- `Field Presets Registry`
  - authoring shortcuts layered on top of a base field type
- `Semantic/System Bindings Registry`
  - semantic bindings that connect a field to view or workflow meaning
- `Layout Nodes Registry`
  - structural nodes used to compose the view layout
- `Content Nodes Registry`
  - static non-field nodes used for authored informational content

## Palette Review Projection

This document is a palette-oriented review projection, not the primary ontology of the system.

Meaning:

- one palette section may project items from more than one canonical registry
- `Relationships` contains both field types and relationship-oriented presets
- `Ready-made fields` contains field presets only
- `System Fields` contains semantic bindings that may create or bind a field
- `Layout` may include user-facing shortcuts such as `Checklist subform` that compile down to canonical layout nodes
- `Layout` and `Content` are palette sections, but compile to non-field registries

The palette is for authoring UX.
The registries are for contracts, compiler rules, and persistence behavior.

## Full Tree

- `Basic fields`
  - source basis: `EXTDB` + `smartapp` + `ezform`
  - canonical registry: `Field Types Registry`
  - compile model: each item compiles to `ModelFieldDefinition.baseType = <item>`
  - `Short text`
    - type: base field type
    - function: single-line textual value for names, titles, codes, and short answers
    - compiles to: `baseType = short_text`
    - status: `locked`
  - `Long text`
    - type: base field type
    - function: multi-line textual value for notes, comments, and narrative answers
    - compiles to: `baseType = long_text`
    - status: `locked`
  - `Long text historical`
    - type: authoring entry over `Long text`
    - function: append-only memo stream for notes with user/date history
    - compiles to: `baseType = long_text` plus `historicalUpdates = true`
    - status: `locked`
  - `Rich text`
    - type: base field type
    - function: stored formatted content as model data
    - source note: normalized from legacy editor behavior and current runtime expectations
    - compiles to: `baseType = rich_text`
    - status: `locked`
  - `Integer`
    - type: base field type
    - function: whole-number value for counts and discrete numeric measurements
    - source note: explicit V2 split from older coarse numeric handling
    - compiles to: `baseType = integer`
    - status: `locked`
  - `Decimal`
    - type: base field type
    - function: fractional numeric value for precise measurements and scores
    - source note: explicit V2 split from older coarse numeric handling
    - compiles to: `baseType = decimal`
    - status: `locked`
  - `Currency`
    - type: base field type
    - function: monetary amount with currency semantics
    - compiles to: `baseType = currency`
    - status: `locked`
  - `Boolean`
    - type: base field type
    - function: true or false value
    - compiles to: `baseType = boolean`
    - status: `locked`
  - `Date`
    - type: base field type
    - function: calendar date without time-of-day
    - compiles to: `baseType = date`
    - status: `locked`
  - `Date & time`
    - type: base field type
    - function: timestamp with both date and time
    - compiles to: `baseType = date_time`
    - status: `locked`
  - `Signature`
    - type: base field type
    - function: captured signature tied to one record
    - source note: normalized from legacy memo/title-marker behavior and smartapp runtime conventions
    - compiles to: `baseType = signature`
    - status: `locked`
  - `Geo point`
    - type: base field type
    - function: one latitude and longitude pair
    - source note: normalized from smartapp runtime behavior and explicit V2 field typing
    - compiles to: `baseType = geo_point`
    - status: `locked`
  - `Attachment`
    - type: base field type
    - function: uploaded file or file collection attached to one record
    - source note: normalized from current runtime usage where files are part of specialized flows
    - compiles to: `baseType = attachment`
    - status: `locked`

- `Choice fields`
  - source basis: `EXTDB` + `smartapp` + `ezform`
  - canonical registry: `Field Types Registry`
  - compile model: each item compiles to `ModelFieldDefinition.baseType = <item>`
  - `Single select`
    - type: base field type
    - function: one selected option from a fixed or supplied option set
    - compiles to: `baseType = single_select`
    - status: `locked`
  - `Multi select`
    - type: base field type
    - function: multiple selected options from a fixed or supplied option set
    - compiles to: `baseType = multi_select`
    - status: `locked`

- `Relationships`
  - source basis: `EXTDB` + `smartapp` + `ezform`
  - canonical registry: mixed
    - field types: `DB lookup`
    - field presets: `DB lookup value`, `DB lookup multi`, `Contact`, `Contacts`, `Company`, `Companies`, `Project`, `Projects`
  - compile model:
    - field types compile to `ModelFieldDefinition.baseType`
    - presets compile to `baseType = db_lookup` plus target/source preset metadata
  - `DB lookup`
    - type: base field type
    - function: lookup-backed relation with explicit source model, selected display fields, and runtime dictionary behavior
    - source note: current runtime supports both ajax search-select and grouped modal dictionary behavior
    - compiles to: `baseType = db_lookup`
    - status: `locked`
  - `DB lookup multi`
    - type: lookup preset
    - function: generic multiselect lookup shortcut over `DB lookup`
    - compiles to: `baseType = db_lookup`, `selectionMode = multiple`
    - status: `locked`
  - `DB lookup value`
    - type: lookup preset
    - function: generic lookup shortcut that stores one selected source string value directly
    - compiles to: `fieldPreset = db_lookup_value` over `db_lookup`, `selectionMode = single`
    - status: `locked`
  - `Contact`
    - type: lookup preset
    - function: lookup shortcut over the shared contact and user source with full-name search-select behavior
    - compiles to: `fieldPreset = contact_lookup` over `db_lookup`, `selectionMode = single`
    - status: `locked`
  - `Contacts`
    - type: lookup preset
    - function: multiselect lookup shortcut over the shared contact and user source with full-name search-select behavior
    - compiles to: `fieldPreset = contact_lookup` over `db_lookup`, `selectionMode = multiple`
    - status: `locked`
  - `Company`
    - type: lookup preset
    - function: lookup shortcut preconfigured to the company source with `company_name` search-select behavior
    - compiles to: `fieldPreset = company_lookup` over `db_lookup`, `selectionMode = single`
    - status: `locked`
  - `Companies`
    - type: lookup preset
    - function: multiselect lookup shortcut preconfigured to the company source with `company_name` search-select behavior
    - compiles to: `fieldPreset = company_lookup` over `db_lookup`, `selectionMode = multiple`
    - status: `locked`
  - `Project`
    - type: lookup preset
    - function: lookup shortcut preconfigured to the project source with project mask or project-name search-select behavior
    - compiles to: `fieldPreset = project_lookup` over `db_lookup`, `selectionMode = single`
    - status: `locked`
  - `Projects`
    - type: lookup preset
    - function: multiselect lookup shortcut preconfigured to the project source with project mask or project-name search-select behavior
    - compiles to: `fieldPreset = project_lookup` over `db_lookup`, `selectionMode = multiple`
    - status: `locked`

- `System Fields`
  - source basis: `EXTDB` + `smartapp` + `ezform`
  - canonical registry: `Semantic/System Bindings Registry`
  - compile model: each item compiles to `create or bind field` plus `ViewDefinition.systemFields.<role>`
  - `Reported By`
    - type: System Field
    - function: creates or binds a people/contact-style field and writes the `reportedBy` semantic binding for the view
    - source note: normalized from EzData Page `Field By`
    - compiles to: `bind(fieldId)` or `create(field)` + `view.systemFields.reportedBy`
    - status: `locked`
  - `Reported Date`
    - type: System Field
    - function: creates or binds a date field and writes the `reportedDate` semantic binding for the view
    - source note: normalized from EzData Page `Field Date`
    - compiles to: `bind(fieldId)` or `create(field)` + `view.systemFields.reportedDate`
    - status: `locked`
  - `Status`
    - type: System Field
    - function: creates or binds a variant-capable status field and writes workflow semantics such as initial and final values
    - source note: normalized from EzData Page `Field Status` and smartapp status runtime
    - compiles to: `bind(fieldId)` or `create(field)` + `view.systemFields.workflowStatus`
    - status: `locked`

- `Ready-made fields`
  - source basis: `EXTDB` + `smartapp` + `ezform`
  - canonical registry: `Field Presets Registry`
  - compile model: each item compiles to `baseType + fieldPreset + preset metadata`
  - `Email`
    - type: field preset
    - function: `Short text` with email validation and formatting expectations
    - compiles to: `baseType = short_text`, `fieldPreset = email`
    - status: `locked`
  - `Phone`
    - type: field preset
    - function: `Short text` with phone formatting and mask expectations
    - compiles to: `baseType = short_text`, `fieldPreset = phone`
    - status: `locked`
  - `URL`
    - type: field preset
    - function: `Short text` with URL validation expectations
    - compiles to: `baseType = short_text`, `fieldPreset = url`
    - status: `locked`
  - `Tags`
    - type: field preset
    - function: ready-made choice preset typically layered on top of `Multi select`
    - compiles to: `baseType = multi_select`, `fieldPreset = tags`
    - status: `locked`
  - `Date today`
    - type: field preset
    - function: `Date` preset with default current-date behavior
    - compiles to: `baseType = date`, `fieldPreset = date_today`
    - status: `locked`
  - `Radio group`
    - type: field preset
    - function: single-choice preset rendered as radio controls or button-style options
    - source note: absorbs legacy `COMBOBOX (Yes/No)` behavior as a default-option preset, not as a separate field ontology
    - compiles to: `baseType = single_select`, `fieldPreset = radio_group`
    - authoring note: supports vertical or horizontal layout, native or button rendering, and optional per-option button colors
    - status: `locked`
  - `Checkbox group`
    - type: field preset
    - function: multi-choice preset rendered as checkbox controls or button-style options
    - compiles to: `baseType = multi_select`, `fieldPreset = checkbox_group`
    - authoring note: supports vertical or horizontal layout, native or button rendering, `minSelections`, and optional per-option button colors
    - status: `locked`

- `Advanced fields`
  - source basis: `EXTDB` + `smartapp` + `V2 synthesis`
  - canonical registry: reserved extension section
  - compile model: section accepted; each node below remains deferred until explicit acceptance before implementation
  - `Computed field`
    - type: specialized field
    - function: derived value produced from other data or backend logic rather than direct manual entry
    - compiles to: review
    - status: `candidate`
  - `Readonly text`
    - type: review node
    - function: readonly textual display backed by a field or computed value
    - compiles to: likely `baseType + readonly presentation`, not a standalone field type
    - status: `review`
  - `Readonly numeric`
    - type: review node
    - function: readonly numeric display backed by a field or computed value
    - compiles to: likely `baseType + readonly presentation`, not a standalone field type
    - status: `review`
  - `Survey element`
    - type: specialized field
    - function: legacy survey-oriented input surface that may remain a separate specialized authoring path
    - compiles to: review
    - status: `candidate`
  - `SQL field`
    - type: specialized field
    - function: backend-driven or query-backed value surface for advanced data sourcing
    - compiles to: review
    - status: `candidate`

- `Layout`
  - source basis: `EXTDB` + `ezform` + `smartapp`
  - canonical registry: mixed
    - layout nodes: `Section`, `Group`, `Tabs`, `Tab item`, `Grid layout`, `Column`, `Subform`, `Divider`, `Spacer`
    - layout shortcuts: `Checklist subform`
  - compile model:
    - layout nodes compile to `LayoutNode.type = <item>`
    - layout shortcuts compile to canonical layout nodes plus authored settings
  - `Section`
    - type: layout node
    - function: top-level major surface for one area of a view, intended to render as a card-like container
    - source note: allowed only at the root of the current form scope; if a scope has no explicit `Section`, the whole scope should render inside one default card surface
    - compiles to: `layout.section`
    - status: `locked`
  - `Group`
    - type: layout node
    - function: clusters related items into one visual unit
    - compiles to: `layout.group`
    - status: `locked`
  - `Tabs`
    - type: layout node
    - function: contains multiple tab pages inside one area
    - compiles to: `layout.tabs`
    - status: `locked`
  - `Tab item`
    - type: layout node
    - function: one child page inside a `Tabs` container
    - compiles to: `layout.tab_item`
    - status: `locked`
  - `Grid layout`
    - type: layout node
    - function: multi-column layout container
    - compiles to: `layout.grid`
    - status: `locked`
  - `Column`
    - type: layout node
    - function: child column inside a grid layout
    - compiles to: `layout.column`
    - status: `locked`
  - `Subform`
    - type: layout node
    - function: repeated child-record area backed by a dedicated child table
    - source note: supports `subformType = DEFAULT | CHECKLIST`; owns a dedicated child schema scope with its own `dataSchema` and `uiSchema`; default mode renders as a child table and checklist mode binds a child `DB lookup` source field and a child `single_select` result field
    - compiles to: `layout.subform`
    - status: `locked`
  - `Checklist subform`
    - type: layout shortcut
    - function: user-facing shortcut that creates a `Subform` already configured for checklist behavior
    - compiles to: `layout.subform` with `subformType = CHECKLIST`
    - status: `locked`
  - `Divider`
    - type: layout node
    - function: visual separator between blocks
    - compiles to: `layout.divider`
    - status: `locked`
  - `Spacer`
    - type: layout node
    - function: controlled empty space for layout rhythm
    - compiles to: `layout.spacer`
    - status: `locked`

- `Content`
  - source basis: `EXTDB` + `ezform` + `smartapp`
  - canonical registry: `Content Nodes Registry`
  - compile model: each item compiles to a non-field content node inside layout
  - `Heading`
    - type: content node
    - function: static heading for hierarchy and section emphasis
    - compiles to: `content.heading`
    - status: `locked`
  - `Text block`
    - type: content node
    - function: static plain text copy
    - compiles to: `content.text`
    - status: `locked`
  - `Rich text block`
    - type: content node
    - function: static formatted content block inside a view
    - compiles to: `content.rich_text`
    - status: `locked`

## System Field Contract Snapshot

Each accepted System Field should obey these rules:

- it is a dedicated palette item
- it may either create a new compatible field or bind to an existing compatible field
- the semantic binding lives on `ViewDefinition.systemFields`
- one `systemFields` block exists only once per form view
- System Fields are first-level form semantics only
- System Fields must not be configured for subforms or other nested scopes
- one semantic role may bind only one field per view
- semantic roles are unique per view
- the binding must use an explicit structured key, never a label convention

Current role expectations:

- `Reported By`
  - underlying type: people/contact-style lookup field
  - semantic key: `reportedBy`
- `Reported Date`
  - underlying type: `date` or `date_time`
  - semantic key: `reportedDate`
- `Status`
  - underlying type: status-capable `single_select`
  - semantic key: `workflowStatus`
  - extra semantic values: `initialValue`, `finalValue`

## Lookup Model Snapshot

Current accepted position:

- `DB lookup` is the accepted relationship field in the current tree
- `DB lookup multi`, `Contact`, `Contacts`, `Company`, `Companies`, `Project`, and `Projects` remain presets over `DB lookup`
- single and multiple lookup authoring should use separate palette entries
- new builder authoring should choose `displayMode` explicitly for `DB lookup`
- checklist-style subforms may reuse `DB lookup` as a source dictionary field, but that checklist behavior belongs to subform composition rather than a second lookup base type

What is still unresolved:

- the exact migrated shape for legacy ordered lookup params
- whether a future platform-native relation primitive is needed at all

## Layout Boundary Snapshot

The current working distinction is:

- `Section`
  - root-level major layout surface
  - recommended to render as a card-like container
  - allowed only at the root of the main form or the root of a subform scope
  - if no root `Section` exists for a scope, the whole scope should render in one default card surface
- `Subform`
  - repeated child-record scope
  - owns a dedicated child table
  - owns a dedicated child schema scope with its own `dataSchema` and `uiSchema`
  - `CHECKLIST` is a subform mode, not a second layout node
- `Repeater`
  - not accepted in the current V2 tree because repeated child collections are handled by `Subform`

This removes the old overlap between `Subform` and `Repeater` before coding starts.

## Main Review Tensions Visible In The Tree

- `Readonly text` and `Readonly numeric`
  - currently kept visible as review nodes because they may remain palette-visible but should probably compile down to a preset over `short_text`, `integer`, `decimal`, `currency`, or `computed`
- `Advanced fields`
  - the section is accepted as a reserved extension area, but no child item is accepted yet
- `DB lookup` display modes
  - the builder must make `search_select` versus `catalog_modal` explicit instead of inheriting legacy heuristics
- generic status modeling versus `System Field Status`
  - non-workflow status cases should use `Single select` or `Radio group`
  - `System Field Status` carries explicit workflow semantics in the view
- `Rich text` versus `Rich text block`
  - one is model data
  - one is static authored content

## Recommended Review Order

Review the tree from the most stable branch to the most ambiguous branch:

1. `Basic fields`
2. `Choice fields`
3. `Relationships`
4. `System Fields`
5. `Ready-made fields`
6. `Advanced fields`
7. `Layout`
8. `Content`

This order keeps the final list anchored in stable data-entry primitives before discussing shortcuts, advanced cases, and non-field nodes.
