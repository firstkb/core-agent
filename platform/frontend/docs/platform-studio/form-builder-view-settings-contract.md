# Form Builder View Settings Contract

Status: exact detail reference
Historical status: active
Date: 2026-04-08
Last audited: 2026-04-25
Read rule: Open only after the active Form Builder module docs, and only when exact payload/settings/history detail is needed.
Canonical active docs:

- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

## Purpose

This document locks the current working contract for root-level `View settings` in Platform Studio Form Builder V2.

It exists to keep these concerns explicit and separate from:

- model field definitions
- System Fields
- layout nodes
- checklist-specific subform behavior

This document is the contract companion to:

- `form-builder-v2-field-contract.md`
- `form-builder-slice-1-inspector-and-view-schema.md`
- `form-builder-view-settings-inspector-contract.md`

Grid-column and checklist-subform payload details were compacted into `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`.
Page/filter notes were compacted into `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`; backend boundary truth lives in `platform/backend/docs/contracts/platform-studio-form-builder.md`.

## Source Provenance

This contract stays grounded in the three original analysis inputs:

- `EXTDB`
  - `ExtDBpg_edit.htm`
  - `pg_filterS.htm`
  - `pg_filterN.htm`
  - `pg_filterD.htm`
  - `pg_filter.htm`
  - lookup-specific filter dialogs in `default.asp`
- `smartapp`
  - current runtime expectations for page workflow, list behavior, and action availability
- `ezform`
  - builder-shell expectations for compact settings panels and modal-based editing

## Scope

This document covers only root-level view concerns such as:

- icon
- corrective action
- view actions
- list sorting
- list columns
- page filters
- quick filters

These settings belong to the root view only.
They do not belong to subforms or nested layout scopes.

The exact target inspector UX is defined in:

- `form-builder-view-settings-inspector-contract.md`

The dedicated `Grid` tab is defined in:

- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

## Canonical View Settings Sections

The root `View settings` area should be organized into these sections:

1. `Workflow`
2. `Actions`
3. `List`

## Recommended Persisted Shape

```ts
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
    columns?: GridColumnDefinition[];
  };
}

interface GridColumnDefinition {
  id: string;
  fieldId: string;
  visible: boolean;
  order: number;
}

interface ViewFilterDefinitions {
  version: 2;
  pageFilters: PageFilterDefinition[];
  quickFilters: QuickFilterDefinition[];
}

type StringFilterOperator =
  | "eq"
  | "neq"
  | "contains"
  | "in_list"
  | "is_empty"
  | "not_empty";

type NumberFilterOperator =
  | "eq"
  | "gt"
  | "lt"
  | "lte"
  | "gte"
  | "neq";

type DateFilterPreset =
  | "current_week"
  | "last_week"
  | "next_week"
  | "current_month"
  | "last_month"
  | "next_month"
  | "current_quarter"
  | "last_quarter"
  | "next_quarter"
  | "current_year"
  | "last_year"
  | "next_year"
  | "last_12_months"
  | "year_to_date"
  | "greater_than_today"
  | "equal_to_today"
  | "less_than_today"
  | "next_3_days"
  | "next_5_days"
  | "next_7_days";

type LookupDynamicToken =
  | "current_user_id"
  | "current_user_company_id"
  | "current_user_division_id"
  | "current_user_company_name"
  | "current_user_division_name"
  | "assigned_projects";

type LookupPresetKey =
  | "contact_lookup"
  | "company_lookup"
  | "project_lookup"
  | "generic_db_lookup";

interface BasePageFilterDefinition {
  id: string;
  fieldId: string;
  editorType: "string" | "number" | "date" | "lookup";
}

interface QuickFilterDefinition {
  id: string;
  fieldId: string;
  operator: "eq";
  value: string;
  label: string;
  color?: string;
}

interface StringPageFilterDefinition extends BasePageFilterDefinition {
  editorType: "string";
  operator: StringFilterOperator;
  value?: string;
  values?: string[];
}

interface NumberPageFilterDefinition extends BasePageFilterDefinition {
  editorType: "number";
  operator: NumberFilterOperator;
  value: number;
}

interface DateRangePageFilterDefinition extends BasePageFilterDefinition {
  editorType: "date";
  mode: "range";
  dateFrom: string;
  dateTo: string;
}

interface DatePresetPageFilterDefinition extends BasePageFilterDefinition {
  editorType: "date";
  mode: "preset";
  datePreset: DateFilterPreset;
}

interface LookupFilterClause {
  id: string;
  clauseKey: string;
  valueMode: "literal" | "dynamic_token" | "boolean_flag";
  value?: string | number | boolean;
  dynamicToken?: LookupDynamicToken;
}

interface LookupPageFilterDefinition extends BasePageFilterDefinition {
  editorType: "lookup";
  lookupPreset: LookupPresetKey;
  clauses: LookupFilterClause[];
}

type PageFilterDefinition =
  | StringPageFilterDefinition
  | NumberPageFilterDefinition
  | DateRangePageFilterDefinition
  | DatePresetPageFilterDefinition
  | LookupPageFilterDefinition;
```

