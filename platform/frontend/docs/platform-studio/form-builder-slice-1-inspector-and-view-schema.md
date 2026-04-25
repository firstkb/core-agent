# Form Builder Slice 1 Inspector And View Schema

Status: exact detail reference
Historical status: active
Date: 2026-04-08
Last audited: 2026-04-25
Read rule: Open only after the active Form Builder module docs, and only when exact payload/settings/history detail is needed.
Canonical active docs:

- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

## Purpose

This document locks the first precise inspector schema for Form Builder V2 and the exact slice-1 JSON schema for:

- `systemFields`
- `filterDefinitions`

It is the detailed companion to:

- `form-builder-v2-field-contract.md`
- `form-builder-field-catalog.md`
- `form-builder-core-data-fields.md`
- `form-builder-system-fields.md`

Field rule and grid-column payload details were compacted into `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`.
Page/filter notes were compacted into `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`; backend boundary truth lives in `platform/backend/docs/contracts/platform-studio-form-builder.md`.

## Slice 1 Scope

This document covers only the view-authoring layer inside the Form Builder workspace.

It does not define:

- model structure editing
- backend transport envelopes
- conditional node rules
- grid-column authoring
- nested boolean filter groups
- `or` filter logic
- field-to-field comparison values
- runtime publish contracts

Model-side preset inspector settings for `Radio group` and `Checkbox group` are locked separately in:

- `form-builder-choice-preset-inspector-schema.md`

Accepted target contracts that go beyond the current slice-1 implementation are locked separately in:

- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

## Inspector Shape

The slice-1 inspector keeps two tabs:

- `selection`
- `view`

Accepted future target:

- add a dedicated top-level `grid` tab for authored grid columns

### Selection Tab

The `selection` tab edits the currently selected node inside the layout tree.

#### Field node schema

Section `Identity`

- `fieldId`
  - read-only
- `baseType`
  - read-only
- `fieldPreset`
  - read-only when present

Section `Presentation`

- `title`
  - optional string
  - label override for this view binding
- `helperText`
  - optional string
- `runtimePreset`
  - enum filtered by the field compatibility matrix

Section `Access`

- `visibility`
  - enum:
    - `visible`
    - `readonly`
    - `hidden`

Slice-1 rule:

- the field node inspector does not edit model field structure
- requiredness, options, lookup targets, and validation stay outside the view workspace for now
- `Radio group` and `Checkbox group` preset settings stay in the model field editor, not in this slice-1 workspace inspector
- the accepted future target adds a dedicated `Rules` section for conditional `Visibility rules` and `Requirement rules`

#### Heading node schema

Section `Content`

- `title`
  - required string

#### Text and rich text node schema

Section `Content`

- `title`
  - optional string
- `text`
  - optional string

#### Section, group, tab, and subform schema

Section `Container`

- `title`
  - optional string

Slice-1 rule:

- subform advanced configuration is deferred

#### Grid, column, divider, and spacer schema

No additional editable inspector fields are required in slice 1.

### Runtime Preset Compatibility Matrix

Slice-1 `runtimePreset` choices are:

- `select`
- `radio_chips`
- `badge`
- `signature_pad`
- `geo_capture`
- `lookup_summary_card`
- `readonly_card`

Allowed combinations:

- `single_select` when used as workflow status
  - `select`
  - `radio_chips`
  - `badge`
- `db_lookup`
  - `lookup_summary_card`
- `signature`
  - `signature_pad`
- `geo_point`
  - `geo_capture`
- readonly display presets
  - `readonly_card`

If no compatible runtime preset exists, the field uses its default renderer and the inspector must not show a `runtimePreset` control.

### View Tab

The `view` tab edits the selected view rather than the selected node.

It has three slice-1 sections:

- `Summary`
- `System Fields`
- `Filters`

#### Summary section

- `displayName`
  - read-only in the workspace for slice 1
- `description`
  - editable string
- `viewType`
  - read-only for slice 1

#### System Fields section

This section renders one role card per supported role:

- `Reported By`
- `Reported Date`
- `Status`

Each card uses:

- `enabled`
  - derived boolean from whether the role object exists
- `fieldId`
  - select menu limited to compatible fields

`Status` adds:

- `initialValue`
  - optional select menu limited to the bound field options
- `finalValue`
  - optional select menu limited to the bound field options

Slice-1 rules:

- creating a new System Field still happens from the palette
- the view inspector may bind or unbind an eligible existing field
- one field may not be bound to more than one System Field role in the same view

#### Filters section

This section renders two editors:

- `defaultFilters`
- `quickFilters`

`defaultFilters` editor fields:

- `logic`
  - fixed to `and` in slice 1
- `conditions`
  - ordered list of flat conditions

`quickFilters` editor fields:

- `id`
  - stable client-generated id
- `label`
  - required string
- `color`
  - optional hex color
- `logic`
  - fixed to `and` in slice 1
