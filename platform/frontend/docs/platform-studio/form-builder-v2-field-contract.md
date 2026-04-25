# Form Builder V2 Field Contract

Status: exact detail reference
Historical status: active
Date: 2026-04-08
Last audited: 2026-04-25
Read rule: Open only after the active Form Builder module docs, and only when exact payload/settings/history detail is needed.
Canonical active docs:

- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

## Purpose

This document locks the V2 field contract for Platform Studio Form Builder.

It exists to keep these layers separate:

- base field types
- field presets
- runtime presets
- conditional rules
- System Fields
- grid-column definitions
- layout shortcuts
- page or view settings
- filter definitions

This document is the contract companion to:

- `form-builder-accepted-registry.md`
- `form-builder-field-catalog.md`
- `form-builder-section-tree.md`
- `form-builder-core-data-fields.md`
- `form-builder-system-fields.md`
- `form-builder-schema-scope-contract.md`
- `form-builder-view-settings-contract.md`
- `form-builder-slice-1-inspector-and-view-schema.md`

Field rule, grid-column, and checklist-subform payload details were compacted into `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`.
Page/filter notes were compacted into `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`; backend boundary truth lives in `platform/backend/docs/contracts/platform-studio-form-builder.md`.

## Review Projection Note

`form-builder-section-tree.md` is the palette-oriented review projection.

This document remains the stricter contract layer.

Recommended rule:

- use `form-builder-accepted-registry.md` as the implementation gate summary
- use the section tree to review what the user sees in the builder palette
- use this document to decide what registry layer a node actually belongs to
- palette shortcuts may also exist for layout authoring, even when the canonical persisted node stays the same

## Canonical Registries

The V2 model should treat these as separate registries:

- `Field Types Registry`
- `Field Presets Registry`
- `Semantic/System Bindings Registry`
- `Layout Nodes Registry`
- `Content Nodes Registry`

The builder palette may project items from more than one registry into one user-facing section.

## Naming Note

`System Fields` in Form Builder are authored business fields with explicit page semantics.

They are not the backend-generated system columns from storage rules such as:

- `_id`
- `_guid`
- `_created_at`
- `_updated_at`

## Contract Layers

### 1. Base field type

The base field type is the stable logical primitive stored on `ModelFieldDefinition`.

It defines:

- value shape
- validation family
- storage intent
- relation or option-source expectations

Examples:

- `short_text`
- `long_text`
- `integer`
- `date`
- `single_select`
- `multi_select`
- `db_lookup`

Base field type must not encode:

- view-specific widget choice
- readonly display aliases
- page workflow bindings
- title-marker behavior
- raw legacy field ids

### 2. Field preset

A field preset is an authored shortcut layered on top of a base field type.

It may set:

- default label
- validation mode
- input mask or format
- default option source
- default lookup target
- default runtime preset

Examples:

- `email`
- `phone`
- `url`
- `suggest_text`
- `date_today`
- `tags`
- `radio_group`
- `checkbox_group`
- `contact_lookup`
- `company_lookup`
- `project_lookup`

Field presets improve authoring UX, but they are not new backend primitives.

### 3. Runtime preset

A runtime preset chooses how one field is rendered in one view binding.

It belongs to the view or layout layer, not to the base field primitive.

Examples:

- `textarea`
- `select`
- `radio_chips`
- `badge`
- `signature_pad`
- `geo_capture`
- `lookup_summary_card`
- `readonly_card`

The same field may use different runtime presets in different views when the business meaning stays the same.

### 4. Conditional rule

A conditional rule is an authored UI rule attached to the current node in `uiSchema`.

It covers concerns such as:

- show or hide
- required or optional

It must stay separate from:

- base field types
- field presets
- page filters
- Action Builder workflows

### 5. System Field

A System Field is a dedicated palette item in the `System Fields` section.

It is not a new base field type.
It is an authoring shortcut that creates or reuses:

- a normal field definition
- a layout binding
- an explicit view-level semantic binding

The authoritative page semantics must be stored as structured view data, not inferred from the label.

### 6. Grid-column definition

A grid-column definition is a view-level description of:

- which fields appear in a grid
- in what order they appear

It must stay separate from:

- base field definitions
- layout grid containers
- page filters

### 7. Page or view setting

Page or view settings are not fields.

They cover concerns such as:

- title
- ordering
- activation
- icon
- corrective action routing
- list sorting
- action toggles
- per-view field access overrides

