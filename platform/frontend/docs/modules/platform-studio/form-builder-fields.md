# Form Builder Fields And View Settings

Status: active supporting contract
Owner: frontend
Last audited: 2026-04-25
Canonical scope: Form Builder field catalog, palette registry, conditional rules, grid settings, view settings, and scope boundaries

This supporting contract keeps Form Builder field/catalog details out of the main Form Builder module contract.

Read with:

- `platform/frontend/docs/contracts/platform-studio.md`
- `platform/frontend/docs/modules/platform-studio/README.md`
- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/backend/docs/contracts/platform-studio-form-builder.md` only when the field detail affects backend validation/storage/runtime apply

Read it only after:

1. `platform/frontend/docs/contracts/platform-studio.md`
2. `platform/frontend/docs/modules/platform-studio/README.md`
3. `platform/frontend/docs/modules/platform-studio/form-builder.md`

It intentionally does not define backend API, storage, SQL view generation, migration policy, or runtime apply behavior.
Backend-owned facts live in `platform/backend/docs/contracts/platform-studio-form-builder.md`.

## Compatibility And Exact-Detail Inputs

This document replaces the default read role of these detailed frontend docs.
They are exact-detail references, not default read-order docs:

Field registry and catalog:

- `platform/frontend/docs/platform-studio/form-builder-accepted-registry.md`
- `platform/frontend/docs/platform-studio/form-builder-v2-field-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-field-catalog.md`

Field and preset details:

- `platform/frontend/docs/platform-studio/form-builder-core-data-fields.md`
- `platform/frontend/docs/platform-studio/form-builder-choice-fields.md`
- `platform/frontend/docs/platform-studio/form-builder-choice-preset-inspector-schema.md`
- `platform/frontend/docs/platform-studio/form-builder-ready-made-fields.md`
- `platform/frontend/docs/platform-studio/form-builder-suggest-text-field-contract-v1.md`
- `platform/frontend/docs/platform-studio/form-builder-relationships.md`
- `platform/frontend/docs/platform-studio/form-builder-advanced-fields.md`
- `platform/frontend/docs/platform-studio/form-builder-content-nodes.md`
- `platform/frontend/docs/platform-studio/form-builder-system-fields.md`

Scope, layout, rules, and view details:

- `platform/frontend/docs/platform-studio/form-builder-section-tree.md`
- `platform/frontend/docs/platform-studio/form-builder-schema-scope-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-subform-checklist-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-field-rules-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-grid-columns-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-view-settings-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-view-settings-inspector-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-slice-1-inspector-and-view-schema.md`

Storage and static/external model details:

- `platform/frontend/docs/platform-studio/data-schema-storage-rules.md`
- `platform/frontend/docs/platform-studio/form-builder-static-lookup-naming-policy-v1.md`
- `platform/frontend/docs/platform-studio/form-builder-static-models-integration-v1.md`

Open those old docs only for exact historical detail or payload audit.
For retention and deletion conditions, read:

- `ai-memory/docs/frontend/platform-studio/form-builder-exact-detail-consolidation-audit.md`

## Current Code Surfaces

Tenant app implementation surfaces:

- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/forms-builder-contract.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/forms-builder-library.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/forms-builder-state.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/forms-builder-migrations.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/pages/forms-ui-schema-workspace-page.tsx`

Shared non-UI contract surfaces:

- `platform/frontend/packages/platform-studio-core/src/contracts/model.ts`
- `platform/frontend/packages/platform-studio-core/src/contracts/view.ts`
- `platform/frontend/packages/platform-studio-core/src/schemas/model.schema.ts`
- `platform/frontend/packages/platform-studio-core/src/schemas/view.schema.ts`

Implementation note:

- tenant-web code currently contains richer authoring state than the exported published metadata contracts in `platform-studio-core`
- verify code before assuming every accepted authoring detail is already exported as a stable shared package contract

## Core Principles

Form Builder must keep these layers separate:

- base field types
- field presets
- semantic/system bindings
- runtime presets
- conditional UI rules
- grid-column definitions
- layout nodes
- content nodes
- page/view settings
- filter definitions

The builder palette is a user-facing projection over those registries.
Not every palette item is a backend field type or storage primitive.

Do not infer business semantics from:

- display labels
- mutable titles
- legacy numeric field ids
- string markers such as title prefixes
- old page-setting dropdown names

## Palette Sections

The accepted palette section order is:

1. `Basic fields`
2. `Choice fields`
3. `Relationships`
4. `System Fields`
5. `Ready-made fields`
6. `Advanced fields`
7. `Layout`
8. `Content`

