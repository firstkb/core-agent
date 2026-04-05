# Collection Table Backend Integration Contract

Backend handoff document for the current collection-table proving surface in `platform-admin-web`.

This document is for backend integration work.

It defines:

- which endpoint surfaces are needed for the current table
- what each endpoint receives
- what each endpoint returns
- what each field means
- which behavior rules the backend must satisfy

It does not prescribe backend code structure or implementation strategy.

## Scope

- current frontend proving surface:
  - `platform/frontend/apps/platform-admin-web/src/pages/modules-list/page.tsx`
- current route:
  - `/modules/list`
- current table id:
  - `module-registry.list`
- current backend consumer:
  - admin app host page

## Boundary

- the universal table runtime must not know literal backend URLs
- the host page owns endpoint mapping
- backend may expose page-owned admin endpoints for this surface
- this document defines the required backend-facing HTTP surface for the current consumer

## Transport Rule

For `platform-admin-web`, requests must not be sent to relative `/app/...` paths directly.

The current admin app transport rule is:

- read `adminApiUrl` from admin runtime config/localStorage
- prepend that base URL to every secure backend path
- call `${adminApiUrl}/app/...`

Example:

- logical backend path:
  - `/app/admin/module-registry/list/meta`
- effective request URL in admin frontend:
  - `${adminApiUrl}/app/admin/module-registry/list/meta`

Current localStorage/runtime key for this base URL:

- `adminApiUrl`

## Required Endpoint Set

For the current proving surface, backend must expose these capabilities:

1. table meta
2. table query
3. search suggestions
4. bulk action execution
5. row action execution
6. favorite toggle
7. saved filter creation
8. export request

Canonical endpoint set for the current admin consumer:

- `GET /app/admin/module-registry/list/meta`
- `POST /app/admin/module-registry/list/query`
- `GET /app/admin/module-registry/list/search-suggestions`
- `POST /app/admin/module-registry/list/bulk-actions/{actionId}`
- `POST /app/admin/module-registry/list/row-actions/{actionId}`
- `POST /app/admin/module-registry/list/favorite/toggle`
- `POST /app/admin/module-registry/list/saved-filters`
- `POST /app/admin/module-registry/list/export-xls`

If the backend uses different literal URLs, the payload contract below is still the required behavior contract.

## Shared Types

### Field Type

Allowed values:

- `text`
- `date`
- `badge`
- `html`

Meaning:

- `text`: plain textual display/search field
- `date`: field searchable through date operators and calendar control
- `badge`: value rendered as a labeled status/tag
- `html`: trusted sanitized markup for display only

### Column Type

Allowed values:

- `text`
- `date`
- `badge`
- `html`
- `actions`

### Search Operator

Allowed values:

- `contains`
- `is_equal_to`
- `is_not_equal_to`
- `is_less_than`
- `is_less_or_equal_to`
- `is_greater_than`
- `is_greater_or_equal_to`
- `is_empty`
- `is_not_empty`

### Badge Tone

Allowed values:

- `neutral`
- `brand`
- `success`
- `warning`
- `danger`
- `info`

## Endpoint 1: Meta

### Purpose

Returns long-lived table metadata:

- title
- field catalog
- column layout
- row actions
- bulk actions
- selection capability
- page actions
- page size options
- saved filters
- favorite state

Frontend loads this on page enter and may reload it when the page explicitly refreshes schema-level state.

### Request

`GET /app/admin/module-registry/list/meta`

No request body required.

Optional request metadata if backend needs it:

- authenticated admin session
- locale
- tenant or module scope if later required by host page

### Response Shape

