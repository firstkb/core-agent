# Form Builder Page And Filter Notes

## Purpose

This document captures the legacy EzData Page and filter surfaces that inform Platform Studio V2.

It exists to keep page-level and filter-level metadata separate from the Form Builder field catalog.

## Source Roles

- `EXTDB`
  - source for legacy page settings, page field access, page filters, and prefilters
- `smartapp`
  - source for how some of those settings affect the current runtime
- `form-builder-field-catalog.md`
  - remains the canonical field primitive catalog

This document is supporting analysis.
It should not redefine the base field catalog.

The normalized root-view contract now lives in:

- `form-builder-view-settings-contract.md`

## EzData Page Settings Inventory

Observed in `platform/frontend/docs/platform-studio/EXTDB/Template/ExtDBpg_edit.htm` and related `default.asp` helpers.

### Core Page Settings

- `Page Title`
- `Page order`
- `Active`
- `Attachments`
- `Web Share`
- `PWA`
- `Module`

### Web Share Settings

- `Field By`
  - legacy source list is populated from contact/user-style field `32`
- `Field Date`
  - legacy source list is populated from date fields `135` and `136`
- `Field Status`
  - legacy source list is populated from `2030`
- `Field Status - Draft variant`
- `Field Status - Finish variant`
- `Icon`
- `CA page`

### Action Settings

Observed legacy toggles:

- `Enable Edit`
- `Enable Delete`
- `Enable AddNew`

Recommended V2 normalized toggles:

- `Enable Add`
- `Enable View`
- `Enable Edit`
- `Enable Delete`

### Grid Settings

- `Grid Sorting`
  - `order1`
  - `order2`
- `Grid PreFilters`
  - stored separately from the normal page filter list

### Per-page Field Overrides

These are page overlays, not model field definitions:

- `field_access`
  - `Default`
  - `View Only`
  - `Edit Field`
  - `Hidden`
- `field_ingrid`
  - `Show`
  - `Hide`

Current V2 note:

- `field_ingrid` should normalize into structured grid-column visibility under the dedicated `Grid` tab contract

### Additional Actions / View Links

Legacy `ExtDBview` stores:

- `title`
- `tpl`

These are page-level action or secondary-view definitions, not field types.

## Filter Inventory

## Field-level Filters

### Relation and Lookup Filters

- `30 DB LOOKUP`
  - stores target form and display fields in `ExtDBfld_param`
  - uses freeform SQL-like `ExtDBfld_filter`
- `31`, `32`, `33`
  - use lookup filter dialogs and tokenized filter storage

## Page Filter Builder

Legacy page filters are stored in `ExtDBpg_filter`.

Observed storage shape:

- `FieldTitle@@FieldName@@(SQL expression)||||`

Observed modal routing by field family:

- numeric
  - `3`
  - `6`
  - `131`
  - `205`
- string-ish
  - `200`
  - `201`
  - `202`
  - `204`
  - `2011`
  - `2030`
  - `2031`
- date
  - `135`
  - `136`
- relational
  - `30`
  - `31`
  - `32`
  - `33`

Observed operators:

- string
  - `=`
  - `NOT LIKE`
  - `LIKE`
  - `IN`
  - `EMPTY`
  - `NOT EMPTY`
- numeric
  - `=`
  - `>`
  - `<`
  - `<=`
  - `>=`
  - `<>`
- date
  - static range
  - current / last / next week
  - current / last / next month
  - current / last / next quarter
  - current / last / next year
  - last 12 months
  - greater / equal / less than today
  - next 3 / 5 / 7 days

## Grid PreFilters

Legacy prefilters are stored in `ExtDBpg_prefilter`.

Observed storage shape:

- `fieldName~filterValue~color~fieldTitle~filterTitle`

This behaves more like a saved filter-chip or named quick-filter system than a normal field definition.

## Legacy Tokens And Runtime Coupling

Observed token replacement in legacy filters includes:

- `userscompany`
- `userscompany_name`
- `usersdivision`
- `usersdivision_name`
- `projectsaccess`

This is one more reason filters should move into an explicit V2 structured schema instead of raw SQL-like strings.

## V2 Translation Rules

### Keep Out Of The Field Palette

Do not treat these as field primitives:

- page title and page ordering
- raw Web Share settings
- action toggles
- grid sorting
- page filter definitions
- prefilters
- view-link actions
- page field access overrides

If a legacy setting is field-backed, expose it as a `System Field` instead of keeping the raw page-setting dropdown.

### Move Into V2 View Settings

Recommended V2 homes:

- page identity and activation
  - `View settings`
- `Field By`, `Field Date`, `Field Status`
  - `System Fields` bindings
- `Field Status - Draft variant`, `Field Status - Finish variant`
  - `System Field` workflow config
- `Icon`
  - `view.viewSettings.iconDataUrl`
- `CA page`
  - normalize to `view.viewSettings.correctiveAction.enabled`
  - when enabled, corrective action should use a platform-owned static table rather than a per-view selected CA page
- action toggles
  - `view.viewSettings.actions`
  - `canAdd`, `canView`, `canEdit`, `canDelete`
- grid sorting
  - `view.viewSettings.list.sorting.fieldId`
  - `view.viewSettings.list.sorting.direction`
- `field_ingrid`
  - `view.viewSettings.list.columns[]`
  - exact behavior is locked in `form-builder-grid-columns-contract.md`
- `ExtDBpg_filter`
  - `view.filterDefinitions.pageFilters`
- `ExtDBpg_prefilter`
  - `view.filterDefinitions.quickFilters`
- sort and saved prefilters
  - compact `View list settings`
  - final UX should follow the compact modal-driven contract in `form-builder-view-settings-contract.md`
- per-page access and hidden/view-only behavior
  - `View field overrides`

### Replace String DSL With Structured Objects

Do not carry forward:

- raw SQL-like filter strings
- token replacement embedded in strings
- title-based or field-name-based interpretation when a structured flag is possible

Prefer:

- typed filter conditions
- explicit operators
- explicit dynamic tokens such as `currentUser.companyId`
- explicit saved-filter metadata
- compact summary rows plus modal editors instead of large inline builders or textareas

## Known Risks

- some legacy filter pickers expose field types that do not appear to have a clean modal implementation
- `Field Status` in the legacy page settings is narrower than the full family of status-like runtime widgets
- page-level `view` and `hidden` behavior currently leaks into runtime template selection
- current runtime still depends on brittle title markers for some behaviors