## Workflow Settings

### `Icon`

Accepted rule:

- the view icon should be stored as `iconDataUrl`
- expected format is a base64 data image such as `data:image/png;base64,...`

This follows the legacy authoring intent where the page icon was entered as a base64-style image payload.

### `Corrective Action`

Accepted rule:

- `Corrective Action` is a root-level view toggle
- it is not part of checklist subform behavior
- when enabled, it should use a platform-owned static table or model

Recommended initial contract:

- `correctiveAction.enabled`
- `correctiveAction.sourceType = platform_static`
- `correctiveAction.modelKey = corrective_action`

## Action Settings

Accepted root view actions:

- `Add`
- `View`
- `Edit`
- `Delete`

Recommended persisted keys:

- `actions.canAdd`
- `actions.canView`
- `actions.canEdit`
- `actions.canDelete`

## List Settings

### Sorting

Accepted rule:

- start with one primary sort field
- store one direction

Recommended persisted shape:

- `list.sorting.fieldId`
- `list.sorting.direction`

### Grid Columns

Accepted rule:

- grid-column configuration is separate from form layout
- grid-column configuration should use a dedicated `Grid` tab
- persisted grid-column data belongs to the current scope `viewSettings`

Recommended persisted shape:

- `list.columns[]`
  - `id`
  - `fieldId`
  - `visible`
  - `order`

### Page Filters

The final page-filter UX should be compact and modal-driven.

Accepted authoring behavior:

- current page filters should render as compact summary rows
- each row should show:
  - field title
  - human-readable filter summary
  - edit action
  - remove action
- adding a filter should start from:
  - field dropdown
  - `Add Filter` button
- editing should open a small modal tailored to the selected field family

This keeps the main inspector compact while preserving the power of the legacy builder.

### Filter Modal Families

#### String filters

Based on `pg_filterS.htm`.

Accepted operators:

- `EQUAL value`
- `NOT EQUAL value`
- `CONTAIN value`
- `IN list`
- `IS EMPTY`
- `NOT EMPTY`

#### Number filters

Based on `pg_filterN.htm`.

Accepted operators:

- `equal to`
- `greater than`
- `less than`
- `equal or less`
- `equal or greater`
- `not equal`

#### Date filters

Based on `pg_filterD.htm`.

Accepted date modes:

- `Static`
- `Current Week`
- `Last Week`
- `Next Week`
- `Current Month`
- `Last Month`
- `Next Month`
- `Current Quarter`
- `Last Quarter`
- `Next Quarter`
- `Current Year`
- `Last Year`
- `Next Year`
- `Last 12 Months`
- `From Jan to YTD Months`
- `Greater than Today`
- `Equal to Today`
- `Less than Today`
- `In next 3 Days`
- `In next 5 Days`
- `In next 7 Days`

Static mode should expose:

- `dateFrom`
- `dateTo`

#### Lookup filters

Based on `pg_filter.htm` and lookup-specific dialogs in `default.asp`.

Accepted rule:

- lookup filters may expose source-specific compact controls instead of one generic operator form
- the UI may render text inputs, selects, or checkboxes depending on the lookup preset

Observed useful source-specific examples:

- contact-style lookup
  - `Active Account`
  - `by User's Company`
  - `Contact Job Type`
- company-style lookup
  - `User's Company`
  - `User's Company / Division`
  - `User's Company Name`
  - `User's Company - Division`
- project-style lookup
  - `Assigned projects`

Recommended dynamic token examples:

- `current_user_id`
- `current_user_company_id`
- `current_user_division_id`
- `current_user_company_name`
- `current_user_division_name`
- `assigned_projects`

## Exact Payload Rules

### `pageFilters`

Locked root shape:

```ts
interface ViewFilterDefinitions {
  version: 2;
  pageFilters: PageFilterDefinition[];
  quickFilters: QuickFilterDefinition[];
}
```

#### String payload

```ts
interface StringPageFilterDefinition {
  id: string;
  fieldId: string;
  editorType: "string";
  operator: "eq" | "neq" | "contains" | "in_list" | "is_empty" | "not_empty";
  value?: string;
  values?: string[];
}
```

Rules:

- `value` is required for `eq`, `neq`, and `contains`
- `values` is required for `in_list`
- `value` and `values` must be omitted for `is_empty` and `not_empty`

#### Number payload

```ts
interface NumberPageFilterDefinition {
  id: string;
  fieldId: string;
  editorType: "number";
  operator: "eq" | "gt" | "lt" | "lte" | "gte" | "neq";
  value: number;
}
```

#### Date payload

