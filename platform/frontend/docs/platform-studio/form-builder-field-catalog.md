# Form Builder Field Catalog

## Purpose

This document defines the proposed final field and layout catalog for Platform Studio Form Builder.

For the final accepted implementation gate, use:

- `form-builder-accepted-registry.md`

For one complete review tree across all sections and all items, use:

- `form-builder-section-tree.md`

It exists to prevent the old builder problem where one dropdown mixed together:

- data types
- UI widgets
- layout blocks
- content blocks
- readonly modes
- special legacy integrations

V2 should keep these concerns separate.

## Core Principle

The Form Builder palette should be organized into user-friendly sections:

- basic fields
- choice fields
- relationships
- System Fields
- ready-made fields
- advanced fields
- layout
- content

Not every visible choice in the UI should become a new backend field type.

## Field Palette Section Structure

The builder palette should use these sections, in this order:

1. `Basic fields`
   - foundational model fields such as text, long text, rich text, numeric, boolean, date, date-time, signature, geo, and attachment
2. `Choice fields`
   - option-backed value fields such as `Single select` and `Multi select`
3. `Relationships`
   - `DB lookup`, `DB lookup multi`, and relationship-oriented shortcuts such as `Contact`, `Contacts`, `Company`, `Companies`, `Project`, `Projects`
4. `System Fields`
   - `Reported By`, `Reported Date`, `Status`
5. `Ready-made fields`
   - authoring shortcuts such as `Email`, `Phone`, `URL`, `Tags`, `Date today`, `Radio group`, and `Checkbox group`
6. `Advanced fields`
   - computed, readonly, survey, SQL, and other non-default data authoring cases
7. `Layout`
   - structure and composition nodes such as sections, groups, tabs, grids, subforms, and spacers
8. `Content`
   - static informational nodes such as headings, text blocks, and rich text blocks

Section rules:

- `DB lookup` belongs to `Relationships`, not to `Choice fields`
- generic non-workflow status cases should be modeled through `Single select` or `Radio group`
- `Status` belongs to `System Fields` only when it binds workflow semantics for the view
- palette section assignment must not depend only on legacy `family`
- palette section assignment should be derived from field semantics such as `baseType`, relation source, or preset intent

Current slice note:

- the current frontend placeholder model still stores a coarse `family`
- the workspace palette should classify items with an explicit section resolver, not by rendering `family` directly

## Source Framing

This catalog is grounded in three different reference layers:

- `EXTDB`
  - canonical source for legacy field ids, legacy names, and EzData Page metadata
- `smartapp`
  - canonical source for current runtime widget behavior, field overloads, and visual conventions
- `ezform`
  - authoring-shell and schema-split reference only

Use them with strict roles:

- legacy ids and runtime templates are migration inputs, not V2 naming
- `ezform` does not define the final business field taxonomy
- page metadata, access overlays, form-type overlays, and string markers must not be promoted into base field types

## Final V2 Catalog

### 1. Basic Fields

These are model-backed foundational field types.

- `Short text`
- `Long text`
- `Rich text`
- `Integer`
- `Decimal`
- `Currency`
- `Boolean`
- `Date`
- `Date & time`
- `Signature`
- `Geo point`
- `Attachment`

Detailed per-field functionality and settings for this section are locked in:

- `form-builder-core-data-fields.md`

### 2. Choice Fields

These fields represent option-backed value selection.

- `Single select`
- `Multi select`

Detailed functionality and settings for this section are locked in:

- `form-builder-choice-fields.md`

### 3. Relationships

These fields need explicit source, display, and relation behavior.

- `DB lookup`
- `DB lookup multi`
- `Contact`
- `Contacts`
- `Company`
- `Companies`
- `Project`
- `Projects`

Detailed functionality and settings for this section are tracked in:

- `form-builder-relationships.md`

### 4. System Fields

These are palette-level authored shortcuts for page semantics.
They are not new base field primitives.

- `Reported By`
- `Reported Date`
- `Status`

Detailed functionality and settings for this section are locked in:

- `form-builder-system-fields.md`

### 5. Ready-made Fields