- `conditions`
  - ordered list of flat conditions

Each condition row uses:

- `fieldId`
  - required select from current model fields
- `operator`
  - required enum
- `valueSource`
  - required when the operator needs a value

## Exact JSON Schema

### `systemFields`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://platform-studio.local/schemas/form-builder/view-system-fields.v1.json",
  "title": "FormBuilderViewSystemFieldsV1",
  "type": "object",
  "additionalProperties": false,
  "required": ["version"],
  "properties": {
    "version": {
      "const": 1
    },
    "reportedBy": {
      "$ref": "#/$defs/fieldBinding"
    },
    "reportedDate": {
      "$ref": "#/$defs/fieldBinding"
    },
    "workflowStatus": {
      "$ref": "#/$defs/workflowStatusBinding"
    }
  },
  "$defs": {
    "fieldBinding": {
      "type": "object",
      "additionalProperties": false,
      "required": ["fieldId"],
      "properties": {
        "fieldId": {
          "type": "string",
          "minLength": 1
        }
      }
    },
    "workflowStatusBinding": {
      "type": "object",
      "additionalProperties": false,
      "required": ["fieldId"],
      "properties": {
        "fieldId": {
          "type": "string",
          "minLength": 1
        },
        "initialValue": {
          "type": "string",
          "minLength": 1
        },
        "finalValue": {
          "type": "string",
          "minLength": 1
        }
      }
    }
  }
}
```

Semantic validation rules beyond JSON Schema:

- `reportedBy.fieldId` must reference a compatible `db_lookup` field that resolves to a person/contact-style record
- `reportedDate.fieldId` must reference a compatible `date` or `date_time` field
- `workflowStatus.fieldId` must reference a compatible `single_select` field
- `workflowStatus.initialValue` and `workflowStatus.finalValue` must exist in the bound field option set when present
- the same `fieldId` must not be reused across multiple System Field roles in one view
- `systemFields` is a root-view document slice and must not be stored on subforms, repeaters, or nested layout nodes

### `filterDefinitions`

Status note:

- the JSON schema below reflects the current slice-1 technical draft only
- the final compact root-view filter UX is defined by `form-builder-view-settings-contract.md`
- the exact target inspector UX is defined by `form-builder-view-settings-inspector-contract.md`
- the canonical target payload is `version: 2` with `pageFilters` and `quickFilters`
- implementation should move toward the compact `Page Filter` and `Quick Filters` workflow from that contract instead of expanding the current flat editor

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://platform-studio.local/schemas/form-builder/view-filter-definitions.v1.json",
  "title": "FormBuilderViewFilterDefinitionsV1",
  "type": "object",
  "additionalProperties": false,
  "required": ["version", "defaultFilters", "quickFilters"],
  "properties": {
    "version": {
      "const": 1
    },
    "defaultFilters": {
      "$ref": "#/$defs/filterGroup"
    },
    "quickFilters": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/quickFilter"
      }
    }
  },
  "$defs": {
    "scalarLiteral": {
      "type": ["string", "number", "boolean"]
    },
    "fieldId": {
      "type": "string",
      "minLength": 1
    },
    "filterGroup": {
      "type": "object",
      "additionalProperties": false,
      "required": ["logic", "conditions"],
      "properties": {
        "logic": {
          "const": "and"
        },
        "conditions": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/filterCondition"
          }
        }
      }
    },
    "quickFilter": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "label", "logic", "conditions"],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "label": {
          "type": "string",
          "minLength": 1
        },
        "color": {
          "type": "string",
          "pattern": "^#[0-9A-Fa-f]{6}$"
        },
        "logic": {
          "const": "and"
        },
        "conditions": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/filterCondition"
          }
        }
      }
    },
    "literalValueSource": {
      "type": "object",
      "additionalProperties": false,
      "required": ["kind", "value"],
      "properties": {
        "kind": {
          "const": "literal"
        },
        "value": {
          "$ref": "#/$defs/scalarLiteral"
        }
      }
    },
    "literalArrayValueSource": {
      "type": "object",
      "additionalProperties": false,
      "required": ["kind", "value"],
      "properties": {
        "kind": {
          "const": "literal_array"
        },
        "value": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/scalarLiteral"
          },
          "minItems": 1
        }
      }
    },
    "tokenValueSource": {
      "type": "object",
      "additionalProperties": false,
      "required": ["kind", "token"],
      "properties": {
        "kind": {
          "const": "token"
        },
        "token": {
          "enum": [
            "currentUser.companyId",
            "currentUser.companyName",
            "currentUser.divisionId",
            "currentUser.divisionName",
            "currentUser.projectAccessIds"
          ]
        }
      }
    },
    "scalarRangeValueSource": {
      "type": "object",
      "additionalProperties": false,
      "required": ["kind", "start", "end"],
      "properties": {
        "kind": {
          "const": "scalar_range"
        },
        "start": {
          "$ref": "#/$defs/scalarLiteral"
        },
        "end": {
          "$ref": "#/$defs/scalarLiteral"
        }
      }
    },
    "relativeDateValueSource": {
      "type": "object",
      "additionalProperties": false,
      "required": ["kind", "preset"],
      "properties": {
        "kind": {
          "const": "relative_date"
        },
        "preset": {
          "enum": [
            "current_week",
            "last_week",
            "next_week",
            "current_month",
            "last_month",
            "next_month",
            "current_quarter",
            "last_quarter",
            "next_quarter",
            "current_year",
            "last_year",
            "next_year",
            "last_12_months",
            "next_3_days",
            "next_5_days",
            "next_7_days",
            "today_or_later",
            "today_or_earlier"
          ]
        }
      }
    },
    "emptyCondition": {
      "type": "object",
      "additionalProperties": false,
      "required": ["fieldId", "operator"],
      "properties": {
        "fieldId": {
          "$ref": "#/$defs/fieldId"
        },
        "operator": {
          "enum": ["is_empty", "is_not_empty"]
        }
      }
    },
    "scalarCondition": {
      "type": "object",
      "additionalProperties": false,
      "required": ["fieldId", "operator", "valueSource"],
      "properties": {
        "fieldId": {
          "$ref": "#/$defs/fieldId"
        },
        "operator": {
          "enum": ["eq", "neq", "contains", "not_contains", "gt", "gte", "lt", "lte"]
        },
        "valueSource": {
          "oneOf": [
            {
              "$ref": "#/$defs/literalValueSource"
            },
            {
              "$ref": "#/$defs/tokenValueSource"
            }
          ]
        }
      }
    },
    "setCondition": {
      "type": "object",
      "additionalProperties": false,
      "required": ["fieldId", "operator", "valueSource"],
      "properties": {
        "fieldId": {
          "$ref": "#/$defs/fieldId"
        },
        "operator": {
          "const": "in"
        },
        "valueSource": {
          "$ref": "#/$defs/literalArrayValueSource"
        }
      }
    },
    "rangeCondition": {
      "type": "object",
      "additionalProperties": false,
      "required": ["fieldId", "operator", "valueSource"],
      "properties": {
        "fieldId": {
          "$ref": "#/$defs/fieldId"
        },
        "operator": {
          "const": "between"
        },
        "valueSource": {
          "$ref": "#/$defs/scalarRangeValueSource"
        }
      }
    },
    "relativeDateCondition": {
      "type": "object",
      "additionalProperties": false,
      "required": ["fieldId", "operator", "valueSource"],
      "properties": {
        "fieldId": {
          "$ref": "#/$defs/fieldId"
        },
        "operator": {
          "const": "relative_date"
        },
        "valueSource": {
          "$ref": "#/$defs/relativeDateValueSource"
        }
      }
    },
    "filterCondition": {
      "oneOf": [
        {
          "$ref": "#/$defs/emptyCondition"
        },
        {
          "$ref": "#/$defs/scalarCondition"
        },
        {
          "$ref": "#/$defs/setCondition"
        },
        {
          "$ref": "#/$defs/rangeCondition"
        },
        {
          "$ref": "#/$defs/relativeDateCondition"
        }
      ]
    }
  }
}
```

