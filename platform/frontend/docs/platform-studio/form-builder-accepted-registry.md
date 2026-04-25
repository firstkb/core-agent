# Form Builder Accepted Registry

Status: exact detail reference
Historical status: active
Date: 2026-04-08
Last audited: 2026-04-25
Read rule: Open only after the active Form Builder module docs, and only when exact payload/settings/history detail is needed.
Canonical active docs:

- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

## Purpose

This document is the final implementation gate for the currently accepted Platform Studio Form Builder V2 registry.

Use it to answer one question quickly:

- what is already approved for implementation

It intentionally excludes speculative branches except where they are explicitly marked as deferred.

## How To Use This Document

Read this document first before implementation work.

Then use the companion docs for the exact detail level:

- field-specific settings
- view payload shape
- filter payload shape
- scope boundaries
- checklist behavior

The old implementation backlog was deleted because it mixed landed, open, and speculative work.
For execution sequencing, use the active Form Builder module contract and the current owner-approved task plan.

## Accepted Palette Sections

The accepted palette sections are:

1. `Basic fields`
2. `Choice fields`
3. `Relationships`
4. `System Fields`
5. `Ready-made fields`
6. `Advanced fields`
7. `Layout`
8. `Content`

Accepted meaning:

- all eight sections are approved as library or palette sections
- not every item inside every section is approved
- `Advanced fields` is approved only as a reserved extension section

## Accepted Canonical Registries

### Field Types Registry

Accepted base field types:

- `short_text`
- `long_text`
- `rich_text`
- `integer`
- `decimal`
- `currency`
- `boolean`
- `date`
- `date_time`
- `signature`
- `geo_point`
- `attachment`
- `single_select`
- `multi_select`
- `db_lookup`

Accepted authoring shortcuts over base field types:

- `Long text historical` -> `long_text` plus `historicalUpdates = true`

### Field Presets Registry

Accepted ready-made presets:

- `email`
- `phone`
- `url`
- `suggest_text`
- `date_today`
- `tags`
- `radio_group`
- `checkbox_group`

Accepted relationship presets:

- `contact_lookup`
- `company_lookup`
- `project_lookup`

Accepted note:

- `Status preset` is not accepted
- generic non-workflow status cases should use `single_select` or `radio_group`

### Semantic/System Bindings Registry

Accepted system roles:

- `reportedBy`
- `reportedDate`
- `workflowStatus`

System Field rules:

- root-level only
- one semantic role per form view
- one field may not be reused across multiple system roles in the same view

### Layout Nodes Registry

Accepted layout nodes:

- `section`
- `group`
- `tabs`
- `tab_item`
- `grid`
- `column`
- `subform`
- `divider`
- `spacer`

Accepted layout shortcut:

- `Checklist subform`
  - compiles to `subform`
  - uses `subformType = CHECKLIST`

### Content Nodes Registry

Accepted content nodes:

- `content.heading`
- `content.text`
- `content.rich_text`

## Accepted Palette Projection

### `Basic fields`

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

### `Choice fields`

- `Single select`
- `Multi select`

### `Relationships`

- `DB lookup`
- `DB lookup value`
- `DB lookup multi`
- `Contact`
- `Contacts`
- `Company`
- `Companies`
- `Project`
- `Projects`

### `System Fields`

- `Reported By`
- `Reported Date`
- `Status`

### `Ready-made fields`

- `Email`
- `Phone`
- `URL`
- `Suggest text`
- `Tags`
- `Date today`
- `Radio group`
- `Checkbox group`

### `Advanced fields`

Accepted section only.
No child item is accepted yet.

### `Layout`

- `Section`
- `Group`
- `Tabs`
- `Tab item`
- `Grid layout`
- `Column`
- `Subform`
- `Checklist subform`
- `Divider`
- `Spacer`

### `Content`

- `Heading`
- `Text block`
- `Rich text block`

## Accepted Scope Model

The accepted builder document model is:

- one builder document
- one `rootScope`
- zero or more `subformScopes`

Accepted scope rules:

- each `subform` owns its own `dataSchema`
- each `subform` owns its own `uiSchema`
- each `subform` creates its own physical child table
- root-only concerns stay on the root scope
- child fields are not flattened into the root schema

### `Section` rule

`Section` is allowed only at the root of the current form scope.

Accepted form scopes:

- root of the main form
- root of one subform

If a scope has no explicit `Section`, the whole scope renders inside one default card surface.

## Accepted Subform Model

Accepted subform types:

- `DEFAULT`
- `CHECKLIST`

### `DEFAULT`

- renders inside the parent form as a child table
- `Add` and `Edit` use the subform scope as a first-level child form page
- may own child-table grid columns

### `CHECKLIST`

- still creates a child table
- still owns a dedicated subform scope
- `Lookup Field` must be a child `DB lookup`
- `Result Field` must be a child `Single select`
- recommended authoring path for the result field is `Radio group`
- may include optional sibling fields such as `Notes` and `Files`
- does not own `Corrective Action`
- does not use grid-column configuration

## Accepted Conditional Rules

Simple conditional UI rules are accepted in `Form Builder`.

Inspector placement:

- node inspector section: `Rules`

Accepted rule families:

- `Visibility rules`
- `Requirement rules`

Scope boundary:

- root fields may depend only on root fields
- subform fields may depend only on fields from the same subform row
- cross-scope conditions are not accepted

## Accepted Grid Model

Grid-column configuration is accepted as a dedicated view-level concern.

Accepted UI placement:

- top-level inspector tab: `Grid`

Accepted persisted path:

- `viewSettings.list.columns[]`

Accepted first-version column concerns:

- `fieldId`
- `visible`
- `order`

Scope rule:

- root scope may own root grid columns
- `DEFAULT` subform scope may own child-table grid columns
- `CHECKLIST` subform does not use grid columns

## Accepted Root View Settings

Accepted root view concerns:

- `iconDataUrl`
- `correctiveAction`
- `actions.canAdd`
- `actions.canView`
- `actions.canEdit`
- `actions.canDelete`
- `list.sorting`
- `list.columns`
- `pageFilters`
- `quickFilters`

Accepted root-only rule:

- `System Fields`
- `Icon`
- `Corrective Action`
- root actions
- root list sorting
- root page filters
- root quick filters

must not be authored inside a subform scope.

## Accepted Filter Model

Accepted root filter model:

- `pageFilters`
- `quickFilters`

Accepted filter families:

- string
- number
- date
- lookup

Accepted date presets and lookup dynamic tokens are locked separately in the root view settings contract.

## Explicitly Deferred Or Not Accepted

Deferred advanced backlog:

- `Computed field`
- `Readonly text`
- `Readonly numeric`
- `Survey element`
- `SQL field`

Not accepted as current registry items:

- `Relation`
- `User` relationship preset
- `Status preset`
- `Repeater`

## Companion Docs

- `form-builder-field-catalog.md`
- `form-builder-v2-field-contract.md`
- `form-builder-view-settings-contract.md`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`
