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
- `platform/frontend/docs/platform-studio/form-builder-choice-preset-inspector-schema.md`
- `platform/frontend/docs/platform-studio/form-builder-relationships.md`
- `platform/frontend/docs/platform-studio/form-builder-system-fields.md`

Scope, layout, rules, and view details:

- `platform/frontend/docs/platform-studio/form-builder-section-tree.md`
- `platform/frontend/docs/platform-studio/form-builder-view-settings-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-view-settings-inspector-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-slice-1-inspector-and-view-schema.md`

Storage and static/external model details:

- `platform/frontend/docs/platform-studio/data-schema-storage-rules.md`
- `platform/frontend/docs/platform-studio/form-builder-static-lookup-naming-policy-v1.md`
- `platform/frontend/docs/platform-studio/form-builder-static-models-integration-v1.md`

Open those old docs only for exact historical detail or payload audit.
For retention and deletion conditions, read:

- `maestro/memory/docs/frontend/platform-studio/form-builder-exact-detail-consolidation-audit.md`

Low-risk exact-detail docs for advanced fields, content nodes, field rules, grid
columns, and checklist subforms were compacted into this document and deleted.
Use git history only for their exact old text.

Preset exact-detail docs for choice fields, ready-made fields, and `suggest_text`
were compacted into this document and deleted. Use git history only for their
exact old text.

The schema-scope exact-detail doc was compacted into this document and deleted.
Use git history only for its exact old text.

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

## Choice Fields

The `Choice fields` palette section contains:

- `single_select`
- `multi_select`

Choice fields are option-backed model fields.
They must support builder-side add/edit/delete/reorder option management.
They should move toward stable option identity instead of label-only storage.

Shared settings:

- `displayName`
- `key`
- `description`
- `isRequired`
- `isNullable`
- `defaultValue`
- `lockState`
- `sourceType`
- `options`
- optional `orientation`: `vertical | horizontal`
- future stable option identity: `optionKey`, `optionLabel`

When `sourceType = static_options`, the field settings UI must expose an inline
options editor.

Choice field matrix:

| Field | Value Shape | Source Types | Required Settings | Runtime Variants | Notes |
| --- | --- | --- | --- | --- | --- |
| `single_select` | one selected option value | `static_options`, `dynamic_source` | `options`, `allowEmpty`, `allowCustomValues` | dropdown select, radio group, chips/segmented single-choice, button group | Generic non-workflow status should use this or `radio_group`. Legacy `COMBOBOX (Yes/No)` normalizes to `radio_group` with editable `Yes`/`No` defaults. |
| `multi_select` | multiple selected option values | `static_options`, `dynamic_source`, `tags` | `options`, `allowCustomValues` | multi-select dropdown, checkbox list, chips picker, tag-style picker, button group | `Checkbox group` and `Tags` are presets over this field, not separate base field types. |

Recommended choice settings:

- `displayLabelField`
- `storedValueField`
- `sortMode`
- `controlType`
- `renderStyle`
- `orientation`
- `optionStyles`: semantic per-option button style variants

`single_select` control/render values:

- `controlType`: `select | radio`
- `renderStyle`: `native | buttons | chips`
- `optionStyles` is available when `controlType = radio` and `renderStyle = buttons`

`multi_select` control/render values:

- `controlType`: `multi_select | checkbox`
- `renderStyle`: `native | buttons | chips`
- `optionStyles` is available when `controlType = checkbox` and `renderStyle = buttons`

Choice button option styles are a strict semantic contract, not arbitrary
colors. Each styled option stores `{ option, variant }`, where `option` is the
current option value/label and `variant` is one of:

- `default`
- `primary`
- `secondary`
- `info`
- `success`
- `warning`
- `danger`

`default` means the runtime uses the normal button/toggle rendering and may be
omitted from `optionStyles`. Runtime renderers must ignore raw color fields and
must not guess text/background/border colors outside the accepted variants.

Backend storage note:

- frontend option authoring is accepted
- multivalue storage remains backend-facing and requires fresh code-backed contract/proposal work before activation
- this applies to `multi_select`, `tags`, and future lookup multiselect modes