```json
{
  "surfaceId": "module-registry.list",
  "title": "Module registry",
  "search": {
    "defaultFieldId": "all",
    "placeholder": "Search..."
  },
  "fields": [
    {
      "id": "location",
      "label": "Location",
      "type": "text",
      "searchable": true,
      "sortable": true,
      "suggestable": true
    }
  ],
  "columns": [
    {
      "id": "actions",
      "label": "",
      "type": "actions",
      "width": "14rem",
      "defaultVisible": true
    },
    {
      "id": "location",
      "label": "Location",
      "type": "text",
      "fieldId": "location",
      "defaultVisible": true
    }
  ],
  "rowLayout": {
    "secondaryRowFieldId": "description"
  },
  "actions": {
    "create": { "visible": true },
    "reload": { "visible": true },
    "exportXls": { "visible": true },
    "favorite": { "visible": true, "isFavorite": false }
  },
  "rowActions": [
    { "id": "edit", "kind": "button", "execution": "frontend" },
    { "id": "view", "kind": "button", "execution": "frontend" },
    { "id": "pdf", "kind": "button", "execution": "backend" }
  ],
  "selection": {
    "enabled": true,
    "mode": "multi",
    "columnPosition": "leading"
  },
  "bulkActions": [
    { "id": "activate", "label": "Active", "kind": "state-change", "tone": "success" },
    { "id": "archive", "label": "Archive", "kind": "custom", "tone": "neutral" }
  ],
  "pageSizeOptions": [25, 50, 100],
  "savedFilterSets": [
    {
      "id": "sf_1",
      "label": "Completed records",
      "quickFilters": [
        {
          "fieldId": "status",
          "operator": "is_equal_to",
          "value": "Complete"
        }
      ]
    }
  ]
}
```

Notes:

- if `rowActions` is non-empty and backend omits a dedicated `actions` column, the current frontend runtime injects a leading actions column automatically
- backend may still send an explicit `actions` column when it wants to control the width or placement more directly
- for the current accepted runtime, status changes are not inline per-row checkbox mutations
- if backend wants `Set active` / `Set inactive`, it must enable `selection` and expose those ids through `bulkActions`

### Field Descriptions

#### Top Level

- `surfaceId`: stable id for the table surface; for this page it must be `module-registry.list`
- `title`: business surface title
- `search`: default search shell metadata
- `fields`: canonical searchable/sortable field catalog
- `columns`: visible table layout
- `rowLayout`: optional extra row layout metadata
- `actions`: page-level action capabilities
- `rowActions`: row action definitions shared across all rows
- `selection`: selection capability metadata
- `bulkActions`: allowed bulk actions for selected rows
- `pageSizeOptions`: allowed page sizes
- `savedFilterSets`: currently saved reusable quick-filter sets

#### `search`

- `defaultFieldId`: searchable field id or the pseudo-option `all`
- `placeholder`: input placeholder text

#### `fields[]`

- `id`: stable field id, used by search, sort, cells, and row layout
- `label`: business label for the field
- `type`: one of the allowed field types
- `searchable`: whether frontend may show this field in the search field selector
- `sortable`: whether frontend may sort by this field
- `suggestable`: whether this field may participate in suggestion loading

#### `columns[]`

- `id`: stable column id
- `label`: header label
- `type`: one of the allowed column types
- `fieldId`: required for non-`actions` columns; points to a field or cell id used in `rows[].cells`
- `width`: optional presentation width string
- `defaultVisible`: whether the column is visible by default
- when `rowActions` is present, `actions` is recommended but no longer strictly required for the current admin frontend; the runtime can inject it automatically

#### `rowLayout`

- `secondaryRowFieldId`: optional field id whose cell content is rendered as a dedicated secondary full-width row

#### `actions`

- `create.visible`: page may show `Start New`
- `reload.visible`: page may show `Reload`
- `exportXls.visible`: page may show `Export XLS`
- `favorite.visible`: page may show `Favorite`
- `favorite.isFavorite`: current favorite state for this surface
- any built-in action may also include `label` if backend wants to override built-in frontend wording
- current admin app create-route contract:
  - if `create.visible = true`, the host page opens `/modules/edit/new`

#### `rowActions[]`

- `id`: stable row action id
- `kind`: currently `button`
- `execution`:
  - `frontend`: action is handled by page-owned frontend flow
  - `backend`: action requires backend call
