# UI Lab Structure

Canonical section structure for `platform-admin-web` `/root/ui-lab`.

`UI Lab` is an internal validation surface for frontend foundations. It is not a second product app and it is not a place to compose full business screens.

Implementation:

- runtime route: `/root/ui-lab`
- implementation module: `apps/platform-admin-web/src/internal/ui-lab`
- route wiring: `apps/platform-admin-web/src/app/app.tsx`

## Purpose

`UI Lab` exists to:

- validate donor extraction from Metronic before promotion into `ui-kit`
- compare stable, provisional, and app-only patterns in one controlled place
- inspect light and dark presentation of reusable primitives
- review component states without coupling them to product routing or domain workflows

## Non-Goals

`UI Lab` must not become:

- a clone of the future admin interface
- a warehouse for every page fragment
- the source of truth for product layout decisions
- a reason to promote unstable screen compositions into `ui-kit`

## Exact Top-Level Sections

These are the canonical top-level sections for `UI Lab`.

### 1. Foundations

Scope:

- colors
- typography
- spacing
- radius
- shadows
- surface rules
- icon rhythm

Contains:

- token swatches
- type scale samples
- notes on donor alignment

Rule:

- no product workflow logic

### 2. Form Controls

Scope:

- input
- textarea
- select
- checkbox
- switch
- field layout
- form shell
- validation and helper states

Contains:

- default
- hover
- focus
- disabled
- invalid

Rule:

- form examples stay generic and do not encode tenant, billing, or audit flows

### 3. Overlay Contracts

Scope:

- menu
- popover
- tooltip
- dialog
- sheet

Contains:

- trigger patterns
- placement examples
- confirmation states
- layered interaction checks

Rule:

- overlays stay generic and reusable

### 4. Navigation Primitives

Scope:

- breadcrumb
- tabs
- pagination
- local nav candidates

Contains:

- reusable navigation primitives from `ui-kit`
- app-level nav experiments that are not yet ready for `ui-kit`

Rule:

- the `UI Lab` sidebar itself is an app-level reference until mobile drawer behavior, accessibility contract, and reusable API are approved

### 5. Data Display

Scope:

- card
- badge
- table primitives
- table meta cells
- table density
- row presentation

Contains:

- generic card examples
- data-dense table examples
- table loading and row presentation checks

Rule:

- keep table behavior generic, not tied to tenant, billing, or audit pages

### 6. States

Scope:

- empty states
- search empty states
- guided empty states
- loading states
- table loading states
- error states when they are generic

Contains:

- state variants for collection and table surfaces

Rule:

- use this section to validate reusable state contracts only

### 7. Inventory Snapshot

Scope:

- donor extraction status
- stable vs provisional vs app-only classification
- next candidate elements from Metronic

Contains:

- donor coverage notes
- promotion readiness notes

Rule:

- this section is documentation-like and should not become a screen gallery

## Local Utilities That Stay Out Of `ui-kit`

These are allowed inside `UI Lab`, but they are not candidates for promotion by default:

- the sidebar search for filtering lab entries
- the page theme toggle for lab-only light or dark inspection
- temporary donor navigation prototypes
- app-only branch logic used to test menu behavior

## Promotion Boundary

Only promote something from `UI Lab` into `ui-kit` when:

- it is stable
- it is generic
- it is reusable across real surfaces
- it has an API that can be named without page-specific language

If the pattern is still sensitive to one route, one layout, or one donor composition, keep it in app-layer.

## Current Route Mapping

Current `UI Lab` content should map to these panel buckets:

- `overview`
- `foundations`
- `form-controls`
- `overlay-contracts`
- `navigation-primitives`
- `data-display`
- `states`
- `inventory`

This mapping is valid as long as `UI Lab` stays a component and pattern lab, not a product shell.