These are user-friendly authored shortcuts layered on top of underlying base field types.

- `Email`
- `Phone`
- `URL`
- `Tags`
- `Date today`
- `Radio group`
- `Checkbox group`

Detailed functionality and settings for this section are locked in:

- `form-builder-ready-made-fields.md`

### 6. Advanced Fields

This section is accepted as a reserved extension area in the library.
No specific advanced field is accepted yet.

Current deferred backlog:

- `Computed field`
- `Readonly text`
- `Readonly numeric`
- `Survey element`
- `SQL field`

The section-level contract is locked in:

- `form-builder-advanced-fields.md`

### 7. Layout

These are structural UI elements.
They are not model fields.

- `Section`
  - top-level major surface inside a view
  - recommended to render as a card-like container
- `Group`
  - groups related items into one visual unit
- `Tabs`
  - tabbed container
- `Tab item`
  - one tab inside a `Tabs` container
- `Subform`
  - repeated child-record form backed by a dedicated child table
- `Checklist subform`
  - user-facing shortcut over `Subform`
  - compiles to `Subform` with `subformType = CHECKLIST`
- `Grid layout`
  - multi-column layout container
- `Column`
  - child column inside `Grid layout`
- `Divider`
  - visual separator
- `Spacer`
  - controlled vertical or horizontal spacing

### 8. Content

These are non-data authoring elements.

- `Heading`
  - static heading for sectioning or emphasis
- `Text block`
  - plain static copy
- `Rich text block`
  - formatted content block

Detailed functionality and settings for this section are locked in:

- `form-builder-content-nodes.md`

## What Should Be Presets Instead Of Separate Base Types

The following should not become separate core field types:

- `Radio group`
  - use `Single select` with `controlType = radio`
  - allow `renderStyle = native | buttons`
  - allow `orientation = vertical | horizontal`
  - allow per-option button colors when rendered as buttons
- `Checkbox group`
  - use `Multi select` with `controlType = checkbox`
  - allow `renderStyle = native | buttons`
  - allow `orientation = vertical | horizontal`
  - support `minSelections`
  - allow per-option button colors when rendered as buttons
- `Email`
  - use `Short text` with email format and validation
- `Phone`
  - use `Short text` with mask and validation
- `URL`
  - use `Short text` with url format and validation
- `Date today`
  - use `Date` with `defaultNow` and optional readonly mode
- `Readonly text`
  - use `Short text` or `Computed field` with readonly mode when possible
- `Readonly numeric`
  - use `Integer`, `Decimal`, `Currency`, or `Computed field` with readonly mode when possible
- `Project`
  - lookup template with a preset target model
- `Contact`
  - lookup template with a preset target model
- `Company`
  - lookup template with a preset target model

These should still be visible as separate choices in the UI if that improves usability.
They are separate create options, not necessarily separate backend primitives.

`System Fields` are a separate palette group again:

- they are not base field types
- they emit a field plus an explicit semantic binding

## What Is Not A Base Field Type

The source review confirmed that these concerns must stay out of the base field catalog:

- EzData Page / View settings
  - `Icon`
  - `CA page`
- page-level filter and prefilter definitions
- per-page field access overlays
  - `Default`
  - `View Only`
  - `Edit Field`
  - `Hidden`
- runtime-only form-type overlays
  - `SOR`
  - `CHECKLIST`
  - `CA`
- control tokens or display aliases
  - `80 TABS`
  - `view`
  - `hidden`
  - `301`
  - `302`
- brittle title and label markers in the current runtime
  - `*` title prefix
  - exact `GPS coordinates`
  - substring `Signature`
  - exact `Verification Req.`

These should become explicit V2 view settings, visibility rules, presets, or runtime behaviors.
They should not appear as first-class model field primitives.

Field-backed legacy settings should surface through `System Fields` instead of raw page-setting dropdowns:

- `Field By` -> `Reported By`
- `Field Date` -> `Reported Date`
- `Field Status` plus draft/finish variants -> `Status`

## Legacy Mapping

This is the recommended mapping from the old builder catalog into the V2 catalog.