## Ready-made Preset Matrix

Ready-made fields are palette shortcuts over accepted base field types.
They are not standalone backend primitives.

`uniqueValue` may be authored for plain `short_text` fields and for email/phone
text fields (`fieldPreset = email | phone` or `validation = email | phone`). It
means the field value is expected to be unique within the field's model/scope;
`false` is omitted from compact payloads. Specialized text presets such as
`URL` and `suggest_text` do not expose this authoring switch.

| Preset | Compile Target | Locked Settings | Runtime/Authoring Notes |
| --- | --- | --- | --- |
| `Email` | `baseType = short_text`, `fieldPreset = email` | `placeholder`, `autocomplete = email`, `inputMode = email`, `displayFormat`, `validation = email`, optional `uniqueValue` | Fast email input preset over text storage. `uniqueValue` enforcement is handled outside the Form Builder renderer. |
| `Phone` | `baseType = short_text`, `fieldPreset = phone` | `placeholder`, `autocomplete = tel`, `inputMode = tel`, `displayFormat`, `mask`, `validation`, optional `uniqueValue` | Phone-oriented input behavior over text storage. `uniqueValue` enforcement is handled outside the Form Builder renderer. |
| `URL` | `baseType = short_text`, `fieldPreset = url` | `placeholder`, `autocomplete = url`, `inputMode = url`, `displayFormat`, `validation = url` | Link-oriented validation and entry behavior over text storage. |
| `suggest_text` | `baseType = short_text`, `fieldPreset = suggest_text` | `suggestConfig.sourceMode`, `suggestConfig.searchMode`, `suggestConfig.minQueryLength`, `suggestConfig.maxResults`, `suggestConfig.allowCustomValue` | Searchable text combobox with custom values; see `Suggest Text Contract` below. |
| `date_today` | `baseType = date`, `fieldPreset = date_today` | `defaultValueMode = today`, `displayFormat`, optional `readonly` | Date field preconfigured with current-date default behavior. |
| `tags` | `baseType = multi_select`, `fieldPreset = tags` | `tagMode`, `options`, optional `maxTags` | `tagMode = select_existing | select_or_create | create_only`; existing options are available when suggestions are used. |
| `radio_group` | `baseType = single_select`, `fieldPreset = radio_group` | `options`, `renderStyle`, `orientation`, `optionStyles` | Single-choice preset rendered as native radio controls or semantic styled buttons; options remain editable. |
| `checkbox_group` | `baseType = multi_select`, `fieldPreset = checkbox_group` | `options`, `renderStyle`, `orientation`, `optionStyles`, `minSelections`, optional `maxSelections` | Multi-choice preset rendered as checkboxes or semantic styled buttons; `isRequired` may shortcut to `minSelections = 1`. |

Ready-made locked decisions:

- `Radio group` and `Checkbox group` stay in `Ready-made fields`, not in `Basic fields`
- `Radio group` and `Checkbox group` are create shortcuts, not new base field types
- generic non-workflow status fields should use `single_select` or `radio_group`
- workflow `Status` remains only in `System Fields`

## Suggest Text Contract

`suggest_text` is a ready-made preset over `short_text`.
It supports combobox-like text entry, ajax suggestions, same-field existing-value
search, and custom typed values while preserving plain text storage.

It is not:

- a new base storage primitive
- a `db_lookup`
- a `single_select`
- a tag or multivalue field

Persisted field shape:

```json
{
  "family": "preset",
  "kind": "short_text",
  "preset": "suggest_text",
  "suggestConfig": {
    "sourceMode": "same_field_distinct_values",
    "searchMode": "contains",
    "minQueryLength": 1,
    "maxResults": 20,
    "allowCustomValue": true
  }
}
```

Accepted `suggestConfig` settings:

- `sourceMode`: current accepted value is `same_field_distinct_values`
- `searchMode`: `contains | prefix`
- `minQueryLength`
- `maxResults`
- `allowCustomValue`

Current defaults:

- `sourceMode = same_field_distinct_values`
- `searchMode = contains`
- `minQueryLength = 1`
- `maxResults = 20`
- `allowCustomValue = true`