- `label`: optional explicit business label
- current admin app route contract:
  - `id = "edit"` with `execution = "frontend"` opens `/modules/edit/{row.id}`
  - this is handled by the app host, not by the table runtime

#### `selection`

- `enabled`: whether row selection is available
- `mode`: currently `multi`
- `columnPosition`: currently `leading`

#### `bulkActions[]`

- `id`: stable bulk action id
- `kind`: action class, currently `state-change` or `custom`
- `label`: required explicit label; frontend does not localize bulk-action button text
- `tone`: optional semantic text-color hint for the frontend bulk-action button; it affects text color only
- current accepted ids for status change are `activate` and `deactivate`

#### `savedFilterSets[]`

- `id`: stable saved filter id
- `label`: user-visible saved filter name
- `quickFilters`: quick filters applied when this set is selected

## Endpoint 2: Query

### Purpose

Returns paginated rows for the current table state.

Frontend calls this when:

- page changes
- page size changes
- sort changes
- quick filters change
- a saved filter set is applied
- a table refresh is explicitly requested

### Request

`POST /app/admin/module-registry/list/query`

```json
{
  "filters": {},
  "page": 1,
  "pageSize": 25,
  "presetId": "all",
  "quickFilters": [
    {
      "fieldId": "location",
      "operator": "contains",
      "value": "gate"
    }
  ],
  "sort": {
    "columnId": "date",
    "direction": "desc"
  }
}
```

### Request Field Descriptions

- `filters`: route-level or preset-level filters; current proving surface may send `{}` but backend must accept it
- `page`: 1-based page number requested by frontend
- `pageSize`: requested page size; must be one of values allowed by `pageSizeOptions`
- `presetId`: current preset id; current proving surface uses `all`
- `quickFilters`: active quick-filter tokens from search shell
- `sort.columnId`: current column/field id used for sorting
- `sort.direction`: `asc` or `desc`

### `quickFilters[]` Item

- `fieldId`: searchable field id or `all`
- `operator`: one of the allowed search operators
- `value`: comparison value; may be empty only for `is_empty` and `is_not_empty`

### Response

```json
{
  "page": 1,
  "pageSize": 25,
  "totalItems": 300,
  "totalPages": 12,
  "rows": [
    {
      "id": "record-001",
      "selectable": true,
      "cells": {
        "location": { "value": "Entry gate" },
        "description": { "value": "Latch inspection and access control handoff recorded." },
        "reported": { "value": "Alex T." },
        "date": { "value": "2026-02-14", "displayValue": "2/14/2026" },
        "status": { "value": "complete", "label": "Complete", "tone": "success" },
        "is_active": { "value": true, "label": "Active" },
        "type": { "value": "Satisfactory" }
      }
    }
  ]
}
```

### Response Field Descriptions

- `page`: effective page returned by backend after clamping
- `pageSize`: effective page size
- `totalItems`: full result count for the current query
- `totalPages`: total page count for the current query
- `rows`: page slice of row results

### `rows[]`

- `id`: stable row id
- `selectable`: whether row may be selected for bulk actions
- `cells`: dictionary keyed by field id or cell id used by columns/rowLayout

### `cells`

Each cell may contain:

- `value`: required raw value
- `displayValue`: optional rendered text, usually for dates or formatted values
- `label`: optional label for badge-like or enum-like values
- `tone`: optional badge tone for `badge` fields
- `html`: optional trusted sanitized markup for `html` fields

### Query Rules

- if requested `page` is out of range, backend must clamp it and return the effective page in `response.page`
- `totalPages` must be at least `1`
- `rows[].cells` must include all fields required by `columns` and `rowLayout`
- `html` cells must contain sanitized trusted markup only

## Endpoint 3: Search Suggestions

### Purpose

Returns grouped suggestions for suggestable search fields.

Frontend behavior:

- reuses compatible cached suggestions from `sessionStorage` when available
- revalidates suggestions once per fresh meta/page visit on the first search focus/open
- filters suggestions locally between backend refreshes

### Request

`GET /app/admin/module-registry/list/search-suggestions`