- `200 TEXT (any symbol)` -> `Short text`
- `202 TEXT-SELECT (text as SelectBox)` -> `Short text` or `Single select`, depending on whether the real runtime behavior is free text or constrained selection
- `204 READONLY-TEXT` -> deferred advanced review candidate, likely readonly presentation over another field type
- `205 READONLY-NUMERIC` -> deferred advanced review candidate, likely readonly presentation over another field type
- `2030 COMBOBOX (custom selections)` -> `Single select`
- `2031 COMBOBOX (Yes/No)` -> `Radio group` preset with default `Yes/No` options and optional button-style rendering
- `2032 COMBOBOX Related` -> `DB lookup`
- `201 MEMO (big text)` -> `Long text`, or `Signature` preset when the runtime uses the title-based signature behavior
- `2011 MEMO (with Updates)` -> `Long text` with `historicalUpdates`
- `2012 EDITOR (Rich Text Editor)` -> `Rich text`
- `135 DATE (date type)` -> `Date`
- `136 DATE TODAY (READONLY with current date)` -> `Date` preset with `defaultNow` and readonly
- `3 NUMERIC` -> `Integer`
- `131 FLOAT` -> `Decimal`
- `6 MONEY` -> `Currency`
- `60 SURVEY Element` -> deferred advanced review candidate
- `70 TITLE (text w/o field)` -> `Heading`
- `72 HTML (any text)` -> `Text block` or `Rich text block`
- `80 TABS (Groups for fields)` -> `Tabs`
- `90 SUBFORM (Form 2d level)` -> `Subform`
- `30 DB LOOKUP (ext. Form)` -> `DB lookup`
- `31 DB FIELD (Project)` -> `Project` lookup template
- `32 DB FIELD (Contact)` -> `Contact` lookup template
- `33 DB FIELD (Company)` -> `Company` lookup template
- `71 SQL Field` -> deferred advanced review candidate

## Runtime Overlay Notes From Smartapp

The current smartapp runtime adds several important overlays on top of the legacy ids:

- `view`
  - readonly display alias driven by page access, not a real field type
- `hidden`
  - hidden access alias driven by page access, not a real field type
- `form_type = SOR`
  - overrides the normal subform behavior into a specialized SOR report widget
- `form_type = CHECKLIST`
  - should normalize to `Subform.subformType = CHECKLIST`
  - checklist mode renders a checklist widget with nested answers, notes, and files
- `form_type = CA`
  - special corrective-action behavior attached at the view level, not part of checklist field composition
- `301` and `302`
  - readonly lookup-summary cards; these are better treated as display presets for lookup outputs than as separate model field types
- `20301`
  - static single-select variant with explicit `id:label` options

V2 should model these as runtime presets or view-layer widgets, not as new model primitives.

## Source Conflicts That V2 Must Resolve Explicitly

The source review exposed a few mismatches that should be resolved intentionally instead of copied forward:

- `202`
  - legacy EXTDB treats this as a select-style field
  - current smartapp renders it as a text input
  - V2 should classify it by actual desired source behavior, not by legacy id alone
- `2031`
  - legacy naming suggests yes/no
  - current smartapp runtime supports arbitrary pipe-delimited option variants
  - V2 should not hardcode this to boolean or to exactly two options
  - treat it as a `Radio group` preset over `Single select`, with editable options and optional button-style rendering
- `204`, `205`, `71`, `view`, `301`, `302`
  - current runtime shows these as a small readonly-display family
  - V2 should collapse them into fewer readonly presets where backend semantics do not require separate primitives
- `80`
  - this is a control token consumed by tab grouping, not a standalone rendered widget

## Shared Parameters For Most Fields

Most data-backed fields should support a common baseline parameter set.

Recommended common parameters:

- `label`
- `description`
- `helperText`
- `placeholder`
- `autocomplete`
- `inputMode`
- `displayFormat`
- `required`
- `readonly`
- `hidden`
- `defaultValue`
- `width`
- `columnSpan`
- `visibilityRules`
- `validationRules`
- `bindingKey`
- `sortOrder`

Not every parameter needs to be visible in the basic UX at first.

## Layout Element Parameters

### Section

