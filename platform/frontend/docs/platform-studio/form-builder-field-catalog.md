# Form Builder Field Catalog

## Purpose

This document defines the proposed final field and layout catalog for Platform Studio Form Builder.

It exists to prevent the old builder problem where one dropdown mixed together:

- data types
- UI widgets
- layout blocks
- content blocks
- readonly modes
- special legacy integrations

V2 should keep these concerns separate.

## Core Principle

The Form Builder palette should be organized into distinct categories:

- layout elements
- content elements
- core data field types
- relation and lookup field types
- advanced or specialized field types
- System Fields
- presets and variants

Not every visible choice in the UI should become a new backend field type.

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

### 1. Layout Elements

These are structural UI elements.
They are not model fields.

- `Section`
  - top-level layout block inside a view
- `Group`
  - groups related items into one visual unit
- `Tabs`
  - tabbed container
- `Tab`
  - one tab inside a `Tabs` container
- `Subform`
  - nested form based on a related model or repeated child structure
- `Repeater`
  - repeatable group of child items
- `Grid layout`
  - multi-column layout container
- `Column`
  - child column inside `Grid layout`
- `Divider`
  - visual separator
- `Spacer`
  - controlled vertical or horizontal spacing

### 2. Content Elements

These are non-data authoring elements.

- `Title / Heading`
  - static heading for sectioning or emphasis
- `Text block`
  - plain static copy
- `Rich text block`
  - formatted content block

### 3. Core Data Field Types

These are model-backed field types.

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

### 4. Choice, Lookup, and Relation Fields

These fields need explicit source, display, and filtering behavior.

- `Single select`
- `Multi select`
- `DB lookup`
- `Relation`
- `User`
- `Project`
- `Contact`
- `Company`

### 5. Advanced or Specialized Fields

These should exist in the catalog, but some may be implemented later.

- `Computed field`
- `Readonly text`
- `Readonly numeric`
- `Survey element`
- `SQL field`

### 6. System Fields

These are palette-level authored shortcuts for page semantics.
They are not new base field primitives.

- `Reported By`
- `Reported Date`
- `Status`

## What Should Be Presets Instead Of Separate Base Types

The following should not become separate core field types:

- `Yes / No`
  - use `Boolean` with a yes/no preset or widget
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
- `Status`
  - use `Single select` with a `status` preset for generic status data
  - use the `Status` System Field when the field also carries page workflow semantics
- `Project`
  - relation template with a preset target model
- `Contact`
  - relation template with a preset target model
- `Company`
  - relation template with a preset target model
- `User`
  - relation template with a preset target model

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
- `204 READONLY-TEXT` -> `Readonly text` preset
- `205 READONLY-NUMERIC` -> `Readonly numeric` preset
- `2030 COMBOBOX (custom selections)` -> `Single select`
- `2031 COMBOBOX (Yes/No)` -> `Boolean` preset only when the option set is truly yes/no; otherwise `Single select` with radio or chips
- `2032 COMBOBOX Related` -> `Relation` or `DB lookup`
- `201 MEMO (big text)` -> `Long text`, or `Signature` preset when the runtime uses the title-based signature behavior
- `2011 MEMO (with Updates)` -> `Long text` with `historicalUpdates`
- `2012 EDITOR (Rich Text Editor)` -> `Rich text`
- `135 DATE (date type)` -> `Date`
- `136 DATE TODAY (READONLY with current date)` -> `Date` preset with `defaultNow` and readonly
- `3 NUMERIC` -> `Integer`
- `131 FLOAT` -> `Decimal`
- `6 MONEY` -> `Currency`
- `60 SURVEY Element` -> `Survey element`
- `70 TITLE (text w/o field)` -> `Title / Heading`
- `72 HTML (any text)` -> `Text block` or `Rich text block`
- `80 TABS (Groups for fields)` -> `Tabs`
- `90 SUBFORM (Form 2d level)` -> `Subform`
- `30 DB LOOKUP (ext. Form)` -> `DB lookup`
- `31 DB FIELD (Project)` -> `Project` relation template
- `32 DB FIELD (Contact)` -> `Contact` relation template
- `33 DB FIELD (Company)` -> `Company` relation template
- `71 SQL Field` -> `SQL field`

## Runtime Overlay Notes From Smartapp

The current smartapp runtime adds several important overlays on top of the legacy ids:

- `view`
  - readonly display alias driven by page access, not a real field type
