# Form Builder Implementation Backlog

Status: active
Date: 2026-04-08

## Purpose

This document decomposes the accepted Form Builder V2 registry into an implementation backlog for the current frontend codebase.

It is an execution document.
It is not the canonical contract.

Use it after:

- `form-builder-accepted-registry.md`

## Current Code Anchors

The current implementation is centered in:

- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/forms-builder-state.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/forms-placeholder-data.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/pages/forms-ui-schema-workspace-page.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/platform-studio.css`
- `platform/frontend/apps/tenant-web/src/locales/en.ts`
- `platform/frontend/apps/tenant-web/src/locales/es.ts`

## Minimal File Split

The current implementation is too concentrated in a small number of large files.

The recommended minimum split is:

- state and document contract
  - `forms-builder-state.ts`
  - `forms-builder-contract.ts`
  - `forms-builder-migrations.ts`
- library and palette registry
  - `forms-builder-library.ts`
  - `forms-builder-palette.ts`
  - `forms-builder-system-presets.ts`
- inspector surfaces
  - `forms-builder-inspector.tsx`
  - `forms-builder-rules.ts`
  - `forms-builder-grid-tab.tsx`
- placeholder and sample data
  - `forms-placeholder-data.ts`
- page shell and scope navigation
  - `pages/forms-ui-schema-workspace-page.tsx`

This is the smallest file split that should make the accepted V2 model implementable without keeping all new logic inside one page component.

## Execution Principles

- implementation should follow the accepted registry, not the older placeholder shape
- scope-aware document state must land before advanced inspector work
- `Grid` and `Rules` should not be bolted on top of the old flat document shape
- removed concepts should not be reintroduced during implementation

Removed or not-accepted concepts:

- `Repeater`
- `Relation`
- `User` relationship preset
- `Status preset`

## Backlog By Requested Area

This backlog can also be read by the five implementation areas requested for the first execution pass.

### Library

Primary workstreams:

- workstream 1
- workstream 2
- workstream 3

Main output:

- one registry-driven library source for accepted sections, base field types, presets, system shortcuts, layout nodes, and content nodes

### Inspector

Primary workstreams:

- workstream 5
- workstream 7
- workstream 9

Main output:

- node inspector aligned to the accepted field and container model
- root `View` tab aligned to accepted root-only concerns
- subform-specific inspector behavior for `DEFAULT` and `CHECKLIST`

### Grid Tab

Primary workstreams:

- workstream 8

Main output:

- dedicated `Grid` tab with per-scope column visibility and ordering

### Rules

Primary workstreams:

- workstream 6

Main output:

- same-scope `Visibility rules` and `Requirement rules` authored from the node inspector

### Scope-Aware Storage

Primary workstreams:

- workstream 2
- workstream 4
- workstream 10

Main output:

- one builder document with `rootScope` and `subformScopes`
- migration from old flat draft state
- debug output and local storage aligned to the accepted scope-aware document shape

## Ordered Workstreams

### 1. Contract Type Layer And Registry Foundation

Goal:

- create the TypeScript contract layer that mirrors the accepted registry

Main code targets:

- `forms-builder-state.ts`
- recommended new files:
  - `forms-builder-contract.ts`
  - `forms-builder-library.ts`

Tasks:

- define accepted `baseType` values
- define accepted `fieldPreset` values
- define accepted `systemFields` shape
- define accepted scope model:
  - `rootScope`
  - `subformScopes`
- define accepted node categories:
  - layout
  - content
  - bound field
- define accepted `viewSettings.list.columns`
- define accepted node-level `rules`
- define palette section metadata in one registry-driven source

Exit criteria:

- the code has one explicit registry source for sections and accepted items
- the code no longer depends on old placeholder `family` or legacy enum drift for core decisions

### 2. Placeholder Model Normalization And Migration Adapters

Goal:

- normalize the current placeholder model and bridge old saved drafts into the new document shape

Main code targets:

- `forms-placeholder-data.ts`
- `forms-builder-state.ts`
- recommended new file:
  - `forms-builder-migrations.ts`

Tasks:

- replace coarse placeholder kinds such as `text` and `number` with accepted V2 kinds where possible
- remove `status` as a standalone ready-made preset from placeholder assumptions
- remove `repeater` from palette assumptions
- normalize lookup presets to:
  - `contact_lookup`
  - `company_lookup`
  - `project_lookup`
- add migration from the current flat document shape into:
  - `rootScope`
  - `subformScopes`
- migrate current filter draft shape toward:
  - `pageFilters`
  - `quickFilters`
- preserve backward compatibility for saved local drafts

Exit criteria:

- old local drafts still load
- the in-memory working document uses the new scope-aware shape

### 3. Library And Palette Refactor

Goal:

- rebuild the palette from the accepted registry instead of ad hoc per-file logic

Main code targets:

- `forms-ui-schema-workspace-page.tsx`
- recommended new files:
  - `forms-builder-palette.ts`
  - `forms-builder-system-presets.ts`

Tasks:

- render sections in accepted order:
  - `Basic fields`
  - `Choice fields`
  - `Relationships`
  - `System Fields`
  - `Ready-made fields`
  - `Advanced fields`
  - `Layout`
  - `Content`
- wire create actions for:
  - accepted base fields
  - accepted ready-made presets
  - `Contact`, `Company`, `Project`
  - `Checklist subform`
- enforce that `Advanced fields` section exists but may remain empty or feature-flagged
- enforce root-only `Section` placement for the current scope
- enforce that `System Fields` are root-only

Exit criteria:

- every visible palette item maps directly to an accepted registry entry or accepted shortcut
- disallowed items do not appear in the palette

### 4. Scope Navigation And Scope-Aware Layout Authoring

Goal:

- make the builder aware of root scope versus subform scope

Main code targets:

- `forms-builder-state.ts`
- `forms-ui-schema-workspace-page.tsx`

Tasks:

- add scope-aware selection and navigation
- allow editing:
  - root scope
  - one selected subform scope
- make `Section` available only at the root of the current scope
- make `Subform` create a new scope record with:
  - `scopeId`
  - `tableKey`
  - `subformType`
- ensure `DEFAULT` and `CHECKLIST` subforms keep separate child schema scopes

Exit criteria:

- the UI can switch between root and child subform authoring without flattening fields together

### 5. Selection Inspector Refactor

Goal:

- move the selected-node inspector toward the accepted node contract

Main code targets:

- `forms-ui-schema-workspace-page.tsx`
- recommended new file:
  - `forms-builder-inspector.tsx`

Tasks:

- keep `Identity`, `Presentation`, and `Access`
- add dedicated `Rules` section
- for field nodes:
  - `Visibility rules`
  - `Requirement rules`
- for container nodes:
  - `Visibility rules`
- keep field preset editing out of this inspector when it belongs to the model-side preset editor
- keep root-only view concerns out of the selection inspector

Exit criteria:

- the selection inspector matches the accepted field/container authoring model

### 6. Rules Authoring Slice

Goal:

- implement simple same-scope conditional logic authoring

Main code targets:

- `forms-builder-state.ts`
- `forms-ui-schema-workspace-page.tsx`
- recommended new file:
  - `forms-builder-rules.ts`

Tasks:

- persist node-level `visibilityRules`
- persist node-level `requirementRules`
- allow only same-scope field references
- block cross-scope field selection in the UI
- support operators:
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
- restrict requirement rules to field nodes only

Exit criteria:

- rules are authored in the builder
- same-scope validation is enforced in state and UI

### 7. Root View Inspector Alignment

Goal:

- align the `View` tab with the accepted compact root-view contract

Main code targets:

- `forms-ui-schema-workspace-page.tsx`
- `forms-builder-state.ts`

Tasks:

- keep `Summary`, `Workflow`, `Actions`, `List`
- keep `Icon`, `Corrective Action`, and action toggles root-only
- align list settings to:
  - `sorting`
  - `pageFilters`
  - `quickFilters`
- keep the compact modal-driven filter editing direction
- keep `System Fields` root-only and unique

Exit criteria:

- the root `View` tab reflects the current accepted view contract

### 8. Grid Tab Implementation

Goal:

- implement the dedicated `Grid` tab for the current scope

Main code targets:

- `forms-ui-schema-workspace-page.tsx`
- `forms-builder-state.ts`
- recommended new file:
  - `forms-builder-grid-tab.tsx`

Tasks:

- add top-level `Grid` tab beside `Selection` and `View`
- implement `viewSettings.list.columns[]`
- allow show or hide per field
- allow ordering of visible fields
- for root scope:
  - manage root list columns
- for `DEFAULT` subform scope:
  - manage child-table columns
- for `CHECKLIST` subform scope:
  - disable or hide grid authoring

Exit criteria:

- grid columns are no longer implied by form layout or legacy field flags

### 9. Subform Runtime Authoring Details

Goal:

- finish the accepted authoring surface for `DEFAULT` and `CHECKLIST` subforms

Main code targets:

- `forms-builder-state.ts`
- `forms-ui-schema-workspace-page.tsx`

Tasks:

- persist `subformType`
- persist `lookupFieldId`
- persist `resultFieldId`
- enforce checklist constraints:
  - lookup field must be child `DB lookup`
  - result field must be child `Single select`
- allow local fields such as `Notes` and `Files`
- keep `Corrective Action` outside checklist

Exit criteria:

- checklist and default subforms are both valid authored scope types

### 10. Scope-Aware Draft Storage And Debug Output

Goal:

- make local storage and debug output match the accepted scope model

Main code targets:

- `forms-builder-state.ts`
- `forms-ui-schema-workspace-page.tsx`

Tasks:

- save and load the scope-aware document shape
- migrate legacy saved state on read
- update `Debug` modal output to show:
  - root schema
  - subform scopes
  - root view settings
  - scope-specific grid columns
  - scope-specific rules
- keep backward compatibility where reasonable

Exit criteria:

- saved drafts and debug payloads reflect the accepted registry shape instead of the older flat document

### 11. UI Copy And Visual Cleanup

Goal:

- align the workspace copy and styling with the accepted library

Main code targets:

- `platform-studio.css`
- `en.ts`
- `es.ts`

Tasks:

- add labels for:
  - `Rules`
  - `Visibility rules`
  - `Requirement rules`
  - `Grid`
  - `Columns`
- add copy for scope navigation
- add copy for checklist-only restrictions
- add compact grid-row and rules-row styling

Exit criteria:

- new authoring surfaces are fully labeled and consistent with the accepted terminology

### 12. Verification And Guard Rails

Goal:

- prevent regressions while the document shape changes

Main code targets:

- `forms-builder-state.ts`
- `forms-ui-schema-workspace-page.tsx`
- any added helper modules

Tasks:

- add validation helpers for:
  - root-only `System Fields`
  - root-only `Corrective Action`
  - root-only `pageFilters`
  - `Section` root-of-scope placement
  - same-scope rules
  - checklist field compatibility
  - `DEFAULT` versus `CHECKLIST` grid behavior
- run TypeScript verification
- run `git diff --check`

Exit criteria:

- state rejects invalid authored shapes before save

## Recommended Delivery Slices

### Slice A

- workstream 1
- workstream 2
- workstream 3

Reason:

- no later UI work is stable until the state shape and registry foundation are correct

Expected implementation focus:

- land `forms-builder-contract.ts`
- land `forms-builder-library.ts`
- land `forms-builder-migrations.ts`
- reduce legacy assumptions inside `forms-builder-state.ts`
- normalize `forms-placeholder-data.ts`

### Slice B

- workstream 4
- workstream 6
- workstream 7

Reason:

- this lands the core inspector model and root view alignment

Expected implementation focus:

- split inspector rendering out of the main page component
- add node `Rules`
- align root `View` authoring to the accepted contract

### Slice C

- workstream 8
- workstream 9
- workstream 10

Reason:

- this lands the new `Grid` and scope-aware child authoring model

Expected implementation focus:

- add top-level `Grid` tab
- make scope switching explicit in the workspace shell
- make child draft payloads and debug output scope-aware

### Slice D

- workstream 11
- workstream 12

Reason:

- this closes polish and guard rails after the structural changes settle

Expected implementation focus:

- finish copy and styling for the new authoring surfaces
- add state-level validation helpers before save and debug

## Out Of Scope For This Backlog

- backend API implementation
- physical DDL generation
- advanced-field implementation
- Action Builder side effects
- publish workflow

## Companion Docs

- `form-builder-accepted-registry.md`
- `form-builder-v2-field-contract.md`
- `form-builder-schema-scope-contract.md`
- `form-builder-field-rules-contract.md`
- `form-builder-grid-columns-contract.md`
- `form-builder-view-settings-contract.md`
