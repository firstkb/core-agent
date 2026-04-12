# Form Builder Grid Columns Contract

Status: active
Date: 2026-04-08

## Purpose

This document locks the accepted grid-column model for Platform Studio Form Builder V2.

It exists to answer:

- which fields should appear in a list grid
- in what order they should appear
- where that configuration belongs

## Source Provenance

This contract stays grounded in the three original analysis inputs:

- `EXTDB`
  - legacy page and grid behavior where field visibility in the list surface is authored separately from form layout
- `smartapp`
  - current runtime need for list and child-table presentation control
- `ezform`
  - `showInGrid`
  - `pidGrid`
  - `ui:grid`

## Accepted V2 Position

Grid-column configuration is a view concern.

It is not:

- a base field property
- a field preset
- a layout-grid concern

The builder should expose a dedicated `Grid` tab for the current scope.

## Scope Boundary

Accepted scope rule:

- the root scope may configure root grid columns
- a `DEFAULT` subform scope may configure child-table grid columns
- a `CHECKLIST` subform does not use grid-column configuration

Grid-column references must stay inside the current scope:

- root grid columns may reference only root fields
- subform grid columns may reference only fields from the same subform scope

## Recommended Persisted Shape

```ts
interface GridColumnDefinition {
  id: string;
  fieldId: string;
  visible: boolean;
  order: number;
}

interface GridSettings {
  columns: GridColumnDefinition[];
}
```

Recommended storage rule:

- grid columns should be stored in the current scope `uiSchema`
- preferred initial path:
  - `viewSettings.list.columns`

## Grid Tab Contract

The builder should expose a dedicated top-level inspector tab:

- `Grid`

This tab is separate from:

- `Selection`
- `View`

The `Grid` tab should show one compact `Columns` editor.

## Columns Editor

The editor should let the user:

- choose whether a field is shown in the grid
- set the display order of visible fields

Accepted first-version controls:

- field title
- show or hide toggle
- order control or reorder interaction

Deferred controls:

- label override
- width
- renderer
- alignment

## Runtime Rules

- only visible columns render in the list grid
- order is taken from the authored column order
- fields not included in `columns` are hidden from the grid by default

## Locked Decisions

- grid columns belong to the view layer
- the builder gets a dedicated `Grid` tab
- grid-column selection is per scope
- `DEFAULT` subforms may own child-table grid columns
- `CHECKLIST` subforms do not use grid-column configuration

## Companion Docs

- `form-builder-view-settings-contract.md`
- `form-builder-schema-scope-contract.md`
- `form-builder-slice-1-inspector-and-view-schema.md`