- `hidden`
  - hidden access alias driven by page access, not a real field type
- `form_type = SOR`
  - overrides the normal subform behavior into a specialized SOR report widget
- `form_type = CHECKLIST`
  - overrides the normal subform behavior into a checklist widget with nested answers, files, and optional corrective action flows
- `form_type = CA`
  - special corrective-action modal behavior, not a standalone primitive
- `301` and `302`
  - readonly relation-summary cards; these are better treated as display presets for relation outputs than as separate model field types
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
  - current smartapp runtime supports arbitrary pipe-delimited radio-chip options
  - V2 should not hardcode this to boolean unless the option set is actually boolean
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
- `targetModel`
- `cardinality`
- `allowAdd`
- `allowDelete`
- `allowReorder`
- `defaultExpanded`

### Repeater

- `title`
- `description`
- `minItems`
- `maxItems`
- `allowAdd`
- `allowDelete`
- `allowReorder`

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

### Title / Heading

- `text`
- `level`
- `align`

### Text block

- `text`
- `styleVariant`
- `align`

### Rich text block

- `content`
- `sanitizeMode`
- `styleVariant`

## Core Data Field Parameters

### Short text

Use for plain input fields.

Parameters:

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
  - `yes_no_select`
  - `yes_no_radio`
- `trueLabel`
- `falseLabel`

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
- `widget`
  - `select`
  - `radio`
  - `chips`
- `displayLabelField`
- `storedValueField`
- `sortMode`

Single select should support inline static options for the common case.

### Multi select

Use for multiple chosen values.

Parameters:

- `sourceType`
  - `static_options`
  - `dynamic_source`
  - `tags`
- `options`
- `allowCustomValues`
- `maxSelections`
- `widget`
  - `multi_select`
  - `chips`
  - `tag_input`
- `displayLabelField`
- `storedValueField`
- `sortMode`

#### Multi select open design questions

This field still needs explicit backend design.

The unresolved questions are:

- how values should be stored
- whether static multi-select values should be stored as arrays or normalized rows
- whether dynamic-source multi-select must always use a link table
- whether the field allows creation of new values or only selection from existing values
- how filtering and reporting should work across selected values

#### Recommended current position

- if the source is `dynamic_source`, prefer a normalized link table
- if the source is `static_options`, backend storage must still be explicitly designed before implementation
- do not treat storage as solved yet

#### Tags

`Tags` should be treated as a special multi-select preset, not as a separate base primitive.

Recommended tags behavior:

- `sourceType = tags`
- tokenized entry UX
- configurable:
  - `allowCreateNewTags`
  - `allowSelectExistingTags`
  - `maxTags`
- backend storage is still an open design question

### DB lookup

Use when a field references another model and specific fields are chosen for display.

Parameters:

- `targetModel`
- `lookupMode`
  - `single`
  - `search_dialog`
  - `autocomplete`
- `storedValueField`
- `displayFields`
- `searchFields`
- `sourceFilter`
- `dependentFilters`
- `allowEmpty`
- `sortMode`

This field must explicitly support scenarios such as:

- show all users
- but filter the source list by `company_id = current company`
- display `first_name + last_name`
- store only the target record id

### Relation

Base relation field.

Parameters:

- `targetModel`
- `relationCardinality`
- `storedValueField`
- `displayField`
- `sourceFilter`
- `dependentFilters`

### User / Project / Contact / Company

These should be first-class create options in the UI.

They are relation templates with presets such as:

- target model
- default display fields
- default search fields
- optional default filters

They must still support custom filter rules.

Example:

- `User`
  - target model: `users`
  - display fields: `full_name`
  - filter: `company_id = current company`

## Advanced or Specialized Parameters

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

This should remain an advanced capability.

## System Field Parameters

### Reported By

Parameters:

- `defaultLabel`
- `defaultFieldPreset`
  - `contact_relation`
- `required`

This inserts a normal relation field and binds it to the view semantic role `reportedBy`.

### Reported Date

Parameters:

- `defaultLabel`
- `required`
- `defaultNow`

This inserts a normal date field and binds it to the view semantic role `reportedDate`.

### Status

Parameters:

- `options`
- `initialValue`
- `finalValue`
- `displayAs`
  - `select`
  - `radio_chips`
  - `badge`
- `colorMapping`

This inserts a `Single select` field with a `status` preset and binds it to the view workflow role.

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
