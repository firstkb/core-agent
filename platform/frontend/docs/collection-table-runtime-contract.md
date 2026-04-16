# Collection Table Runtime Contract

Living working document for the universal collection-table preset currently being shaped in `platform-admin-web`.

This document captures the accepted intermediate state, the current frontend contract, the expected backend contract, and the rule for later promotion into a shared package.

## Current Scope

- current proving surface: `apps/platform-admin-web/src/pages/modules-list/page.tsx`
- current route: `/modules/list`
- current implementation status: app-local proving surface
- current extraction status: not approved for shared packaging yet

## Why This Stays App-Local For Now

- the table shell is being actively refined with product-level decisions still changing
- the toolbar, saved-filter behavior, and backend metadata contract are not stable yet
- per `package-boundaries.md`, screen-specific toolbars, route-specific filters, and workflow compositions stay in app code until product contracts are approved
- promotion to shared should happen only after the table is accepted and reused by at least one more app

## Accepted UI State

### Layout

- desktop:
  - page uses a fixed-height card inside the available shell area
  - the card itself should not scroll vertically
  - only the table content area scrolls vertically
  - table stays horizontally scrollable when columns overflow
- mobile:
  - card height follows content
  - page scroll stays normal
  - horizontal table scroll is allowed

### Card Structure

- top area:
  - dynamic-height toolbar above the table
- middle area:
  - table with sticky header on desktop
- footer:
  - `TablePaginationBar`
  - page-size options: `25`, `50`, `100`

### Row Actions

- the table supports a leading `actions` column
- row actions are part of the universal contract and must not be hardcoded only in page-local rendering
- accepted first row-action labels:
  - `Edit`
  - `View`
  - `PDF`
- backend should define row actions once for the whole table surface
- frontend should render the same action set for every row in the provided order
- current accepted rule:
  - row actions are table-level metadata, not row-level metadata
  - action execution uses `actionId + rowId`
- current execution split:
  - `Edit` is frontend-managed
  - `View` is frontend-managed
  - `PDF` is backend-managed and requires a page-owned backend call
- row actions may later expand, so the contract must support one, two, or more actions per row without changing the table primitive
- accepted runtime presentation:
  - desktop:
    - built-in row actions render as separate buttons inside the leading action column
  - mobile:
    - built-in row actions collapse into one overflow trigger (`...`)
    - the mobile trigger should not read as a bordered button chip
    - the action column may shrink to a compact icon-width presentation

### Column Layout

- the table should expose one shared field catalog for the whole surface
- the table should expose one visible `columns` layout for the surface
- accepted field/column types now include:
  - `text`
  - `date`
  - `badge`
  - `actions`
  - `html`
- a field may be:
  - rendered as a normal standalone column
  - hidden as a standalone column but rendered as secondary text inside another column
  - hidden as a standalone column but rendered as a full-width secondary row under the primary row
  - hidden visually but still available in search
- current accepted rule:
  - the backend should describe cell layout at the column level
  - the frontend should not need named table formats like `Location view` or `Inspector view`
- for the current use case, the main extra layout requirement is:
  - a visible column may render a primary field on line 1 and a secondary field on line 2
  - or a row may expose a dedicated secondary description row spanning the table content width
- this should be described by row/column layout metadata, not by inventing global table-view names
- `html` is an allowed escape hatch for trusted backend-rendered display content when one visual block must combine multiple values, for example:
  - line 1 bold
  - line 2 secondary text
- current accepted rule for `html`:
  - backend must send sanitized trusted markup only
  - no scripts, forms, inline event handlers, or layout-breaking markup
  - sort and search should continue to use the underlying source fields, not the rendered html fragment itself
  - prefer normal `text` plus `secondaryRowFieldId` first; use `html` only when backend must fully control the rich cell content

### Toolbar

- desktop primary row:
  - optional `Start New` primary button
  - unified search shell:
    - search icon segment
    - search field selector
    - operator selector derived from selected field type
    - search input, which may switch control type by selected field type
  - desktop action cluster rendered as separate icon buttons:
    - `Favorite`
    - `Saved filters`
    - `Reload`
    - `Export XLS`