No request body required.

### Response

```json
{
  "groups": [
    {
      "fieldId": "location",
      "label": "Location",
      "items": [
        { "value": "Entry gate", "count": 12 },
        { "value": "Loading dock", "count": 8 }
      ]
    },
    {
      "fieldId": "reported",
      "label": "Reported",
      "items": [
        { "value": "Alex T.", "count": 21 }
      ]
    }
  ]
}
```

### Response Field Descriptions

- `groups`: suggestions grouped by field
- `groups[].fieldId`: suggestable field id
- `groups[].label`: group label shown in `All` mode
- `groups[].items[].value`: suggested value
- `groups[].items[].count`: optional occurrence count

Adapter normalization rule:

- backend HTTP payload may omit `groups[].items[].fieldId`
- backend HTTP payload may omit `groups[].items[].id`
- host-page adapter must normalize each item to include:
  - `fieldId`: inherited from `groups[].fieldId`
  - `id`: stable derived id from field + value

### Suggestion Rules

- backend should return only fields where `suggestable: true`
- grouped response must be complete enough for one-session local filtering
- backend should not require frontend to call this endpoint on every keystroke

## Endpoint 4: Bulk Action Execution

### Purpose

Executes a bulk action against selected row ids from the current visible page.

### Request

`POST /app/admin/module-registry/list/bulk-actions/{actionId}`

Path parameter:

- `actionId`: one of ids declared in `meta.bulkActions`

Body:

```json
{
  "query": {
    "filters": {},
    "page": 2,
    "pageSize": 25,
    "presetId": "all",
    "quickFilters": [
      {
        "fieldId": "status",
        "operator": "is_equal_to",
        "value": "Open"
      }
    ],
    "sort": {
      "columnId": "date",
      "direction": "desc"
    }
  },
  "rowIds": ["record-021", "record-022"]
}
```

### Request Field Descriptions

- `query`: current table query state at the moment of action
- `rowIds`: selected visible row ids

### Response

Accepted current response:

- `200 OK` with empty body

Optional response body if backend wants to return status:

```json
{
  "ok": true
}
```

### Current Bulk Action Ids

- `activate`
- `deactivate`

### Rules

- backend must treat `rowIds` as the source of truth for affected rows
- no cross-page implicit selection should be assumed
- after a successful bulk action, frontend re-runs the current `query` so changed cell values are reflected immediately

## Endpoint 5: Row Action Execution

### Purpose

Executes a backend-managed row action.

This endpoint is used only for row actions where `execution = "backend"`.

Examples of backend-managed row actions:

- `pdf`
- `archive`

### Request

`POST /app/admin/module-registry/list/row-actions/{actionId}`

Path parameter:

- `actionId`: one of ids declared in `meta.rowActions` where `execution = "backend"`

Body:

```json
{
  "rowId": "record-001"
}
```

### Response

Accepted current response options:

Option A:

```json
{
  "downloadUrl": "https://example.test/downloads/report-001.pdf"
}
```

Option B:

```json
{
  "ok": true
}
```

### Rules

- frontend provides `actionId + rowId`
- frontend-managed actions such as `Edit` do not call this endpoint
- backend must not require table runtime to know any additional endpoint shape
- if `pdf` returns a URL, it must be a ready-to-use download target

## Endpoint 6: Favorite Toggle

### Purpose

Toggles whether the current table surface is marked as favorite for the current user/context.

### Request

`POST /app/admin/module-registry/list/favorite/toggle`

No request body required for the current phase.

### Response

```json
{
  "isFavorite": true
}
```

### Rules

- response must contain the effective favorite state after mutation
- toggling favorite must not require re-querying table rows
- after a successful toggle, the host app may re-fetch `/app/me/navigation` so shell favorites stay in sync with the current backend state

## Endpoint 7: Saved Filter Creation

### Purpose

Creates one saved quick-filter set for the current table surface.

### Request

`POST /app/admin/module-registry/list/saved-filters`

