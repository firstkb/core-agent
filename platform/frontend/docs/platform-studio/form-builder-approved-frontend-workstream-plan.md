# Form Builder Approved Frontend Workstream Plan

Status: active
Date: 2026-04-09

## Purpose

This document normalizes the currently approved frontend Form Builder workstreams after the first implementation wave.

It is a focused execution plan.
It does not replace the canonical contracts.

Use it with:

- `form-builder-accepted-registry.md`
- `form-builder-implementation-backlog.md`
- `form-builder-storage-and-sql-view-contract.md`
- `form-builder-backend-scope-payload-contract.md`
- `form-builder-backend-api-contract.md`

## Locked Invariants

- keep the accepted Form Builder section tree and field catalog stable
- do not reintroduce removed concepts:
  - `Repeater`
  - `Relation`
  - `User` relationship preset
  - `Status preset`
- keep the scope-aware model:
  - `rootScope`
  - `subformScopes`
- keep `tenant-web` as the active Form Builder UI surface
- treat `ezform` as an interaction reference only, not as source code to port
- backend owns:
  - physical table naming
  - DDL generation
  - storage validation
  - SQL view generation
- frontend authors:
  - business field intent
  - layout intent
  - view intent
  - filter intent
  - renderer intent

## Route

- route: `DIRECT_FRONTEND_NO_RUN`
- run required: `no`

Reason:

- current work is frontend-local and can proceed without a new coordinated FE/BE run
- backend contract work is being documented in parallel and does not currently require lane orchestration to continue the UI/UX pass

## Workstream Order

The current approved order is:

1. multivalue storage and reporting contract
2. selection control strategy across `Multi select`, `Tags`, and lookup multiselect
3. `DB lookup` Element tab redesign
4. `DB lookup` source-selection modal
5. lookup derived outputs contract expansion and builder integration
6. `DEFAULT subform` child-view settings
7. `View -> Filters` pass for lookup-heavy fields
8. remaining field-by-field inspector completion

## Workstream 1. Multivalue Storage And Reporting Contract

Goal:

- lock one report-friendly storage model for fields with multiple values

Scope:

- `Multi select`
- `Tags`
- accepted lookup-multiple entries:
  - `DB lookup multi`
  - `Contacts`
  - `Projects`
  - `Companies`

Must decide:

- how multivalue entries are stored physically
- how reports can query them safely
- whether a shared multivalue child-table pattern is used
- how stable option identity is represented:
  - `option key`
  - `option label`

Locked direction:

- do not use comma-separated storage as the canonical model
- do not rely on labels alone as durable stored values
- reportability is a first-class requirement, not a later add-on

Expected outputs:

- backend-side storage contract update
- choice-field contract update where needed
- clear distinction between:
  - single stored scalar values
  - repeated stored values

Exit criteria:

- `Multi select` is no longer marked as deferred from a storage-contract point of view
- the builder can point to one approved storage model for multivalue fields

## Workstream 2. Selection Control Strategy

Goal:

- choose the correct UI control family for single-value and multivalue selection experiences

Reference surfaces:

- `ui-lab`
- `Form Controls / Combobox`
- `Form Controls / Tag Input`

Approved direction:

- `Combobox` is the primary direction for:
  - `Contact`
  - `Project`
  - `Company`
  - `Reported By`
  - generic `DB lookup` in select mode
- `Tag Input` is the primary direction for `Tags`

Pending decisions:

- whether `Combobox` gains a true multiselect mode in `ui-kit`
- whether multiselect lookup starts app-local first and is promoted later
- whether generic `DB lookup multi` and preset multi-lookups share the same shell UI from day one

Exit criteria:

- every selection-heavy field family maps to one approved control strategy
- `Tags` and lookup multiselect no longer feel like ad hoc exceptions

## Workstream 3. DB Lookup Element Tab Redesign

Goal:

- rebuild the `DB lookup` inspector so it is user-facing and compact instead of system-heavy

Problems to fix:

- too much low-level system information
- too many inputs exposed at once
- current structure does not match the approved product language

Target sections:

- `Source`
- `Display`
- `Search`
- `Derived outputs`

