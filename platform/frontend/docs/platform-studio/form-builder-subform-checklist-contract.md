# Form Builder Checklist Subform Contract

Status: active
Date: 2026-04-08

## Purpose

This document locks the current working contract for `Checklist subform` in Platform Studio Form Builder V2.

It exists to keep checklist behavior explicit without introducing a second canonical subform node.

This document is the detailed companion to:

- `form-builder-field-catalog.md`
- `form-builder-section-tree.md`
- `form-builder-relationships.md`
- `form-builder-backend-boundary.md`
- `data-schema-storage-rules.md`

## Source Provenance

This contract stays grounded in the three original analysis inputs:

- `EXTDB`
  - legacy `SUBFORM` plus checklist-oriented settings such as `Lookup Field` and `Result Field`
- `smartapp`
  - current checklist runtime with grouped sections, answer buttons, notes, and files
- `ezform`
  - builder-shell expectations for user-facing palette shortcuts and inspector-driven setup

## Canonical Position

`Checklist subform` is:

- a palette shortcut
- not a second canonical layout node
- not a second relationship field type

Compile rule:

- `LayoutNode.type = subform`
- `subformType = CHECKLIST`

## Palette Behavior

The builder may expose both:

- `Subform`
- `Checklist subform`

But only one canonical persisted node exists:

- `subform`

Meaning:

- `Subform` creates a normal child-record area
- `Checklist subform` creates the same node family with checklist defaults and checklist-specific bindings

## Required Checklist Bindings

Each checklist subform must define:

- `lookupFieldId`
  - must reference a child `db_lookup` field inside the same subform
- `resultFieldId`
  - must reference a child `single_select` field inside the same subform

Normalization rule for the result field:

- legacy `COMBOBOX (custom selections)` should normalize to child `single_select`
- recommended authoring path is `Radio group` over `single_select`
- runtime may render the result field as button-style radio choices

## Runtime Behavior

Current accepted runtime expectations:

- grouped checklist sections come from the lookup display structure
- flat checklist rows come from a lookup source with no category grouping
- result choices are stored as one selected option from the child result field
- button-style rendering does not create a second field type

## Storage Boundary

Checklist subforms follow the same storage rule as normal subforms:

- each managed checklist subform creates its own managed child table
- the child table carries the parent relation back to the owning root record
- checklist mode changes runtime orchestration, not the child-table boundary

## Optional Sibling Fields

Observed runtime patterns may include optional child fields such as:

- notes
- files or attachments

These remain optional checklist enrichments.
They do not replace the required `lookupFieldId` and `resultFieldId` bindings.

Explicit boundary:

- `Corrective Action` is not part of the checklist subform contract
- `Corrective Action` should connect at the view level as a separate workflow concern

## Validation Rules

- `lookupFieldId` must point to a child `db_lookup` field in the same subform
- `resultFieldId` must point to a child `single_select` field in the same subform
- `lookupFieldId` and `resultFieldId` must not reference fields outside the current subform
- `resultFieldId` options remain editable even when the field starts from a preset

## Deferred Details

This document intentionally does not yet lock:

- the exact checklist creation UX in the builder
- whether checklist setup creates required child fields automatically or asks the user to bind them manually
- the exact formal ids for optional notes or files sibling fields

## Current Locked Position

- `Checklist subform` should exist as a user-facing palette shortcut
- it should compile to canonical `Subform` with `subformType = CHECKLIST`
- `Lookup Field` must be child `DB lookup`
- `Result Field` must be child `Single select`
- button-style answers are a renderer or preset choice, not a separate field ontology
- `Corrective Action` is outside checklist scope and belongs to view-level workflow configuration
