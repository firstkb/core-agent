# Form Builder V2 Field Contract

Status: active
Date: 2026-04-08

## Purpose

This document locks the V2 field contract for Platform Studio Form Builder.

It exists to keep these layers separate:

- base field types
- field presets
- runtime presets
- System Fields
- page or view settings
- filter definitions

This document is the contract companion to:

- `form-builder-field-catalog.md`
- `form-builder-page-and-filter-notes.md`
- `form-builder-backend-boundary.md`
- `form-builder-slice-1-inspector-and-view-schema.md`

## Naming Note

`System Fields` in Form Builder are authored business fields with explicit page semantics.

They are not the backend-generated system columns from storage rules such as:

- `_id`
- `_guid`
- `_created_at`
- `_updated_at`
- `_row_version`

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
- `relation`
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
- default relation target
- default runtime preset

Examples:

- `email`
- `phone`
- `url`
- `date_today`
- `tags`
- `readonly_text`
- `readonly_numeric`
- `user_relation`
- `contact_relation`
- `company_relation`
- `project_relation`
- `status`

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
- `relation_summary_card`
- `readonly_card`

The same field may use different runtime presets in different views when the business meaning stays the same.

### 4. System Field

A System Field is a dedicated palette item in the `System Fields` section.

It is not a new base field type.
It is an authoring shortcut that creates or reuses:

- a normal field definition
- a layout binding
- an explicit view-level semantic binding

The authoritative page semantics must be stored as structured view data, not inferred from the label.

### 5. Page or view setting

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

### 6. Filter definition

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
- A System Field must write an explicit semantic binding into the view contract.
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
- optional `relation`
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
- `relation_summary_card`

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
  version: 1;
  defaultFilters: {
    logic: "and";
    conditions: unknown[];
  };
  quickFilters: Array<{
    id: string;
    label: string;
    logic: "and";
    conditions: unknown[];
    color?: string;
  }>;
}
```

Recommended rule:

- the semantic binding lives in `ViewDefinition.systemFields`
- the actual field definition still lives in `ModelDefinition.fields`

## Locked Initial System Fields

The first V2 System Fields set should be:

- `Reported By`
- `Reported Date`
- `Status`

### Reported By

Recommended contract:

- palette section: `System Fields`
- created field base type: `relation`
- created field preset: `contact_relation`
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
- field-owned data: `options`
- view semantic binding: `systemFields.workflowStatus.fieldId`
- workflow semantics:
  - `initialValue`
  - `finalValue`

Recommended runtime presets:

- `select`
- `radio_chips`
- `badge`

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
  - `view.viewSettings.icon`
- `CA page`
  - `view.viewSettings.correctiveActionViewId`
- page field access overrides such as `View Only` and `Hidden`
  - `view.fieldOverrides`
- `ExtDBpg_filter`
  - `view.filterDefinitions.defaultFilters`
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
        "baseType": "relation",
        "fieldPreset": "contact_relation"
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
      "icon": "clipboard"
    },
    "filterDefinitions": {
      "version": 1,
      "defaultFilters": {
        "logic": "and",
        "conditions": []
      },
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

1. keep the implementation aligned with `form-builder-slice-1-inspector-and-view-schema.md`
2. lock the exact save payload shape for view drafts that include `layout`, `systemFields`, and `filterDefinitions`
3. decide whether slice 2 adds nested filter groups, `or` logic, and field-reference value sources
4. lock any remaining runtime-preset gaps for readonly display, relation summary, signature, and geo capture