- `title`
- `description`
- `collapsible`
- `defaultExpanded`
- `visibilityRules`

Runtime note:

- `Section` should map naturally to a `Card`-style surface from the UI kit
- `Section` is allowed only at the root of the current form scope
- accepted form scopes are:
  - the root scope of the main form
  - the root scope of one subform
- if a scope has no explicit `Section`, the whole scope should render inside one default card surface

### Group

- `title`
- `description`
- `styleVariant`
- `visibilityRules`

### Tabs

- `title`
- `styleVariant`
- `defaultTab`
- `visibilityRules`

### Tab

- `title`
- `description`
- `visibilityRules`

### Subform

- `title`
- `description`
- `subformType`
  - `DEFAULT`
  - `CHECKLIST`
- `targetModel`
- `allowAdd`
- `allowEdit`
- `allowDelete`
- `allowReorder`
- `defaultExpanded`
- checklist-only settings:
  - `lookupFieldId`
    - must reference a child `DB lookup` field
  - `resultFieldId`
    - must reference a child `Single select` field
    - recommended authoring path is `Radio group` over `Single select`
    - checklist runtime may render it as button-style radio choices

Storage note:

- each managed `Subform` creates its own child table in the database
- the backend should treat it as a parent-child collection boundary
- each managed `Subform` also owns its own schema scope with dedicated `dataSchema` and `uiSchema`

Runtime note for `DEFAULT` subform:

- a non-checklist subform should render as a child table inside the main form
- row actions are controlled by `allowAdd`, `allowEdit`, and `allowDelete`
- when the user clicks `Add` or `Edit`, the app should navigate to a dedicated child page
- that child page should render the same subform schema as a first-level form

### Checklist subform

This is not a second layout node.
It is a palette shortcut over `Subform`.

Compile rule:

- `LayoutNode.type = subform`
- `subformType = CHECKLIST`

Required checklist bindings:

- `lookupFieldId`
  - must reference a child `DB lookup` field
- `resultFieldId`
  - must reference a child `Single select` field
  - recommended authoring path is `Radio group`
  - runtime may render the choices as button-style radio options

Storage note:

- checklist subforms follow the same child-table rule as normal subforms

### Grid layout

- `columns`
- `gap`
- `responsiveBehavior`

### Column

- `span`
- `minWidth`
- `align`

### Divider

- `styleVariant`
- `spacingBefore`
- `spacingAfter`

### Spacer

- `size`
- `responsiveSize`

## Content Element Parameters

### Heading

- `text`
- `level`
- `alignment`
- `styleVariant`
- `visibilityRules`

### Text block

- `text`
- `alignment`
- `styleVariant`
- `visibilityRules`

### Rich text block

- `content`
- `editorMode`
- `alignment`
- `styleVariant`
- `visibilityRules`

## Basic Field Parameters

### Short text

Use for plain input fields.

Parameters:

- `placeholder`
- `minLength`
- `maxLength`
- `format`
  - `plain`
  - `email`
  - `phone`
  - `url`
- `mask`
- `autocomplete`
- `inputMode`

### Long text

Use for large editable text areas.

Parameters:

- `placeholder`
- `minLength`
- `maxLength`
- `rows`
- `historicalUpdates`
  - when enabled, the field acts like legacy `Memo with Updates`
  - values should be appended as a history stream instead of behaving like a plain overwritten textarea
- `allowManualEditOfHistory`
  - likely `false` by default

### Rich text

Parameters:

- `toolbarPreset`
- `sanitizeMode`
- `allowImages`
- `allowLinks`
- `maxLength`

### Integer

Parameters:

- `min`
- `max`
- `step`
- `displayFormat`

### Decimal

Parameters:

- `min`
- `max`
- `step`
- `precision`
- `displayFormat`

### Currency

Parameters:

- `min`
- `max`
- `precision`
- `currencyCode`
- `currencyDisplay`
- `locale`

### Boolean

Parameters:

- `widget`
  - `checkbox`
  - `toggle`
- `trueLabel`
- `falseLabel`

Binary labeled choice renderers should be modeled through the `Radio group` ready-made preset over `Single select`, not as a separate boolean widget family.

