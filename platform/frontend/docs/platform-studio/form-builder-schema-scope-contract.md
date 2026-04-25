# Form Builder Schema Scope Contract

Status: exact detail reference
Historical status: active
Date: 2026-04-08
Last audited: 2026-04-25
Read rule: Open only after the active Form Builder module docs, and only when exact payload/settings/history detail is needed.
Canonical active docs:

- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

## Purpose

This document locks the accepted schema-scope model for Platform Studio Form Builder V2.

It exists to answer two related questions:

- how root-form schema and subform schema should be separated
- where `Section` is allowed to appear

## Source Provenance

This contract stays grounded in the three original analysis inputs:

- `EXTDB`
  - subforms act as real child structures with their own form behavior
- `smartapp`
  - `DEFAULT` subforms render inside the parent form as child tables, and `Add` or `Edit` opens a dedicated child page
- `ezform`
  - schema authoring should remain explicit and structured rather than becoming one flat mixed tree

## Accepted V2 Position

The builder should use:

- one builder document
- one root schema scope
- zero or more subform schema scopes

It should not use:

- one flat schema for root and all child records together
- multiple unrelated standalone schema documents with no shared parent contract

## Canonical Terms

- `Form scope`
  - one authoring scope with its own `dataSchema` and `uiSchema`
- `Root scope`
  - the main form scope
- `Subform scope`
  - one child-record scope owned by one `Subform`
- `Scope root`
  - the top layout container of one scope

## Recommended Authoring Shape

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

## Root Scope Contract

The root scope owns:

- the main model-backed `dataSchema`
- the main `uiSchema`
- `systemFields`
- `viewSettings`
- `filterDefinitions`
- root view actions and list behavior

Root-only concerns:

- `Reported By`
- `Reported Date`
- `Status` as a `System Field`
- `Icon`
- `Corrective Action`
- `pageFilters`
- `quickFilters`
- root list sorting

## Subform Scope Contract

Each accepted `Subform` owns its own embedded schema scope.

Each subform scope owns:

- its own `dataSchema`
- its own `uiSchema`
- its own physical child table
- its own `subformType`
- its own `tableKey`
- optional child-table grid-column settings when `subformType = DEFAULT`

The subform scope is the schema that should be rendered when:

- the user clicks `Add` on a `DEFAULT` subform
- the user clicks `Edit` on a `DEFAULT` subform row
- a checklist subform opens its dedicated child-record form flow

## What Stays Root-only

These concerns must not be authored inside a subform scope:

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

Note:

- subform scopes may still own local child-table grid columns

## What Is Allowed Inside A Subform Scope

These concerns are allowed inside a subform scope:

- model-backed fields
- field presets
- layout nodes
- content nodes
- child lookup fields
- checklist result fields
- conditional node rules
- child-table grid columns for `DEFAULT` subforms

This means a subform can have its own:

- `Basic fields`
- `Choice fields`
- `Relationships`
- `Ready-made fields`
- `Layout`
- `Content`

## `Section` Placement Rule

`Section` is allowed only at the root of the current form scope.

There are only two accepted kinds of form scope:

- the root scope of the main form
- the root scope of one subform

That means:

- `Section` may be added directly under the root of the main form
- `Section` may be added directly under the root of a subform scope
- `Section` must not be added inside another `Section`
- `Section` must not be added inside `Group`
- `Section` must not be added inside `Tabs`
- `Section` must not be added inside `Grid layout`
- `Section` must not be added inside other nested containers

Runtime rule:

- if a scope has no explicit `Section`, the whole scope should render inside one default card surface

## `Subform` Runtime Boundary

`DEFAULT` subform:

- renders inside the parent form as a child table
- uses the subform scope for child `Add` and `Edit` pages

`CHECKLIST` subform:

- still owns a dedicated child table
- still owns a dedicated subform scope
- changes runtime orchestration, not the schema-scope boundary

## Locked Decisions

- root and subform schemas should stay separated by scope
- subform schema should not be flattened into the root schema
- one builder document should own all scopes together
- `Section` is a scope-root layout node, not a general nested container

## Companion Docs

- `form-builder-field-catalog.md`
- `form-builder-section-tree.md`
- `form-builder-subform-checklist-contract.md`
- `form-builder-v2-field-contract.md`
- `form-builder-backend-boundary.md`
- `data-schema-storage-rules.md`