Storage and runtime rules:

- stored value is a scalar `string`
- no foreign key is stored
- no helper lookup output columns are generated
- grid, filters, and form display use the stored text directly
- user may type freely, select a suggestion, or keep a custom value
- selecting a suggestion writes its text value into the field
- clearing returns the stored value to empty text or null according to normal `short_text` nullability rules

Suggestion backend boundary:

- query distinct non-empty values from the same logical field domain
- filter by query string
- apply tenant scoping when the model is tenant-scoped
- return only text suggestions

Not accepted in `suggest_text` v1:

- cross-table custom SQL sources
- grouped suggestion sections
- FK persistence
- automatic conversion into lookup fields

Expected `suggest_text` filter operators:

- `eq`
- `neq`
- `contains`
- `not_contains`
- `in`
- `is_empty`
- `is_not_empty`

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

Content node settings:

- `Heading`: `text`, `level` (`h1 | h2 | h3 | h4`), `alignment` (`left | center | right`), optional `styleVariant`, optional `visibilityRules`; compiles to `content.heading`
- `Text block`: `text`, `alignment` (`left | center | right`), optional `styleVariant`, optional `visibilityRules`; compiles to `content.text`
- `Rich text block`: `content`, `editorMode` (`visual | html`), optional `alignment`, optional `styleVariant`, optional `visibilityRules`; compiles to `content.rich_text`
- `View-only field`: `label`, `binding.kind`, optional `binding.sourceFieldId`, optional `binding.outputKey`, optional `visibilityRules`; compiles to `content.view_only_field`

Accepted `View-only field` bindings:

- `lookup_derived_output`: requires `binding.sourceFieldId` and `binding.outputKey`
- `root_record_id`: root-only `Doc.id` display

Rejected current content nodes:

- `Image`
- `Embed`
- specialized content blocks without a new accepted contract

## Scope Model

Form Builder uses one root scope plus zero or more subform scopes.
It uses one builder document, not one flat mixed schema and not multiple
unrelated schema documents.

Canonical terms:

- `Form scope`: one authoring scope with its own `dataSchema` and `uiSchema`
- `Root scope`: the main form scope
- `Subform scope`: one child-record scope owned by one `Subform`
- `Scope root`: the top layout container of one scope

Recommended authoring shape:

```ts
interface FormBuilderDocument {
  rootScope: RootFormScope;
  subformScopes: SubformScope[];
}

interface RootFormScope {
  scopeId: "root";
  scopeType: "ROOT";
  dataSchema: ModelDefinition;
  uiSchema: ViewDefinition;
}

interface SubformScope {
  scopeId: string;
  scopeType: "SUBFORM";
  parentSubformNodeId: string;
  tableKey: string;
  subformType: "DEFAULT" | "CHECKLIST";
  dataSchema: ModelDefinition;
  uiSchema: ViewDefinition;
}
```

Root scope owns:

- root model fields
- root `uiSchema`
- root `systemFields`
- root `viewSettings`
- root `filterDefinitions`
- root list behavior
- root view actions

Subform scope owns:

- child model fields
- child `uiSchema`
- child physical table
- child `tableKey`
- child `subformType`
- child table/list behavior for `DEFAULT` subforms
- child lookup/result bindings for `CHECKLIST` subforms

Root-only concerns:

- `System Fields`
- `viewSettings.iconDataUrl`
- `viewSettings.correctiveAction`
- root `actions.canAdd`
- root `actions.canView`
- root `actions.canEdit`
- root `actions.canDelete`
- root `list.sorting`
- root `pageFilters`
- root `quickFilters`

Allowed inside subform scopes:

- model-backed fields
- field presets
- layout nodes
- content nodes
- child lookup fields
- checklist result fields
- conditional node rules
- child-table grid columns for `DEFAULT` subforms

Scope rules:

- root and subform schemas must not be flattened into one schema
- each subform owns a dedicated `dataSchema` and `uiSchema`
- `Section` may be added only at the root of the main form scope or one subform scope
- `Section` must not be added inside another `Section`, `Group`, `Tabs`, `Grid layout`, or other nested containers
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
- changes runtime orchestration, not the schema-scope boundary