```json
{
  "label": "Open gate issues",
  "quickFilters": [
    {
      "fieldId": "location",
      "operator": "contains",
      "value": "gate"
    },
    {
      "fieldId": "status",
      "operator": "is_equal_to",
      "value": "Open"
    }
  ]
}
```

### Response

```json
{
  "id": "sf_9",
  "label": "Open gate issues",
  "quickFilters": [
    {
      "fieldId": "location",
      "operator": "contains",
      "value": "gate"
    },
    {
      "fieldId": "status",
      "operator": "is_equal_to",
      "value": "Open"
    }
  ]
}
```

### Rules

- returned shape must match `savedFilterSets[]` items from meta
- label uniqueness rules may be enforced by backend or frontend or both

## Endpoint 8: Export XLS

### Purpose

Starts or resolves export for the current table query state.

### Request

`POST /app/admin/module-registry/list/export-xls`

```json
{
  "query": {
    "filters": {},
    "page": 1,
    "pageSize": 25,
    "presetId": "all",
    "quickFilters": [
      {
        "fieldId": "status",
        "operator": "is_equal_to",
        "value": "Complete"
      }
    ],
    "sort": {
      "columnId": "date",
      "direction": "desc"
    }
  }
}
```

### Response

Accepted current response options:

Option A:

```json
{
  "downloadUrl": "https://example.test/downloads/module-registry-export.xlsx"
}
```

Option B:

```json
{
  "ok": true
}
```

## Required Behavior Rules

### Search

- backend must not send one global operators list
- frontend derives allowed operators from `fields[].type`
- backend must expose `fields[]` as the source of truth
- `all` is a frontend pseudo-option and must not be required as a backend field

### Sorting

- backend must accept `sort.columnId` values that correspond to metadata declared in `fields[]` and `columns[]`
- if a field is not sortable, backend may reject or ignore the sort

### Selection

- backend must not infer selection from any data field name such as `is_active`
- selection capability is driven only by `meta.selection`

### HTML Cells

- `html` content must be sanitized trusted markup
- forbidden content includes:
  - scripts
  - forms
  - inline event handlers
  - layout-breaking interactive markup

### Labels

Backend owns:

- surface title when business-defined
- column labels
- field labels
- saved filter names
- row values
- business labels that may vary by module or tenant

Frontend may localize built-in runtime labels:

- `Reload`
- `Export XLS`
- `Favorite`
- `Save filter set`
- `Reset filters`
- built-in row action labels when backend omits them for known ids such as `edit`, `view`, `pdf`

## Error Contract

This surface currently needs predictable HTTP-level behavior.

Minimum requirement:

- `2xx`: successful operation
- `4xx`: invalid request, invalid action id, validation failure, or unauthorized action
- `5xx`: unexpected backend failure

Recommended error body shape for all non-`2xx` responses:

```json
{
  "error": {
    "code": "collection_table_invalid_request",
    "message": "Human-readable error message"
  }
}
```

## Current Expected Field Catalog For Module Registry Proving Surface

Current expected ids:

- `location`
- `description`
- `reported`
- `inspector`
- `date`
- `status`
- `is_active`
- `type`

Current expected visible columns:

- `actions`
- `location`
- `reported`
- `date`
- `status`
- `type`

Current expected secondary row field:

- `description`

## Minimal End-To-End Example

1. Frontend loads:
- `GET /app/admin/module-registry/list/meta`

2. Backend returns:
- field catalog
- columns
- actions
- row actions
- bulk actions
- favorite state
- saved filter sets

3. Frontend queries first page:
- `POST /app/admin/module-registry/list/query`

4. Backend returns:
- effective page
- totalItems
- totalPages
- rows with `cells`

5. Frontend toggles favorite:
- `POST /app/admin/module-registry/list/favorite/toggle`

6. Backend returns:
- `isFavorite`

7. Host frontend refreshes shell navigation:
- `GET /app/me/navigation`

8. Frontend executes `pdf` on row:
- `POST /app/admin/module-registry/list/row-actions/pdf`

9. Backend returns:
- download result or success status