- mobile primary row:
  - `Start New` is centered above the card
  - inside the card, the search shell remains compact
  - search icon segment is hidden on mobile to preserve space for `field + input`
  - `Favorite` remains visible as a dedicated icon button
  - utility actions stay behind the overflow menu (`...`)
  - operator selector is hidden on mobile
- secondary row:
  - active filter tokens
  - `Reset filters`
  - `Save filter set`
- accepted current date-field presentation inside the unified search shell:
  - date uses the shared calendar picker
  - in the compact inline toolbar variant, the trailing calendar icon may be hidden
  - clicking the field body still opens the calendar

### Selection And Bulk Actions

- checkbox selection is a table-surface capability, not a generic meaning of `*_active`
- selection must be enabled explicitly by backend metadata
- frontend must not infer selection or bulk-state behavior from a column name like `is_active`
- desktop:
  - selection checkbox column is leading
  - when 1+ rows are selected, a floating bulk-action bar appears
  - accepted first bulk actions:
    - `Set active`
    - `Set inactive`
- mobile:
  - selection still happens inside the leading checkbox column
  - bulk actions should use a compact bottom action bar rather than a third toolbar row
- current phase-1 rule:
  - selection applies only to visible row ids in the current page
  - no `select all filtered results across pages` behavior yet
- rows may still expose an `Active` display column, but state changes happen through bulk actions, not inline checkbox mutation
- current bulk-action presentation rule:
  - backend may send `bulkActions[].tone`
  - tone affects text color only
  - current accepted tone values:
    - `brand`
    - `danger`
    - `info`
    - `neutral`
    - `success`
    - `warning`
  - `neutral` uses the default outline button text color

### Planned Next Capability: Bulk Edit

This is not part of the accepted current runtime yet.

Current intention for a later phase:

- when backend metadata says bulk edit is supported, the bulk bar may expose `Edit`
- initial future direction:
  - clicking `Edit` should open a modal with:
    - one bulk-edit form surface
    - `Cancel`
    - `Save`
- the actual field editor UI is intentionally deferred until the universal form-builder/runtime exists

Planned contract direction:

- backend should explicitly enable bulk edit
- backend should explicitly declare which fields are eligible for bulk edit
- frontend must not infer bulk-editable fields from normal table columns automatically

Planned metadata shape:

```json
{
  "selection": {
    "enabled": true,
    "mode": "multi",
    "columnPosition": "leading"
  },
  "bulkActions": [
    { "id": "activate", "label": "Set active", "kind": "state-change" },
    { "id": "deactivate", "label": "Set inactive", "kind": "state-change" }
  ],
  "bulkEdit": {
    "enabled": true,
    "label": "Edit",
    "fields": [
      { "id": "status", "label": "Status", "type": "enum" },
      { "id": "reported", "label": "Reported", "type": "text" }
    ]
  }
}
```

Planned interaction rule:

- selection still happens first through row checkboxes
- if `bulkEdit.enabled` is true, the bulk bar may show `Edit`
- pressing `Edit` opens the modal shell only
- final form schema, validation rules, and save payload are postponed until the universal form-builder contract is available

### Search And Filter Behavior

- backend should not send one global `operators[]` list for the whole table
- frontend should derive allowed operators from the selected field type
- backend should expose searchable field ids plus field types through the shared field catalog
- current accepted first rule:
  - `text` fields:
    - `contains`
    - `is equal to`
    - `is not equal to`
    - `is empty`
    - `is not empty`
  - `date` fields:
    - `is equal to`
    - `is less than`
    - `is less or equal to`
    - `is greater than`
    - `is greater or equal to`
    - `is empty`
    - `is not empty`
- date fields should use the shared calendar picker from the ui-kit instead of a plain text input
- current input-control rule:
  - `text` fields use the standard text input
  - `date` fields use the shared calendar picker
- search suggestions are an optional capability for text-like suggestable fields
- `date` fields stay on the calendar control and do not use suggestion dropdowns
- accepted suggestion-loading rule:
  - load grouped suggestions lazily on the first interaction with the search shell
  - reuse compatible cached suggestions from `sessionStorage` immediately when available
  - revalidate suggestions once for each fresh meta/page visit when the user first focuses or opens the search shell
  - keep the latest compatible suggestion dictionary cached on frontend for the current table session
