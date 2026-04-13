# Form Builder Rich Text Editor Workstream Contract

Status: active
Date: 2026-04-12

## Purpose

This document fixes the approved foundation for the `Rich text` field and the future `Rich text block` editor surface.

It answers four questions:

- which editor foundation is preferred
- what first-slice scope is allowed
- what is explicitly out of scope
- what `ui-kit` and `ui-lab` must deliver before Form Builder runtime integration

## Locked Decision

Recommended editor foundation:

- `Tiptap OSS`

Reason:

- React-friendly
- headless enough to fit the current `ui-kit` approach
- supports a minimal first slice without forcing a third-party visual language into Platform Studio
- can later back both:
  - `Rich text` model field
  - `Rich text block` content node

## Metronic Review Outcome

`frontend/docs/metronic` does not currently provide a reusable WYSIWYG editor foundation for this work.

Observed outcome:

- textarea and basic form controls exist
- no approved rich-text editor surface was found
- no reusable `Tiptap`, `Quill`, `Lexical`, `Slate`, `CKEditor`, or `TinyMCE` integration was found

Decision:

- do not use `metronic` as the editor foundation for `Rich text`
- continue to treat `metronic` as donor reference material only

## First-Slice Scope

The first shared editor slice should support:

- bold
- italic
- underline
- bullet list
- ordered list
- link
- undo
- redo

Optional in the same slice only if implementation remains clean:

- `H2`
- `H3`

## Storage Contract

Stored value shape:

- sanitized HTML string

Required boundaries:

- sanitize on runtime and backend boundary
- do not store editor-private JSON as the canonical persisted format in the first slice
- do not allow the editor package to define storage semantics by itself

## Out Of Scope For First Slice

- images
- tables
- mentions
- inline comments
- collaboration
- track changes
- paid/pro extensions
- cloud/editor SaaS coupling
- custom drag-drop embeds

## UI Kit Deliverables

`ui-kit` must provide:

- one shared `RichTextEditor` primitive
- one shared `RichTextToolbar` surface
- one minimal read-only renderer contract for sanitized HTML display

The shared primitive should be controlled by props, not by page-specific runtime state.

Expected prop direction:

- `value`
- `defaultValue`
- `onChange`
- `disabled`
- `toolbarPreset`
- `placeholder`

## UI Lab Deliverables

`ui-lab` must provide:

- one minimal editable example
- one read-only example
- one validation example
- one narrow-width example

The goal is not demo quantity.
The goal is to prove the shared editor behaves correctly in ordinary form layouts.

## Form Builder Integration Order

Integration order:

1. `ui-kit` editor foundation
2. `ui-lab` proof surfaces
3. `Rich text` field inspector/runtime binding
4. `Rich text block` content editor alignment

Do not start with Form Builder wiring before steps 1 and 2 exist.

## Non-Goals

- building a full document editor
- adding markdown as the primary authoring model
- using plain textarea as a fake WYSIWYG substitute
- implementing a custom `contenteditable` foundation

## Definition Of Done

This workstream is ready to start implementation when:

- `Tiptap OSS` is accepted as the foundation
- first-slice toolbar scope is fixed
- `ui-kit` owns the editor primitive
- `ui-lab` owns the proof/demo surface
- Form Builder waits for those two layers instead of bypassing them