### Date

Parameters:

- `defaultNow`
- `readonlyWhenDefaulted`
- `minDate`
- `maxDate`
- `displayFormat`

### Date & time

Parameters:

- `defaultNow`
- `readonlyWhenDefaulted`
- `minDateTime`
- `maxDateTime`
- `displayFormat`
- `timezoneMode`

### Signature

Parameters:

- `strokeColor`
- `strokeWidth`
- `backgroundStyle`
- `captureName`
- `captureSignedAt`
- `storageMode`

### Geo point

Parameters:

- `captureMode`
  - `manual`
  - `device`
  - `map_picker`
- `storeLatitude`
- `storeLongitude`
- `storeAccuracy`
- `storeAddressLabel`
- `defaultFromDevice`

### Attachment

Parameters:

- `allowedMimeTypes`
- `maxFiles`
- `maxFileSizeMb`
- `storageBucket`
- `allowPreview`
- `allowDownload`

## Choice, Lookup, and Relation Parameters

### Single select

Use for one selected option.

Parameters:

- `sourceType`
  - `static_options`
  - `dynamic_source`
- `options`
- `allowEmpty`
- `allowCustomValues`
- `controlType`
  - `select`
  - `radio`
- `renderStyle`
  - `native`
  - `buttons`
  - `chips`
- `orientation`
  - `vertical`
  - `horizontal`
- `optionStyles`
  - per-option button color configuration when `controlType = radio` and `renderStyle = buttons`
- `displayLabelField`
- `storedValueField`
- `sortMode`

Single select should support inline static options for the common case.

`Radio group` should be a preset over `Single select`.
Legacy `COMBOBOX (Yes/No)` should normalize to `Radio group` with default `Yes/No` options.
Those default options remain editable and the option count may grow beyond two.

### Multi select

Use for multiple chosen values.

Parameters:

- `sourceType`
  - `static_options`
  - `dynamic_source`
  - `tags`
- `options`
- `allowCustomValues`
- `minSelections`
- `maxSelections`
- `controlType`
  - `multi_select`
  - `checkbox`
- `renderStyle`
  - `native`
  - `buttons`
  - `chips`
- `orientation`
  - `vertical`
  - `horizontal`
- `optionStyles`
  - per-option button color configuration when `controlType = checkbox` and `renderStyle = buttons`
- `displayLabelField`
- `storedValueField`
- `sortMode`

`Checkbox group` should be a preset over `Multi select`.
`required = true` may be treated as a shortcut for `minSelections = 1` in checkbox-style flows.

#### Multi select open design questions

This field still needs explicit backend design.

The remaining product questions are:

- whether the field allows creation of new values or only selection from existing values
- how runtime controls should differ between static options and lookup-backed multiple selection

#### Recommended current position

- use one multivalue bridge-table family per scope
- reuse the same storage family for static options, tags, and future lookup-multiple entries
- treat storage as locked by `form-builder-multivalue-storage-contract.md`

#### Tags

`Tags` should be treated as a special multi-select preset, not as a separate base primitive.

Recommended tags behavior:

- `sourceType = tags`
- tokenized entry UX
- configurable:
  - `allowCreateNewTags`
  - `allowSelectExistingTags`
  - `maxTags`
- backend storage follows the shared multivalue bridge-table contract

### DB lookup

Use when a field references another model and specific fields are chosen for display.

Parameters:

- `sourceModel`
- `storedValueField`
- `displayFields`
- `displayTemplate`
- `searchFields`
- `sourceFilter`
- `dependentFilters`
- `allowEmpty`
- `displayMode`
  - `search_select`
  - `catalog_modal`
- `groupByField`
- `itemLabelFields`
- `sortMode`
- compile metadata:
  - `selectionMode = single`

This field must explicitly support scenarios such as:

- show all users
- but filter the source list by `company_id = current company`
- display `first_name + last_name`
- store only the target record id

Current working runtime rule:

