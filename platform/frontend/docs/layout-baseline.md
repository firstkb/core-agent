# Frontend Layout Baseline

Lightweight layout and grid contract for the shared frontend system.

This document exists to answer one question:

- how layout should stay predictable without introducing a heavy framework-style grid system

It is intentionally smaller than Bootstrap-style layout systems.

The goal is:

- stable width behavior
- calm enterprise structure
- easy rules for future AI agents

## Core Position

The frontend does need a layout system.

It does **not** need:

- a Bootstrap clone
- a 12-column utility API everywhere
- content-driven `auto-fit` layouts by default

It **does** need:

- a small set of explicit layout roles
- predictable breakpoint behavior
- width containment rules that stop components from expanding parent surfaces

## Canonical Layout Roles

### 1. App Shell

Use for:

- sidebar + main content
- top-level page shells

Rules:

- always use `minmax(0, 1fr)` for the content column
- sidebars get explicit width, not content-sized width
- shell columns must not react to child content width
- desktop rail collapse preference should persist per app shell in local storage and survive reload or sign-in
- mobile drawer open/close must not overwrite the saved desktop rail preference

### 2. Content Container

Use for:

- route content
- panel stacks
- documentation surfaces

Rules:

- default to one column
- only opt into multi-column section layouts intentionally
- do not use `auto-fit` as the default content-container strategy

### 3. Section Grid

Use for:

- card groups
- docs panels
- bounded comparison layouts

Rules:

- mobile baseline: `1` column
- desktop: `2` columns only when the section genuinely benefits from side-by-side comparison
- if a section does not clearly need comparison, keep it one-column

### 4. Form Grid

Use for:

- form fields and sectioned form rows

Rules:

- `FormGrid` is the canonical shared form layout surface
- only `1` or `2` columns
- collapse to `1` column on smaller screens
- labels and controls must not size the grid track by content width

### 5. Inline Control Row

Use for:

- chip rows
- compact action rows
- filter groups

Rules:

- rows may wrap in height
- they must not expand parent width
- child controls should truncate or wrap before forcing horizontal growth

### 6. Rail / Panel Layout

Use for:

- filter rails
- detail panels
- side context surfaces

Rules:

- rails are bounded local surfaces, not page shells
- rails always take `width: 100%` inside their slot
- internal groups and toolbars must use `min-width: 0`

### 7. Summary / Preset Rows

Use for:

- local summary rows
- `view-preset-bar`

Rules:

- treat these as bounded content rows, not fluid dashboard auto-layouts
- mobile baseline: `1` column
- desktop baseline: `2` columns
- do not use `repeat(auto-fit, minmax(...))` for these shared patterns unless a specific review proves it is necessary

## Width Stability Rules

These rules should be treated as hard defaults.

### Use `min-width: 0`

Apply to:

- grid content columns
- flex children that may contain long text
- panel bodies
- toolbars and grouped control rows

Reason:

- without `min-width: 0`, flex and grid children often refuse to shrink and start pushing parent width unexpectedly

### Prefer `width: 100%` For Bounded Shared Surfaces

Apply to:

- page toolbar
- local collection toolbars
- local filter areas
- local detail surfaces
- local summary rows
- preset bars

Reason:

- these components should fill the slot they are given
- they should not size themselves based on child content

### Avoid Content-Reactive Auto Grids In Shared Patterns

Do not default to:

- `repeat(auto-fit, minmax(...))`
- `repeat(auto-fill, minmax(...))`

for:

- route shells
- section shells
- summary rows
- preset bars

Reason:

- small width changes create visible jumps in layout
- scrollbars, expanding sections, or side panels can trigger column count changes unexpectedly

## Current Shared Baseline

The current shared baseline should be treated as:

- app shell: explicit sidebar width + `minmax(0, 1fr)` content
- content sections: one-column by default
- forms: `FormGrid` with `1` or `2` columns
- summary rows: one-column mobile, two-column desktop
- preset bars: one-column mobile, two-column desktop
- chip/filter rows: wrap in height, never expand parent width

## What AI Agents Should Do

When adding or adjusting UI:

- start from one-column layout
- add a second column only when the screen clearly benefits
- use existing shared layout surfaces before inventing new wrappers
- prefer containment (`min-width: 0`, `width: 100%`) over clever responsive tricks
- avoid introducing `auto-fit` grids into shared primitives without explicit review

## First Stabilization Pass

The current stabilization pass applies this baseline to:

- `page-toolbar`
- `filter-chip`
- `view-preset-bar`

This is a baseline pass, not a final layout framework.

If a future module proves a real reusable gap, a new shared layout primitive can be introduced later.