Rules:

- keep the number of visible settings low
- advanced or derived details should not dominate the main path
- preset lookups should still inherit from the same core inspector model
- single and multiple lookup variants should be separate create options, not a mutable toggle inside the inspector

Exit criteria:

- `DB lookup`, `Contact`, `Project`, `Company`, `Reported By` feel like one coherent family
- the default user path is clear without exposing unnecessary storage vocabulary

## Workstream 4. DB Lookup Source-Selection Modal

Goal:

- implement the source-selection flow for generic `DB lookup`

Approved UX:

- open a modal from the `DB lookup` inspector
- load available models and fields from backend later
- use mock data first
- left side:
  - model selection by radio
- right side:
  - field selection by checkbox

Purpose:

- pick the source model
- pick the source fields used for display and selection behavior

Exit criteria:

- generic `DB lookup` no longer depends on raw text inputs for source selection
- the user can configure a lookup source through a guided modal

## Workstream 5. Lookup Derived Outputs

Goal:

- expand and lock the derived output model for lookup fields and make it usable in the builder

Current approved examples:

- `reported_by__label`
- `reported_by__company_name`
- `reported_by__company_id`
- `reported_by__title`
- `project__label`
- `project__num`
- `project__name`
- `project__company_name`
- `company__label`
- `company__type`
- `company__main_company_name`

Approved expansions to add:

- `reported_by__phone`
- `contact__phone`
- `company__state`

Critical naming rule:

- derived outputs must be field-instance-based, not preset-family-global

Example:

- if two company lookups exist, each field instance gets its own derived output family
- do not assume only one global `company__label`

Frontend integration targets:

- `View -> Filters`
- `Grid`
- `view-only field` bindings inside forms

Exit criteria:

- the contract is explicit about per-field-instance derived outputs
- the builder can consume approved derived outputs in read contexts

## Workstream 6. DEFAULT Subform Child View Settings

Goal:

- add the missing view-like behavior for `DEFAULT subform`

Current gap:

- child `Grid` exists
- child `View` behavior does not

Approved settings to add:

- `Add`
- `Edit`
- `Delete`
- `Sorting`

Direction:

- these may live as `Subform settings` instead of a full separate child `View` tab
- the user should still understand them as table/view behavior for the child scope

Non-goal for this pass:

- full `CHECKLIST` child-view parity

Exit criteria:

- `DEFAULT subform` has enough settings to behave like a controlled child-table surface

## Workstream 7. Filters Pass For Lookup-Heavy Fields

Goal:

- finish the `View -> Filters` UX and contract for:
  - `Contact`
  - `Reported By`
  - `Project`
  - `Company`

Needed work:

- confirm filter operators for lookup-derived outputs
- confirm dynamic token behavior where applicable
- keep the modal compact and product-readable

Exit criteria:

- lookup-heavy filters no longer rely on generic fallback behavior where a preset-specific editor exists

## Workstream 8. Remaining Field-By-Field Inspector Completion

Goal:

- continue the same pass already started for:
  - `Short text`
  - `Single select`
  - `Multi select`

Remaining direction:

- review each accepted field family
- remove technical noise
- keep the inspector minimal but complete
- align each field with its approved contract

Fields likely to be covered in later passes:

- `Long text`
- `Rich text`
- `Integer`
- `Decimal`
- `Currency`
- `Boolean`
- `Date`
- `Date & time`
- `Signature`
- `Geo point`
- `Attachment`
- `Email`
- `Phone`
- `URL`
- `Date today`
- `Tags`
- `DB lookup`
- lookup presets

Exit criteria:

- every accepted field has a coherent inspector model
- field-specific settings match the approved contracts

## Immediate Next Step

Start with:

1. Workstream 1
2. Workstream 5
3. Workstream 3

Reason:

- `multivalue` and `derived outputs` are foundational contracts
- `DB lookup` UI should not be finalized before those foundations are clearer

## Non-Goals For The Current Pass

- backend implementation of publish lifecycle
- full shared-package extraction for Platform Studio UI
- Action Builder
- Navigation Builder
- generic advanced field implementation