- accepted suggestion-display rule:
  - if the selected search field is `All`, suggestions are shown grouped by field
  - if the selected search field is a concrete field, only that field's suggestions are shown
  - frontend filters the current grouped suggestions locally while the user types
- accepted first interaction rule:
  - clicking a suggestion immediately creates a token and applies the filter
  - `Enter` applies the highlighted suggestion if one is highlighted
  - otherwise `Enter` applies the raw typed value
  - `Esc` closes the suggestion surface
- search does not apply on every field/operator change
- a text quick filter is created only when the user presses `Enter`
- operators that do not require a value (`is empty`, `is not empty`) are also confirmed through `Enter`
- a date quick filter is created when the user selects a date from the calendar
- after `Enter`, the input is cleared
- after date selection, the date field is cleared
- `contains` is hidden in the token label
- repeated `contains` filters on the same field collapse into one visual token and preserve insertion order in the label, for example `[Module] Emp, Tenant`
- repeated `contains` filters on the same field keep their individual quick-filter entries in state and saved-filter storage, but the runtime treats them as one OR-group for display and query semantics
- comparison operators are rendered as symbols
- token examples:
  - `[Location] dock`
  - `[Module] Emp, Tenant`
  - `[Status] = Complete`

### Empty And Loading States

- table header remains visible during loading
- loading uses inline skeleton rows inside the table body
- empty results show a compact inline row: `No records found`
- the table does not switch to a large empty-state panel during no-result search

### Overflow Menu

- desktop:
  - not used for utility actions anymore
- mobile:
  - `Reload`
  - `Export XLS`
  - separator
  - `Saved filters`

### Saved Filter Set UX

- `Save filter set` opens a dialog
- dialog currently contains:
  - title: `Set Filter Name`
  - one input
  - two buttons
- saving is blocked when the name is empty or duplicates an existing saved filter name
- saved filters appear in the overflow menu
- saved filter sets persist the underlying `quickFilters[]` entries exactly as authored; grouped `contains` tokens are rebuilt by the runtime when the set is reapplied

### Favorite UX

- `Favorite` is a page-level action, not a row action
- desktop:
  - shown as a dedicated star icon button in the toolbar action cluster
- mobile:
  - shown as a dedicated visible star icon button next to the overflow trigger
- active state should read as a filled yellow star without an additional background pill

## Label Ownership And Localization

Current accepted rule:

- frontend localizes only universal table-runtime chrome
- backend owns business/domain labels and row content
- if a label changes the meaning of the surface, it should not live only on frontend

### Safe To Translate Only On Frontend

These labels can be kept in frontend locale files and rendered from built-in ids:

- generic toolbar actions:
  - `Start New`
  - `Reload`
  - `Export XLS`
  - `Saved filters`
  - `Save filter set`
  - `Reset filters`
  - `Favorite`
- generic row actions when their ids are built-in and semantics are fixed:
  - `Edit`
  - `View`
  - `PDF`
- search runtime labels:
  - `All`
  - `Search...`
  - `Select date`
  - `Press Enter to apply`
  - `Contains`
  - `Is equal to`
  - `Is not equal to`
  - `Is less than`
  - `Is less or equal to`
  - `Is greater than`
  - `Is greater or equal to`
  - `Is empty`
  - `Is not empty`
- pagination and collection-status labels:
  - `Rows per page`
  - `entry`
  - `entries`
  - `No records found`
  - `selected`
- dialog labels:
  - `Set Filter Name`
  - `Save`
  - `Cancel`
- built-in utility and overflow labels:
  - `More actions`
  - `Open table actions`
  - `Open saved filters`
  - `Open row actions`

### Must Stay Backend-Owned

These labels should come from backend because they describe the business surface itself:

- page title and surface title when the page is backend-driven
- sidebar/menu titles that come from backend-defined modules
- column labels
- search field labels
- domain-specific action labels
- bulk-action labels
- saved filter names
- badge/status labels rendered from data
- row values and description text
- any label that may differ across tenants, modules, or product domains

### Hybrid Rule

For actions and controls with known built-in ids, backend may omit the label and frontend should localize it.

Example:

