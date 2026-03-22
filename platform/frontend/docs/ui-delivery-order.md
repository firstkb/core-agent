# UI Delivery Order

Canonical execution order for frontend UI work.

This document fixes the working sequence for donor extraction, review, missing-component creation, and only then the main system template.

## Core Rule

Do not start the main system template too early.

The order is fixed:

1. extract the full set of needed donor components and patterns
2. review and correct the extracted components
3. create the missing primitives or missing shared layers
4. only then start the main system template

If this order is broken, the team risks freezing unstable UI decisions too early.

## Phase 1. Donor Extraction First

Goal:

- take all needed UI elements from the Metronic donor surface
- convert them into product-owned frontend code
- keep only stable or clearly reviewable elements

Rules:

- extract primitives first
- extract low-risk shared patterns second
- do not copy donor routing, providers, auth, or page shells
- do not promote app-shaped navigation or workflow surfaces into `ui-kit`
- keep provisional candidates visible in `UI Lab`

Expected output:

- reusable components in `packages/ui-kit`
- token alignment in `packages/design-tokens`
- review-stage or app-layer candidates visible in `platform-admin-web` `/root/ui-lab`

## Phase 2. Review And Correction

Goal:

- inspect the extracted components one by one
- correct API, layout, accessibility, spacing, density, typography, and state behavior

Rules:

- review components directly in `UI Lab`
- fix concrete issues before expanding API surface
- do not add new variants casually
- do not jump to the full application layout while basic components still need correction

Review focus:

- sizing
- spacing
- typography
- focus and hover behavior
- required and invalid states
- dark-mode behavior for stable primitives
- mobile behavior where relevant
- docs quality inside `UI Lab`

Expected output:

- stable approved primitives
- corrected provisional surfaces
- cleaner docs and usage guidance

## Phase 3. Fill The Gaps

Goal:

- create only the primitives or shared layers that donor extraction did not cover well enough

Rules:

- create missing primitives only after confirming the gap is real
- prefer small stable building blocks over large screen-shaped components
- keep app-specific compositions out of `ui-kit`
- add new shared layers only when they are generic, reusable, and documentable

Examples:

- missing field layouts
- missing overlay shell
- missing identity primitive
- missing table helper
- missing form composition layer

Expected output:

- product-owned components that donor code could not provide cleanly
- explicit distinction between `stable approved`, `provisional`, and `app-layer only`

## Phase 4. Main System Template

Goal:

- start the main layout and shell system only after the component base is mature enough

This includes:

- primary product layout
- shell rhythm
- navigation structure
- desktop and mobile shell behavior
- page framing rules
- section layout conventions

Hard gate:

- do not begin this phase until phases 1 through 3 are materially complete

Reason:

- the main template depends on stable components
- otherwise the shell will be designed around temporary component behavior
- that causes rework and weak package boundaries

## What This Order Protects

This order protects the project from:

- turning `UI Lab` into the product too early
- freezing unstable design decisions
- polluting `ui-kit` with app-shaped code
- designing the main shell before primitives are reliable
- mixing donor extraction with layout approval

## Theme And Color Note

Theme and color direction may still evolve later.

That does not change the execution order above.

Color revision is allowed, but it must not be used as a reason to skip:

- donor extraction
- component review
- missing shared-layer creation

## Current Operating Interpretation

Right now the team should work with this interpretation:

1. finish taking the needed donor components and patterns
2. review them in `UI Lab` and correct them
3. add missing shared primitives or layers only where donor coverage is insufficient
4. after that, design and build the main system template

This is the canonical frontend UI work order until explicitly replaced.
