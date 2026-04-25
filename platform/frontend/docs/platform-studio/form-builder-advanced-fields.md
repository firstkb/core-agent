# Form Builder Advanced Fields

Status: exact detail reference
Historical status: active
Date: 2026-04-08
Last audited: 2026-04-25
Read rule: Open only after the active Form Builder module docs, and only when exact payload/settings/history detail is needed.
Canonical active docs:

- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

## Purpose

This document locks the accepted `Advanced fields` section for Platform Studio Form Builder V2.

It does not lock any specific advanced field as accepted yet.

## Accepted V2 Position

The `Advanced fields` section is accepted as a library or palette section.

Its purpose is to reserve an explicit extension area for:

- complex fields
- experimental fields
- backend-heavy fields
- future specialized authoring cases

Current accepted rule:

- the section exists
- the section may remain empty in the first implementation slice
- items inside the section are not accepted until they get their own explicit contract

## Current Deferred Backlog

The current working backlog for this section is:

- `Computed field`
- `Readonly text`
- `Readonly numeric`
- `Survey element`
- `SQL field`

These are review candidates only.
They are not accepted field types or accepted presets.

## Locked Decisions

- `Advanced fields` is an accepted section
- no individual advanced field is accepted yet
- advanced items should be added only through separate review and contract approval
- the section may be hidden, feature-flagged, or empty until individual items are approved

## Companion Docs

- `form-builder-field-catalog.md`
- `form-builder-section-tree.md`
- `form-builder-v2-field-contract.md`