- for new authored fields, the builder should require explicit `displayMode`
- `search_select` means searchable ajax select behavior backed by dictionary requests to the backend
- `catalog_modal` means grouped modal dictionary behavior
- legacy import may infer the display mode when older lookup params do not store it explicitly
- V2 should store grouping and item-label intent explicitly instead of relying only on legacy field order

Checklist composition note:

- a `Subform` in checklist mode may reuse a child `DB lookup` field as the source dictionary field
- the checklist `Result Field` should normalize to child `Single select` data, not a legacy standalone `COMBOBOX` type
- that checklist behavior is not a second `DB lookup` field type; it is a composition pattern between `Subform`, `DB lookup`, and sibling result fields

### Contact / Contacts / Company / Companies / Project / Projects

These should be first-class create options in the UI.

They are lookup templates with presets such as:

- target model
- default display fields
- default display template
- default search fields
- default display mode
- optional default filters
- backend ajax dictionary source

They must still support custom filter rules.

Authoring rule:

- single and multiple lookup presets must be separate create options
- the builder should not ask the user to toggle storage shape after creation

Examples:

- `Contact`
  - source model: shared contact and user source
  - default display template: `users_firstname + ' ' + users_lastname`
  - default search fields: `users_firstname`, `users_lastname`
  - default display mode: `search_select`
  - compile metadata: `selectionMode = single`
- `Contacts`
  - same preset defaults as `Contact`
  - compile metadata: `selectionMode = multiple`
- `Company`
  - source model: companies
  - default display template: `company_name`
  - default search fields: `company_name`
  - default display mode: `search_select`
  - compile metadata: `selectionMode = single`
- `Companies`
  - same preset defaults as `Company`
  - compile metadata: `selectionMode = multiple`
- `Project`
  - source model: projects
  - default display template: `projects_num + ', ' + projects_name`
  - common alternative display template: `projects_name`
  - default search fields: `projects_num`, `projects_name`
  - default display mode: `search_select`
  - compile metadata: `selectionMode = single`
- `Projects`
  - same preset defaults as `Project`
  - compile metadata: `selectionMode = multiple`

## Advanced or Specialized Review Backlog Notes

These notes are intentionally non-canonical until individual advanced fields are accepted.

### Computed field

Parameters:

- `resultType`
- `expressionMode`
- `expression`
- `readonly`
- `recomputeTrigger`

### Readonly text

Parameters:

- `valueSource`
- `format`
- `fallbackValue`

### Readonly numeric

Parameters:

- `valueSource`
- `precision`
- `format`
- `fallbackValue`

### Survey element

Parameters:

- `questionType`
- `options`
- `scoringRules`

### SQL field

Parameters:

- `queryReference`
- `resultType`
- `readonly`

This should remain a deferred advanced capability until a dedicated contract is approved.

## System Field Parameters

### Reported By

Parameters:

- `defaultLabel`
- `defaultFieldPreset`
  - `contact_lookup`
- `required`

This inserts a normal lookup-backed field and binds it to the view semantic role `reportedBy`.

### Reported Date

Parameters:

- `defaultLabel`
- `required`
- `defaultNow`

This inserts a normal date field and binds it to the view semantic role `reportedDate`.

### Status

Parameters:

- `statusVariantMode`
  - `template`
  - `custom`
- `statusTemplateKey`
- `options`
- `initialValue`
- `finalValue`
- `displayAs`
  - `select`
  - `radio_chips`
  - `badge`
- `colorMapping`

This inserts a `Single select` field with a `status` preset and binds it to the view workflow role.
The field may start from a status template or from a custom option set, different forms may use different status variant sets, and template-provided options remain editable.

## What Should Happen Next

Before implementation expands, V2 should do the following:

1. approve this catalog
2. approve the V2 field contract with the `System Fields` layer
3. lock the migration rules for legacy ids with overloaded runtime behavior such as `202`, `2031`, `201`, and `90`
4. create a builder palette taxonomy from it
5. define icon mapping for every visible item
6. define which items are in slice 1 versus later
7. implement the right-panel inspector from `form-builder-slice-1-inspector-and-view-schema.md`
8. keep page settings and filters in a separate view-settings document rather than pushing them back into the field palette

This sequence should happen before a broad rebuild of the right-side inspector.