Section meaning:

- `Basic fields` are model-backed primitives.
- `Choice fields` are option-backed value fields.
- `Relationships` contains lookup primitives and lookup presets.
- `System Fields` are semantic view bindings that may create or bind compatible fields.
- `Ready-made fields` are authoring shortcuts over base field types.
- `Advanced fields` is a reserved section; its child items are not accepted for implementation by default.
- `Layout` creates structural view nodes, not model fields.
- `Content` creates static or readonly display nodes, not model fields.

## Base Field Types

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

Rules:

- every authored data field must have one base type
- base type defines value shape, validation family, and storage intent
- base type must not encode widget choice, readonly display, page workflow semantics, or legacy field ids

## Field Presets

Ready-made presets:

- `email`
- `phone`
- `url`
- `suggest_text`
- `date_today`
- `tags`
- `radio_group`
- `checkbox_group`

Relationship presets:

- `db_lookup_value`
- `contact_lookup`
- `company_lookup`
- `project_lookup`

Preset rules:

- presets improve authoring UX, but they are not new backend primitives
- `Email`, `Phone`, and `URL` compile to `short_text` with validation/input defaults
- `Tags` compiles to `multi_select`
- `Date today` compiles to `date` with current-date default behavior
- `Radio group` compiles to `single_select`
- `Checkbox group` compiles to `multi_select`
- `Contact`, `Company`, and `Project` compile to `db_lookup` with target/source preset metadata
- single and multiple relationship palette entries remain separate user-facing shortcuts even when they share the same preset family

## System Fields

Accepted System Fields:

- `Reported By`
- `Reported Date`
- `Status`

System Field rules:

- System Fields are root-level form semantics only
- they must not be authored inside subform scopes or nested layout scopes
- each semantic role may bind only one field per view
- one field must not be reused across multiple System Field roles in the same view
- semantic bindings live in `systemFields`, not in labels

Semantic bindings:

- `reportedBy.fieldId`
- `reportedDate.fieldId`
- `workflowStatus.fieldId`
- `workflowStatus.initialValue`
- `workflowStatus.finalValue`

Default field mapping:

- `Reported By` creates or binds a compatible `db_lookup` / `contact_lookup` field.
- `Reported Date` creates or binds a compatible `date` or `date_time` field.
- `Status` creates or binds a `single_select` field with explicit workflow options.

Status rules:

- workflow status is not a boolean checkbox
- workflow status is not generic non-workflow status labeling
- `initialValue` and `finalValue` must exist in the bound option set when present
- different forms may use different status option variants
- template-created status variants remain editable after creation

## Layout Nodes

Current layout node set:

- `section`
- `group`
- `tabs`
- `tab_item`
- `accordion`
- `accordion_item`
- `grid`
- `column`
- `subform`
- `divider`
- `spacer`

Compatibility note:

- older field registry docs may omit `accordion` and `accordion_item`
- the active main Form Builder contract and tenant-web code include them in the layout/container set

Layout rules:

- layout nodes are not model fields
- `Section` is allowed only at the root of the current form scope
- `Grid layout` and `Column` are layout composition nodes, not list/grid column settings
- `Subform` owns a dedicated child scope
- `Checklist subform` is a palette shortcut that compiles to `subform` with `subformType = CHECKLIST`

## Content Nodes

Accepted content nodes:

- `Heading`
- `Text block`
- `Rich text block`
- `View-only field`

Rules:

- content nodes are not model-backed editable fields
- `Rich text` is stored model data
- `Rich text block` is static authored content in a view
- `View-only field` is a readonly display node for approved bindings such as lookup-derived outputs or root record id
- `Divider` remains a layout node, not a content node

## Scope Model

Form Builder uses one root scope plus zero or more subform scopes.

Root scope owns:

- root model fields
- root `uiSchema`
- root `systemFields`
- root `viewSettings`
- root `filterDefinitions`
- root list behavior

Subform scope owns:

- child model fields
- child `uiSchema`
- child table/list behavior for `DEFAULT` subforms
- child lookup/result bindings for `CHECKLIST` subforms

Scope rules:

- root and subform schemas must not be flattened into one schema
- each subform owns a dedicated `dataSchema` and `uiSchema`
- `Section` may be added only at the root of the main form scope or one subform scope
- if a scope has no explicit section, runtime should render the scope inside one default card-like surface

## Subforms

Accepted subform modes:

- `DEFAULT`
- `CHECKLIST`

`DEFAULT` subform rules:

- renders in the parent form as a child table
- child `Add` and `Edit` use the subform scope as a first-level child form page
- may own child-table grid columns and child-table actions