Some legacy field-backed settings should now be modeled through `System Fields`.
Non-field settings remain in `ViewDefinition.viewSettings`.

### 8. Filter definition

A filter definition is a structured condition object.

It must be separate from:

- base field types
- page settings
- raw SQL-like legacy strings

The same filter-definition shape may be reused in:

- view list filters
- saved quick filters
- lookup source filters
- dependent filters between fields

## Authoring Rules

- Every authored field must have exactly one `baseType`.
- A field may have zero or one `fieldPreset`.
- A view binding may have zero or one `runtimePreset`.
- conditional UI rules belong on the current `uiSchema` node, not on `ModelFieldDefinition`
- A System Field must write an explicit semantic binding into the view contract.
- `view.systemFields` exists only once per form view.
- System Fields are allowed only on the root level of the main form view.
- System Fields must not be authored inside subforms, repeaters, or nested scopes.
- `Section` is allowed only at the root of the current form scope.
- each managed `Subform` owns its own schema scope with dedicated `dataSchema` and `uiSchema`.
- grid-column definitions belong to the current scope view, not to the field definition
- One `SystemFieldRole` may bind only one field per view.
- A System Field may bind an existing field only when its base type is compatible with the role.
- Never infer business semantics from `displayName`, `title`, or legacy numeric ids.
- Never hide page semantics only inside field labels such as `GPS coordinates` or `Signature`.

## Recommended Persisted Shape

### ModelFieldDefinition

Recommended field-facing shape:

- `id`
- `key`
- `displayName`
- optional `description`
- `baseType`
- optional `fieldPreset`
- `isRequired`
- `isNullable`
- optional `defaultValue`
- optional `validation`
- optional `options`
- optional `source`
- optional `storage`
- optional `lockState`
- optional `metadata`

Recommended rule:

- `baseType` is the canonical business primitive
- `fieldPreset` records the authored shortcut when it is semantically useful

### Layout field binding

Recommended binding-facing shape inside `LayoutNode`:

- `fieldId`
- optional `runtimePreset`
- optional `readonly`
- optional `visibility`
- optional `widgetConfig`

This is the correct place for renderer choices such as:

- `badge`
- `radio_chips`
- `signature_pad`
- `lookup_summary_card`

### ViewDefinition additions

Recommended view-facing field contract additions:

- `systemFields`
- `viewSettings`
- `filterDefinitions`
- `fieldOverrides`

Suggested structure:

```ts
type SystemFieldRole = "reported_by" | "reported_date" | "workflow_status";

interface ViewSystemFields {
  version: 1;
  reportedBy?: {
    fieldId: string;
  };
  reportedDate?: {
    fieldId: string;
  };
  workflowStatus?: {
    fieldId: string;
    initialValue?: string;
    finalValue?: string;
  };
}

interface ViewFilterDefinitions {
  version: 2;
  pageFilters: unknown[];
  quickFilters: unknown[];
}

interface ViewSettings {
  iconDataUrl?: string;
  correctiveAction?: {
    enabled: boolean;
    sourceType: "platform_static";
    modelKey: "corrective_action";
  };
  actions?: {
    canAdd?: boolean;
    canView?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
  };
  list?: {
    sorting?: {
      fieldId?: string;
      direction?: "asc" | "desc";
    };
  };
}
```

Recommended rule:

- the semantic binding lives in `ViewDefinition.systemFields`
- the actual field definition still lives in `ModelDefinition.fields`
- final root-level view settings and compact filter UX are owned by `form-builder-view-settings-contract.md`

## Locked Initial System Fields

The first V2 System Fields set should be:

- `Reported By`
- `Reported Date`
- `Status`

### Reported By

Recommended contract:

- palette section: `System Fields`
- created field base type: `db_lookup`
- created field preset: `contact_lookup`
- default label: `Reported By`
- view semantic binding: `systemFields.reportedBy.fieldId`

This replaces the legacy `Field By` flow where the user had to create the contact field first and bind it later in page settings.

### Reported Date

Recommended contract:

- palette section: `System Fields`
- created field base type: `date`
- optional created field preset: none
- default label: `Reported Date`
- view semantic binding: `systemFields.reportedDate.fieldId`

This replaces the legacy `Field Date` setting.

### Status

Recommended contract:

- palette section: `System Fields`
- created field base type: `single_select`
- created field preset: `status`
- default label: `Status`
- accepted creation modes:
  - `template`
  - `custom`