```json
{
  "actions": {
    "reload": { "visible": true },
    "exportXls": { "visible": true }
  },
  "rowActions": [
    { "id": "edit", "kind": "button", "execution": "frontend" },
    { "id": "view", "kind": "button", "execution": "frontend" },
    { "id": "pdf", "kind": "button", "execution": "backend" }
  ]
}
```

If backend wants a custom business label, backend must send it explicitly.

Example:

```json
{
  "actions": {
    "create": { "visible": true, "label": "Start Inspection" }
  }
}
```

### Recommended Contract Direction

- for built-in runtime controls, prefer `id` plus frontend localization
- for business-defined controls, prefer explicit backend `label`
- avoid translating backend-owned domain labels in frontend locale files because that creates drift between data, menu configuration, and UI behavior

## Current Frontend Contract

Current app-local split in the proving surface:

- `apps/platform-admin-web/src/shared/collection-page.ts`
  - render-time composition only
  - still contains React render callbacks such as `renderCell`
- `apps/platform-admin-web/src/shared/collection-table-contract.ts`
  - backend-facing DTO and adapter contract
- `apps/platform-admin-web/src/shared/collection-table-state.ts`
  - normalized query state plus `sessionStorage` helpers

`collection-page.ts` is useful for local rendering, but it cannot be sent directly from the backend because it contains UI callbacks and render functions such as:

- `renderCell`
- `getSortValue`
- `onSelect`

Current normalized app-local query shape:

```ts
type CollectionTableQueryRequest = {
  filters: Record<string, string>;
  page: number;
  pageSize: number;
  presetId: string;
  quickFilters: Array<{
    fieldId: string;
    operator: CollectionTableSearchOperator;
    value: string;
  }>;
  sort: {
    columnId: string | null;
    direction: "asc" | "desc";
  };
};
```

This is now close to the accepted backend request. The remaining split is:

- the render surface is still app-local
- generic cell rendering is still mapped inside the admin proving page
- toolbar composition still lives in app code and is not shared-ready yet

## Recommended Data Contract

The data contract should be split into:

- `meta`
- `query`

### 1. Meta Payload

The consuming page should load schema and long-lived metadata once, using whatever backend endpoint that page owns.

Recommended response shape:

```json
{
  "surfaceId": "module-registry.list",
  "title": "List",
  "search": {
    "placeholder": "Search...",
    "defaultFieldId": "all"
  },
  "fields": [
    { "id": "location", "label": "Location", "type": "text", "sortable": true, "searchable": true, "suggestable": true },
    { "id": "description", "label": "Description", "type": "text", "sortable": false, "searchable": true, "suggestable": false },
    { "id": "location_summary_html", "label": "Location summary", "type": "html", "sortable": false, "searchable": false, "suggestable": false },
    { "id": "reported", "label": "Reported", "type": "text", "sortable": true, "searchable": true, "suggestable": true },
    { "id": "inspector", "label": "Inspector", "type": "text", "sortable": true, "searchable": true, "suggestable": true },
    { "id": "date", "label": "Date", "type": "date", "sortable": true, "searchable": true, "suggestable": false },
    { "id": "status", "label": "Status", "type": "badge", "sortable": true, "searchable": true, "suggestable": true },
    { "id": "is_active", "label": "Active", "type": "badge", "sortable": true, "searchable": false, "suggestable": false },
    { "id": "type", "label": "Type", "type": "text", "sortable": true, "searchable": true, "suggestable": true }
  ],
  "columns": [
    { "id": "actions", "label": "", "type": "actions", "width": "14rem" },
    { "id": "location", "label": "Location", "type": "text", "fieldId": "location" },
    { "id": "reported", "label": "Reported", "type": "text", "fieldId": "reported" },
    { "id": "date", "label": "Date", "type": "date", "fieldId": "date" },
    { "id": "status", "label": "Status", "type": "badge", "fieldId": "status" },
    { "id": "type", "label": "Type", "type": "text", "fieldId": "type" }
  ],
  "rowLayout": {
    "secondaryRowFieldId": "description"
  },
  "defaultSort": { "columnId": "date", "direction": "desc" },
  "actions": {
    "create": { "visible": true, "label": "Start New" },
    "reload": { "visible": true },
    "exportXls": { "visible": true },
    "favorite": { "visible": true, "isFavorite": false }
  },
  "rowActions": [
    { "id": "edit", "label": "Edit", "kind": "button", "execution": "frontend" },
    { "id": "view", "label": "View", "kind": "button", "execution": "frontend" },
    { "id": "pdf", "label": "PDF", "kind": "button", "execution": "backend" }
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
  "bulkEdit": {
    "enabled": false,
    "fields": []
  },
  "pageSizeOptions": [25, 50, 100],
  "savedFilterSets": [
    {
      "id": "sf_1",
      "label": "Completed records",
      "quickFilters": [
        { "fieldId": "status", "operator": "is_equal_to", "value": "Complete" }
      ]
    }
  ]
}
```