Semantic validation rules beyond JSON Schema:

- every `fieldId` must reference a field in the current model
- operator compatibility must be checked against the field base type
- `contains` and `not_contains` are valid only for text-like fields
- `gt`, `gte`, `lt`, `lte`, and `between` are valid only for numeric and date-like fields
- `relative_date` is valid only for `date` and `date_time` fields
- `quickFilters[*].id` must be unique within the array
- nested groups and `or` logic are rejected in slice 1

## Minimal Saved Example

```json
{
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
  "filterDefinitions": {
    "version": 1,
    "defaultFilters": {
      "logic": "and",
      "conditions": [
        {
          "fieldId": "status",
          "operator": "neq",
          "valueSource": {
            "kind": "literal",
            "value": "Archived"
          }
        }
      ]
    },
    "quickFilters": [
      {
        "id": "open-items",
        "label": "Open Items",
        "color": "#D97706",
        "logic": "and",
        "conditions": [
          {
            "fieldId": "status",
            "operator": "in",
            "valueSource": {
              "kind": "literal_array",
              "value": ["Draft", "Open"]
            }
          }
        ]
      }
    ]
  }
}
```

## Deferred Beyond Slice 1

These stay intentionally out of the first locked schema:

- nested `and` or `or` groups
- field-reference value sources
- formula-based filter expressions
- transport of raw SQL fragments
- role-specific workflow transition rules beyond `initialValue` and `finalValue`
- view action toggles, corrective-action toggle, and icon routing in the same inspector section as System Fields
- the final compact modal-driven page-filter UX defined in `form-builder-view-settings-contract.md`