- optional template seed:
  - `statusTemplateKey`
- field-owned data: `options`
- optional field-owned display data: `colorMapping`
- view semantic binding: `systemFields.workflowStatus.fieldId`
- workflow semantics:
  - `initialValue`
  - `finalValue`

Recommended runtime presets:

- `select`
- `radio_chips`
- `badge`

Important authoring rule:

- `Status` must allow creating different status variants
- different forms may use different status variant sets
- template-created variants remain editable after creation

Important rule:

- workflow status is not a boolean checkbox
- it is one current state chosen from an explicit option set
- `initialValue` and `finalValue` must exist in that option set

## Legacy Translation Into V2

The legacy EzData Page settings should translate as follows:

- `Field By`
  - `view.systemFields.reportedBy.fieldId`
- `Field Date`
  - `view.systemFields.reportedDate.fieldId`
- `Field Status`
  - `view.systemFields.workflowStatus.fieldId`
- `Field Status - Draft variant`
  - `view.systemFields.workflowStatus.initialValue`
- `Field Status - Finish variant`
  - `view.systemFields.workflowStatus.finalValue`
- `Icon`
  - `view.viewSettings.iconDataUrl`
- `CA page`
  - `view.viewSettings.correctiveAction.enabled`
  - uses the platform-owned static corrective action table instead of arbitrary per-view page routing
- action toggles
  - `view.viewSettings.actions.canAdd`
  - `view.viewSettings.actions.canView`
  - `view.viewSettings.actions.canEdit`
  - `view.viewSettings.actions.canDelete`
- `ExtDBpg_order1`, `ExtDBpg_order2`
  - `view.viewSettings.list.sorting.fieldId`
  - `view.viewSettings.list.sorting.direction`
- page field access overrides such as `View Only` and `Hidden`
  - `view.fieldOverrides`
- `ExtDBpg_filter`
  - `view.filterDefinitions.pageFilters`
- `ExtDBpg_prefilter`
  - `view.filterDefinitions.quickFilters`

## Minimal Contract Example

```json
{
  "model": {
    "id": "incident",
    "fields": [
      {
        "id": "reported_by",
        "key": "reported_by",
        "displayName": "Reported By",
        "baseType": "db_lookup",
        "fieldPreset": "contact_lookup"
      },
      {
        "id": "reported_date",
        "key": "reported_date",
        "displayName": "Reported Date",
        "baseType": "date"
      },
      {
        "id": "status",
        "key": "status",
        "displayName": "Status",
        "baseType": "single_select",
        "fieldPreset": "status",
        "options": ["Draft", "Open", "Closed"]
      }
    ]
  },
  "view": {
    "systemFields": {
      "version": 1,
      "reportedBy": {
        "fieldId": "reported_by"
      },
      "reportedDate": {
        "fieldId": "reported_date"
      },
      "workflowStatus": {
        "fieldId": "status",
        "initialValue": "Draft",
        "finalValue": "Closed"
      }
    },
    "viewSettings": {
      "iconDataUrl": "data:image/png;base64,...",
      "correctiveAction": {
        "enabled": true,
        "sourceType": "platform_static",
        "modelKey": "corrective_action"
      },
      "actions": {
        "canAdd": true,
        "canView": true,
        "canEdit": true,
        "canDelete": true
      },
      "list": {
        "sorting": {
          "fieldId": "reported_date",
          "direction": "desc"
        }
      }
    },
    "filterDefinitions": {
      "version": 2,
      "pageFilters": [],
      "quickFilters": []
    }
  }
}
```

## Explicit Rejections

V2 should reject these legacy habits:

- title-marker semantics
- label-based role inference
- page semantics encoded only in a detached settings dropdown
- raw SQL-like filter DSL as the primary saved contract
- treating readonly aliases and runtime widgets as base field primitives

## What Should Happen Next

Before implementation expands, V2 should do the following:

1. keep the implementation aligned with `form-builder-slice-1-inspector-and-view-schema.md` only where it does not conflict with the newer root `View settings` contract
2. lock the dedicated `View settings` contract for compact page filters, quick filters, sorting, actions, icon, and corrective action
3. lock the exact save payload shape for view drafts that include `layout`, `systemFields`, `viewSettings`, and `filterDefinitions`
4. decide whether later filter phases add nested groups, `or` logic, and field-reference value sources
5. lock any remaining runtime-preset gaps for readonly display, lookup summary, signature, and geo capture