Operator options should be derived in frontend from the selected field type, using the top-level field catalog as the source of truth.

The current accepted rule is:

- backend sends one shared `fields[]` catalog
- each field declares whether it is `searchable`
- each field may optionally declare whether it is `suggestable`
- `search.defaultFieldId` may point to a searchable field id or to the frontend pseudo-option `all`
- frontend builds the search dropdown from `fields[]` where `searchable: true`
- frontend injects the special `All` option locally and should not require backend to send it as a normal field
- frontend resolves:
  - allowed operators
  - matching input control
  - built-in operator labels
  - whether suggestions are supported for the selected field

Optional trusted html field example:

```json
{
  "fields": [
    { "id": "location", "label": "Location", "type": "text", "sortable": true, "searchable": true },
    { "id": "description", "label": "Description", "type": "text", "sortable": false, "searchable": true },
    { "id": "location_summary_html", "label": "Location summary", "type": "html", "sortable": false, "searchable": false }
  ],
  "columns": [
    { "id": "actions", "label": "", "type": "actions", "width": "14rem" },
    { "id": "location_summary", "label": "Location", "type": "html", "fieldId": "location_summary_html" },
    { "id": "reported", "label": "Reported", "type": "text", "fieldId": "reported" },
    { "id": "date", "label": "Date", "type": "date", "fieldId": "date" },
    { "id": "status", "label": "Status", "type": "badge", "fieldId": "status" }
  ]
}
```

Example row value for the trusted html field:

```json
{
  "rows": [
    {
      "id": "record-001",
      "cells": {
        "location_summary_html": {
          "value": "<strong>POWER TOOLS</strong><br/>All power cords/cord sets in good condition"
        }
      }
    }
  ]
}
```

### 2. Query Payload

The consuming page should call its own backend endpoint for rows and pagination, then pass the normalized response into the shared table runtime.

Recommended request shape:

```json
{
  "page": 1,
  "pageSize": 25,
  "sort": {
    "columnId": "date",
    "direction": "desc"
  },
  "quickFilters": [
    {
      "fieldId": "location",
      "operator": "contains",
      "value": "gate"
    }
  ]
}
```

Recommended response shape:

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

## Host Page Adapter

The universal table should not know literal endpoint paths.

Accepted rule:

- the consuming page owns routing
- the consuming page knows which backend endpoint to call
- the shared table consumes normalized operations through a host-provided adapter

### Preferred Frontend Adapter Contract

The shared table should depend on operations like these, not on URLs:

```ts
type CollectionTableAdapter = {
  loadMeta: () => Promise<CollectionMetaResponse>;
  query: (request: CollectionQueryRequest) => Promise<CollectionQueryResponse>;
  loadSearchSuggestions?: () => Promise<CollectionSearchSuggestionsResponse>;
  runBulkAction?: (input: CollectionBulkActionRequest) => Promise<void>;
  runRowAction?: (input: CollectionRowActionRequest) => Promise<void | CollectionRowActionResult>;
  downloadRowPdf?: (rowId: string) => Promise<void | { downloadUrl: string }>;
  createSavedFilterSet?: (input: SavedFilterSetCreateInput) => Promise<SavedFilterSet>;
  updateSavedFilterSet?: (filterId: string, input: SavedFilterSetUpdateInput) => Promise<SavedFilterSet>;
  deleteSavedFilterSet?: (filterId: string) => Promise<void>;
  toggleFavorite?: () => Promise<{ isFavorite: boolean }>;
  exportXls?: (request: CollectionExportRequest) => Promise<void | { downloadUrl: string }>;
};
```

Optional suggestion payload shape:

