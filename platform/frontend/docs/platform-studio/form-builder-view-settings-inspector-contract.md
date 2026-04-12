# Form Builder View Settings Inspector Contract

Status: active
Date: 2026-04-08

## Purpose

This document locks the current working inspector contract for root-level `View settings` UI in Platform Studio Form Builder V2.

It exists to define:

- exact inspector sections
- exact editor fields
- modal flows
- compact list behavior

It does not define implementation details.

This document is the UI companion to:

- `form-builder-view-settings-contract.md`
- `form-builder-grid-columns-contract.md`
- `form-builder-v2-field-contract.md`
- `form-builder-page-and-filter-notes.md`
- `form-builder-slice-1-inspector-and-view-schema.md`

## Scope

This contract applies only to the root view inspector.

It does not apply to:

- model field inspectors
- dedicated `Grid` tab behavior
- subform inspectors
- checklist child fields
- System Fields cards

## Inspector Placement

The right-side `View` tab should contain these sections in this order:

1. `Summary`
2. `Workflow`
3. `Actions`
4. `List`

The dedicated top-level `Grid` tab is locked separately in:

- `form-builder-grid-columns-contract.md`

## Section Contract

### `Summary`

Fields:

- `displayName`
  - read-only in the first accepted inspector contract
- `description`
  - editable multiline text
- `viewType`
  - read-only

This section stays minimal.
It should not be overloaded with list or workflow settings.

### `Workflow`

Fields:

- `Icon`
  - editor type: image data input
  - accepted value: `iconDataUrl`
  - accepted source: base64 data image
  - actions:
    - `Upload`
    - `Paste Data URL`
    - `Clear`
  - compact preview:
    - small icon preview tile when value exists

- `Corrective Action`
  - editor type: toggle
  - saved field: `viewSettings.correctiveAction.enabled`
  - when enabled, show read-only source summary:
    - `Platform static`
    - `corrective_action`

Rules:

- `Corrective Action` is root-level only
- no per-checklist or per-subform CA controls appear here
- no `CA page` dropdown should return in V2

### `Actions`

Fields:

- `Add`
  - toggle
  - saves to `viewSettings.actions.canAdd`
- `View`
  - toggle
  - saves to `viewSettings.actions.canView`
- `Edit`
  - toggle
  - saves to `viewSettings.actions.canEdit`
- `Delete`
  - toggle
  - saves to `viewSettings.actions.canDelete`

UI rule:

- these four toggles should render as one compact action grid or inline toggle row group
- avoid separate oversized cards per action

### `List`

This section contains three compact blocks:

1. `Sorting`
2. `Page Filters`
3. `Quick Filters`

#### `Sorting`

Fields:

- `Sort field`
  - select from eligible root model fields
- `Direction`
  - select:
    - `ASC`
    - `DESC`

Rules:

- only one primary sort is locked in the first contract
- the UI should render sorting in one short row

#### `Page Filters`

This block must be compact.

Top controls:

- `Field` select
- `Add Filter` button

Current filters list:

- each filter renders as one compact row
- each row shows:
  - field title
  - compact human-readable summary
  - `Edit`
  - `Delete`

No giant inline editor is allowed in the main inspector.

#### `Quick Filters`

This block must also be compact.

Top controls:

- `Add Quick Filter` button

Current quick filters list:

- each quick filter renders as one compact row or chip-row
- each row shows:
  - label
  - value summary
  - optional color swatch
  - `Edit`
  - `Delete`

No textarea editor is allowed for quick filters.

## Modal Flows

### Add Page Filter

Flow:

1. user picks a field in `Field`
2. user clicks `Add Filter`
3. builder resolves the filter family from the selected field
4. builder opens the matching modal
5. saving the modal creates one typed `pageFilters` item

### Edit Page Filter

Flow:

1. user clicks `Edit` on an existing row
2. builder opens the matching modal with current values
3. saving replaces the existing filter payload

### String Filter Modal

Fields:

- read-only field title
- operator select
- value input

Rules:

- `IN list` should use tokenized text entry for multiple values
- `IS EMPTY` and `NOT EMPTY` should hide the value input

### Number Filter Modal

Fields:

- read-only field title
- operator select
- numeric value input

### Date Filter Modal

Fields:

- read-only field title
- mode select:
  - `Static`
  - preset list
- when mode is `Static`:
  - `Date From`
  - `Date To`

### Lookup Filter Modal

Fields:

- read-only field title
- source-specific clause rows

Rule:

- do not force lookup filters into one generic operator/value UI
- render compact source-specific controls based on the lookup preset

Initial locked lookup modal families:

- `contact_lookup`
- `company_lookup`
- `project_lookup`

### Add Quick Filter

Flow:

1. user clicks `Add Quick Filter`
2. builder opens a compact modal
3. user chooses:
  - source field
  - filter value
  - label
  - optional color
4. saving creates one `quickFilters` item

### Edit Quick Filter

Flow:

1. user clicks `Edit` on an existing quick-filter row
2. builder opens the same modal prefilled
3. saving updates the existing item

## Compact Row Rendering Rules

### Page Filter Row

Each row should render:

- left:
  - field title
- center:
  - human-readable summary such as:
    - `Status = Draft`
    - `Date: Current Week`
    - `Reported By: Active Account`
- right:
  - `Edit`
  - `Delete`

### Quick Filter Row

Each row should render:

- left:
  - label
- center:
  - concise filter summary
- right:
  - optional color swatch
  - `Edit`
  - `Delete`

## Validation Rules

- `Sorting.fieldId` must reference an eligible root field
- page filters must reference eligible root fields only
- quick filters must reference eligible root fields only
- lookup filter clauses must stay within the locked preset vocabulary
- `Delete` actions must remove the whole saved item, not only clear visible text

## Explicit Rejections

Do not use:

- huge embedded filter forms directly in the inspector body
- freeform SQL textareas
- textarea-based quick-filter authoring
- mixed System Fields and List settings in the same card
- checklist-specific controls inside the root `View settings` inspector

## Current Locked Position

- the final root `View` inspector should have `Summary`, `Workflow`, `Actions`, and `List`
- `Page Filters` and `Quick Filters` must use compact list rows plus modal editors
- lookup filters stay source-specific
- sorting stays a one-row field-plus-direction editor
- this document defines the target inspector UX without forcing implementation details yet