`CHECKLIST` subform rules:

- compiles to the same canonical `subform` node
- uses `subformType = CHECKLIST`
- still owns a dedicated child scope and child table
- `lookupFieldId` must reference a child `db_lookup` field in the same subform
- `resultFieldId` must reference a child `single_select` field in the same subform
- recommended authoring path for result choices is `Radio group`
- does not own `Corrective Action`
- does not use grid-column configuration

## Conditional Rules

Simple conditional UI rules belong in Form Builder.

Accepted rule families:

- `Visibility rules`
- `Requirement rules`

Placement:

- rules belong on the current `uiSchema` node
- field nodes may expose visibility and requirement rules
- container nodes may expose visibility rules only

Scope rules:

- root fields may depend only on root fields
- subform fields may depend only on fields in the same subform row
- cross-scope dependencies are not accepted

First-contract limits:

- conditions compare same-scope fields to literal values
- field-to-field comparison is not accepted
- nested `or` groups are not accepted
- larger side effects, notifications, and post-submit behavior belong to Action Builder

## Grid Columns

Grid-column configuration is a view-layer concern.

It is not:

- a base field property
- a field preset
- a layout-grid container

Current persisted direction:

- `viewSettings.list.columns[]`
- each column has `fieldId`, `visible`, and `order`

Scope rules:

- root scope may configure root grid columns
- `DEFAULT` subform scope may configure child-table grid columns
- `CHECKLIST` subforms do not use grid columns
- grid-column field references must stay inside the current scope

UI placement:

- dedicated top-level `Grid` tab
- first version supports visibility and ordering
- width, alignment, renderer override, and label override are deferred

## View Settings

Root view settings own:

- `iconDataUrl`
- `correctiveAction`
- root actions: `canAdd`, `canView`, `canEdit`, `canDelete`
- root list sorting
- root list columns
- root page filters
- root quick filters

Subform view settings may own child-table concerns for `DEFAULT` subforms:

- child `canAdd`
- child `canEdit`
- child `canDelete`
- child list sorting
- child list columns

Root-only concerns:

- System Fields
- Icon
- Corrective Action
- root page filters
- root quick filters
- root workflow status initial/final values

Corrective Action rule:

- `Corrective Action` is a root view toggle over a platform-owned static model
- it is not checklist behavior
- it is not a field type

## Filters

Accepted root filter groups:

- `pageFilters`
- `quickFilters`

Accepted page filter editor families:

- string
- number
- date
- lookup

Rules:

- filters are structured view data
- raw SQL-like strings are not the authoring contract
- page filters should use compact summary rows plus field-specific modal editors
- quick filters should use compact editable rows/chips
- quick filter first contract is equality-based
- lookup filters may use preset-specific clauses and dynamic tokens

Do not model filters as:

- base field types
- page setting textareas
- Action Builder workflows

## Deferred Or Not Accepted

Deferred advanced child items:

- `Computed field`
- `Readonly text`
- `Readonly numeric`
- `Survey element`
- `SQL field`

Not accepted as current registry items:

- `Relation`
- `User` relationship preset
- `Status preset` as a generic field preset
- `Repeater`

Rules:

- `Advanced fields` may remain visible as a reserved section, but its children require explicit acceptance before implementation
- generic non-workflow status should use `single_select` or `radio_group`
- repeated child collections are represented by `Subform`, not `Repeater`

## Exact Detail Read Path

For exact payload shapes or historical review, open only the specific old detail doc needed.
Do not read the whole `platform/frontend/docs/platform-studio/**` tree:

- field catalog and registry: `form-builder-accepted-registry.md`, `form-builder-v2-field-contract.md`, `form-builder-field-catalog.md`
- specific field settings: `form-builder-core-data-fields.md`, `form-builder-choice-fields.md`, `form-builder-ready-made-fields.md`, `form-builder-suggest-text-field-contract-v1.md`, or `form-builder-relationships.md`
- System Fields: `form-builder-system-fields.md`
- rules: `form-builder-field-rules-contract.md`
- grid columns: `form-builder-grid-columns-contract.md`
- view settings and filters: `form-builder-view-settings-contract.md` or `form-builder-view-settings-inspector-contract.md`
- scope/subform: `form-builder-schema-scope-contract.md` and `form-builder-subform-checklist-contract.md`
- static/external models: `form-builder-static-lookup-naming-policy-v1.md` and `form-builder-static-models-integration-v1.md`
- storage rationale: `data-schema-storage-rules.md`, but prefer the backend Form Builder contract for current backend-owned storage truth