Checklist persisted binding shape:

- `lookupFieldId`: required; must reference a child `db_lookup` field in the same subform scope
- `resultFieldId`: required; must reference a child `single_select` field in the same subform scope

Checklist normalization:

- legacy custom-selection combo behavior normalizes to child `single_select`
- button-style answers are rendering or preset behavior, not a separate field ontology
- result options remain editable even when created from a preset

Optional checklist sibling fields:

- notes
- files or attachments

These optional fields do not replace the required `lookupFieldId` and `resultFieldId` bindings.
Exact checklist creation UX and automatic-vs-manual binding setup remain deferred.

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

Accepted rule operators:

- `eq`
- `neq`
- `in`
- `not_in`
- `is_empty`
- `not_empty`
- `gt`
- `gte`
- `lt`
- `lte`

Persisted rule shape:

- `RuleCondition`: `id`, `fieldId`, `operator`, optional scalar `value`, optional array `values`
- `VisibilityRule`: `id`, `when.all[]`, `effect = show | hide`
- `RequirementRule`: `id`, `when.all[]`, `effect = required | optional`
- `NodeRules`: optional `visibilityRules[]`, optional `requirementRules[]`

Authoring rules:

- empty checks omit literal values
- `in` and `not_in` use `values`
- container nodes may expose visibility rules only
- field nodes may expose visibility and requirement rules

Runtime rules:

- visibility rules affect UI presentation only
- requirement rules affect runtime required-state and validation only in the current scope
- requirement rules do not rewrite the base model field as globally required

## Grid Columns

Grid-column configuration is a view-layer concern.

It is not:

- a base field property
- a field preset
- a layout-grid container

Current persisted direction:

- `viewSettings.list.columns[]`
- each column has `fieldId`, `visible`, and `order`

Grid column shape:

- `id`: stable column definition id
- `fieldId`: field in the current scope
- `visible`: whether the field renders in the grid
- `order`: authored display order

Scope rules:

- root scope may configure root grid columns
- `DEFAULT` subform scope may configure child-table grid columns
- `CHECKLIST` subforms do not use grid columns
- grid-column field references must stay inside the current scope

UI placement:

- dedicated top-level `Grid` tab
- first version supports visibility and ordering
- width, alignment, renderer override, and label override are deferred

Runtime rules:

- only visible columns render
- display order follows authored column order
- fields not included in `columns` are hidden by default

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

- parent `Subform` node display title, exposed from the Subform `View` tab
- child `canAdd`
- child `canEdit`
- child `canDelete`
- child list sorting
- child list columns

Editing the Subform title must not rename `schemaScopeId`, `tableKey`, runtime
table/view names, or other storage identity.

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
- the section may be empty, hidden, or feature-flagged until individual advanced items are approved
- advanced items require their own separate review and contract approval
- generic non-workflow status should use `single_select` or `radio_group`
- repeated child collections are represented by `Subform`, not `Repeater`

## Exact Detail Read Path

For exact payload shapes or historical review, open only the specific old detail doc needed.
Do not read the whole `platform/frontend/docs/platform-studio/**` tree:

- field catalog and registry: `form-builder-accepted-registry.md`, `form-builder-v2-field-contract.md`, `form-builder-field-catalog.md`
- specific field settings: `form-builder-core-data-fields.md`, `form-builder-choice-preset-inspector-schema.md`, or `form-builder-relationships.md`; choice, ready-made, and `suggest_text` payloads are compacted in this document
- System Fields: `form-builder-system-fields.md`
- rules: use this document; deleted old exact-detail source is git-history only
- grid columns: use this document; deleted old exact-detail source is git-history only
- view settings and filters: `form-builder-view-settings-contract.md` or `form-builder-view-settings-inspector-contract.md`
- scope/subform: use this document; deleted old schema-scope and checklist sources are git-history only
- static/external models: `form-builder-static-lookup-naming-policy-v1.md` and `form-builder-static-models-integration-v1.md`
- storage rationale: `data-schema-storage-rules.md`, but prefer the backend Form Builder contract for current backend-owned storage truth
