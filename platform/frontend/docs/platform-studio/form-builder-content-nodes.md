# Form Builder Content Nodes

Status: active
Date: 2026-04-08

## Purpose

This document locks the accepted `Content` section for Platform Studio Form Builder V2.

It exists to keep static authored content separate from:

- model-backed fields
- System Fields
- layout nodes
- view-level settings

## Source Provenance

This section stays grounded in the three original analysis inputs:

- `EXTDB`
  - `70 TITLE (text w/o field)` as the legacy basis for `Heading`
  - `72 HTML (any text)` as the legacy basis for `Text block` and `Rich text block`
- `smartapp`
  - current runtime expectations for authored text and rich-content rendering
- `ezform`
  - builder-shell expectation that static content nodes are authored separately from fields

## Section Boundary

`Content` contains static authored content blocks and approved readonly display blocks.

It must not contain:

- input fields
- choice presets
- relationship fields
- System Fields
- layout nodes such as `Divider`

Important distinction:

- `Rich text` is a model field that stores formatted data
- `Rich text block` is a static content node rendered in the view
- `View-only field` is a readonly bound display node rendered in the view

## Accepted Content Nodes

The accepted `Content` section contains only:

- `Heading`
- `Text block`
- `Rich text block`
- `View-only field`

## Node Contract

### `Heading`

Function:

- static heading used to divide the form into meaningful sections
- improves readability and hierarchy

Settings:

- `text`
- `level`
  - `h1 | h2 | h3 | h4`
- `alignment`
  - `left | center | right`
- `styleVariant`
  - optional
- `visibilityRules`
  - optional

Compile target:

- `content.heading`

### `Text block`

Function:

- plain static text for instructions, warnings, helper copy, and descriptions

Settings:

- `text`
- `alignment`
  - `left | center | right`
- `styleVariant`
  - optional
- `visibilityRules`
  - optional

Compile target:

- `content.text`

### `Rich text block`

Function:

- formatted static content for longer instructions, lists, links, and richer informational copy

Settings:

- `content`
- `editorMode`
  - `visual | html`
- `alignment`
  - optional
- `styleVariant`
  - optional
- `visibilityRules`
  - optional

Compile target:

- `content.rich_text`

### `View-only field`

Function:

- readonly display of an approved bound value inside the form
- first-slice binding targets are:
  - approved `lookup derived outputs`
  - root-level `Doc.id`

Settings:

- `label`
- `binding.kind`
  - `lookup_derived_output`
  - `root_record_id`
- `binding.sourceFieldId`
  - required only for `lookup_derived_output`
- `binding.outputKey`
  - required only for `lookup_derived_output`
- `visibilityRules`
  - optional

Compile target:

- `content.view_only_field`

## Locked Decisions

- `Content` stays intentionally narrow
- `Divider` remains a `Layout` node, not a content node
- `Image`, `Embed`, and other specialized blocks are not accepted in the current tree
- `View-only field` is not a model-backed editable field
- first-slice `View-only field` bindings are limited to approved lookup-derived outputs and root-level `Doc.id`
- `Doc.id` is root-only and must not be exposed inside subform scopes
- additional content nodes should be added only as explicit future decisions

## Companion Docs

- `form-builder-field-catalog.md`
- `form-builder-section-tree.md`
- `form-builder-v2-field-contract.md`