```ts
type CollectionSearchSuggestionsResponse = {
  groups: Array<{
    fieldId: string;
    label: string;
    items: Array<{
      value: string;
      count?: number;
    }>;
  }>;
};
```

Accepted rule:

- this capability is page-owned and optional
- the host page may call `loadSearchSuggestions` once on the first search-shell interaction
- frontend may cache that response in `sessionStorage` by `tableId`
- after the first successful load, frontend filters suggestions locally and should not re-query backend for that feature during the same session

### Accepted Ownership Rule

- `tenant` pages may point the adapter at tenant-specific endpoints
- `admin` pages may point the adapter at admin-specific endpoints
- a static admin page like `List of Modules` still owns its own endpoint mapping
- the shared table must stay blind to those route details
- backend payload shape is part of the table contract
- backend URL shape is part of the host page integration, not the shared table contract

## State Persistence And Reset

The accepted simple runtime model is:

- persist table runtime state in `sessionStorage`
- scope persisted state by `tableId`
- reset only the current table state when the route carries `?reset=1`

### What To Persist

- `page`
- `pageSize`
- `sortColumnId`
- `sortDirection`
- active quick-filter tokens
- active preset id
- optional current search field/operator

### What Not To Persist

- selected row ids
- loading state
- error state
- open menus or dialogs
- draft input text before the filter is committed

### Recommended Storage Shape

Per-table key:

```ts
const storageKey = `collection-table-state:${tableId}`;
```

Example payload:

```json
{
  "queryState": {
    "page": 2,
    "pageSize": 25,
    "presetId": "all",
    "sortColumnId": "date",
    "sortDirection": "desc",
    "filters": {},
    "quickFilters": [
      { "fieldId": "status", "operator": "is_equal_to", "value": "Complete" }
    ]
  },
  "draftSearchFieldId": "date",
  "draftSearchOperator": "is_less_than"
}
```

### Reset Rule

- if the page opens with `?reset=1`, clear the `sessionStorage` entry for the current `tableId`
- then restore the table to default state
- then remove `reset=1` from the URL with `replace`

### Navigation Rule

- `Edit/View -> Back` should restore the in-session table state
- sidebar or breadcrumb navigation should point to the canonical route with `?reset=1`
- each table keeps its own `sessionStorage` key; do not reuse one global state object for every table

## Loading Rules

- load `meta` once on page enter
- do not reload field catalog, columns, page-size options, or saved filter sets on every pagination change
- call `query` when:
  - page changes
  - page size changes
  - sort changes
  - quick filters change
  - a saved filter set is applied
- after every successful `query`, reconcile selected row ids against the returned visible/selectable rows
- clear current row selection when:
  - page changes
  - page size changes
  - sort changes
  - quick filters change
  - a saved filter set is applied
- after a successful bulk action, frontend should re-run the current `query`
- `Reload` should usually repeat `query`
- `Reload` may also re-fetch `meta` only when schema invalidation is needed
- after a successful favorite toggle, shared runtime should update the local favorite state first
- any shell or app-level follow-up after favorite toggle should happen through a host-owned callback, not package-specific navigation knowledge
- current admin host route contract:
  - `rowActions[{ id: "edit", execution: "frontend" }]` navigates to `/modules/edit/{row.id}`

## Current Open Items

- final backend DTO naming
- final favorite mutation payload shape
- whether `savedFilterSets` should be returned in `meta` only or also in mutation responses
- final format layout vocabulary:
  - `text`
  - `badge`
  - `stacked`
  - whether more cell layout types are needed
- final frontend route contract for `View` and other future host-managed row actions
- whether row actions ever need row-level disabling in a later phase
- whether export runs synchronously or returns a job/download URL
- final bulk-edit modal contract once the universal form-builder/runtime exists

## Promotion Rule

Do not move this collection table preset into a shared package yet.

Promote only after all of the following are true:

- the toolbar contract is accepted
- the backend contract is accepted
- the table is used in at least two real app surfaces
- the row/cell rendering model is stable enough to stop changing weekly

At that point:

- keep backend DTOs in a non-UI shared contract layer if needed
- extract the reusable table surface into a shared package
- keep route-specific toolbar composition out of `ui-kit` unless the API becomes clearly stable across apps