```ts
interface DateRangePageFilterDefinition {
  id: string;
  fieldId: string;
  editorType: "date";
  mode: "range";
  dateFrom: string;
  dateTo: string;
}

interface DatePresetPageFilterDefinition {
  id: string;
  fieldId: string;
  editorType: "date";
  mode: "preset";
  datePreset:
    | "current_week"
    | "last_week"
    | "next_week"
    | "current_month"
    | "last_month"
    | "next_month"
    | "current_quarter"
    | "last_quarter"
    | "next_quarter"
    | "current_year"
    | "last_year"
    | "next_year"
    | "last_12_months"
    | "year_to_date"
    | "greater_than_today"
    | "equal_to_today"
    | "less_than_today"
    | "next_3_days"
    | "next_5_days"
    | "next_7_days";
}
```

Rules:

- `dateFrom` and `dateTo` are required only for `mode = range`
- `datePreset` is required only for `mode = preset`
- stored dates should use ISO calendar format `YYYY-MM-DD`

#### Lookup payload

```ts
interface LookupPageFilterDefinition {
  id: string;
  fieldId: string;
  editorType: "lookup";
  lookupPreset: "contact_lookup" | "company_lookup" | "project_lookup" | "generic_db_lookup";
  clauses: LookupFilterClause[];
}

interface LookupFilterClause {
  id: string;
  clauseKey: string;
  valueMode: "literal" | "dynamic_token" | "boolean_flag";
  value?: string | number | boolean;
  dynamicToken?:
    | "current_user_id"
    | "current_user_company_id"
    | "current_user_division_id"
    | "current_user_company_name"
    | "current_user_division_name"
    | "assigned_projects";
}
```

Rules:

- `clauses` are combined with logical `and`
- `value` is required for `literal`
- `dynamicToken` is required for `dynamic_token`
- `value` should be `true` for `boolean_flag`

Locked initial lookup clause keys by preset:

- `contact_lookup`
  - `contact_job_title`
  - `active_account`
  - `by_user_company`
- `company_lookup`
  - `business_unit_type`
  - `business_unit_name`
  - `main_company_name`
  - `business_unit_scope`
  - `main_company_scope`
- `project_lookup`
  - `business_unit_id`
  - `assigned_projects`

Deferred rule:

- `generic_db_lookup` is allowed as a payload value
- its exact `clauseKey` vocabulary is not locked in the first accepted contract
- the first locked exact clause-key set covers `contact_lookup`, `company_lookup`, and `project_lookup`

### `quickFilters`

Locked root shape:

```ts
interface QuickFilterDefinition {
  id: string;
  fieldId: string;
  operator: "eq";
  value: string;
  label: string;
  color?: string;
}
```

Rules:

- `operator` is locked to `eq` in the first accepted contract
- `label` is the visible chip text
- `color` is optional and should use hex format such as `#0080c0`
- `fieldTitle` should be derived from `fieldId` and not duplicated in the saved payload

## Examples

### Page filter examples

String:

```json
{
  "id": "pf_status",
  "fieldId": "status",
  "editorType": "string",
  "operator": "eq",
  "value": "Draft"
}
```

Date preset:

```json
{
  "id": "pf_date",
  "fieldId": "audit_date",
  "editorType": "date",
  "mode": "preset",
  "datePreset": "current_week"
}
```

Lookup:

```json
{
  "id": "pf_reported_by",
  "fieldId": "reported_by",
  "editorType": "lookup",
  "lookupPreset": "contact_lookup",
  "clauses": [
    {
      "id": "clause_active_account",
      "clauseKey": "active_account",
      "valueMode": "dynamic_token",
      "dynamicToken": "current_user_id"
    },
    {
      "id": "clause_company",
      "clauseKey": "by_user_company",
      "valueMode": "boolean_flag",
      "value": true
    }
  ]
}
```

### Quick filter example

```json
{
  "id": "qf_draft",
  "fieldId": "status",
  "operator": "eq",
  "value": "Draft",
  "label": "Draft",
  "color": "#0080c0"
}
```

## Quick Filters

Legacy `Grid PreFilters` should normalize into compact quick-filter definitions.

Accepted rule:

- quick filters should be edited through a small list dialog, not a textarea
- each quick filter should define:
  - source field
  - filter value
  - display label
  - optional color

This keeps the UX compact while preserving the legacy value of saved list chips.

## Explicit Rejections

Do not use:

- raw SQL-like filter strings as the primary authoring contract
- giant inline filter editors in the main inspector
- plain textareas for quick-filter editing
- checklist-owned corrective-action settings

## Current Locked Position

- `Icon` stores a base64 data image through `iconDataUrl`
- `Corrective Action` is a root view toggle over a platform static model
- root view actions are `Add`, `View`, `Edit`, `Delete`
- list sorting is `field + direction`
- page filters must use a compact summary + modal editor flow inspired by `EXTDB`
- quick filters must be compact and modal-edited, not textarea-based
