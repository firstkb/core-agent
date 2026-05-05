# UI Lab Guide

Status: active guide
Owner: frontend
Last audited: 2026-04-25
Canonical scope: UI Lab route, section model, review coverage, and editing rules

This guide is the active read path for `platform-admin-web` UI Lab usage.
It compacts the older UI Lab structure and UI Kit coverage docs into one guide.

UI Lab is a review and documentation surface for frontend foundations.
It is not the product shell, not a second product app, and not the approval source for `ui-kit` promotion.
Use `platform/frontend/docs/contracts/ui-kit.md` for UI Kit approval boundaries.

Read with:

- `platform/frontend/docs/contracts/ui-kit.md`
- `platform/frontend/docs/contracts/package-boundaries.md`
- `platform/frontend/docs/proposals/deferred-composed-surfaces.md` only for future workflow-shaped surfaces

## Code Surfaces

Runtime route:

- `/root/ui-lab`

Implementation:

- `platform/frontend/apps/platform-admin-web/src/internal/ui-lab`

Route wiring:

- `platform/frontend/apps/platform-admin-web/src/app/private-app.tsx`

Primary package under review:

- `platform/frontend/packages/ui-kit`
- `platform/frontend/packages/design-tokens`

## Retired Inputs

This guide replaces the default read role of the old UI Lab structure, UI Kit
coverage, foundation rollout, and Phase E gap-review root docs.
Those pointer-only files were deleted after compaction.

Use git history only when auditing exact old text.

## Purpose

UI Lab exists to:

- validate donor extraction before promotion into `ui-kit`
- review stable, provisional, and app-layer candidates in one controlled place
- inspect light and dark presentation of reusable primitives
- document component states, accessibility notes, props shape, and usage guidance
- keep AI and human review focused on current frontend foundations

UI Lab must not become:

- a clone of the future admin interface
- a warehouse for every product page fragment
- the source of truth for product routing, auth, tenant behavior, or app shell policy
- a reason to promote unstable screen compositions into `ui-kit`

## Folder Layout

The implementation folder is intentionally split by concern:

- `index.tsx`: route module entry and page composition.
- `model/`: canonical leaf metadata, section metadata, navigation filtering, and status helpers.
- `hooks/`: local lab state and interaction orchestration.
- `components/`: lab-only shell pieces and docs helpers.
- `panels/`: section-level documentation panels and component-deep pages.
- `styles/`: lab-only CSS split by shell, content, theme loading, and sidebar refinements.

When adding a new panel or docs page, update the metadata model instead of hardcoding menu behavior inside a component.

## Canonical Sections

Current sidebar sections are:

- `foundations`: tokens, typography, spacing, radius, shadows, surface rules, icon rhythm, layout grid, `kbd`, and `code`.
- `form-controls`: form primitives, field layout, form shell, validation/helper states, and review-stage input helpers.
- `overlay-contracts`: menu, context menu, popover, tooltip, dialog, drawer, sheet, hover card, and alert dialog.
- `navigation-primitives`: breadcrumb, link, tabs, secondary tabs, pagination, collapsible, accordion, tree view, stepper, page toolbar, and sidebar tree review.
- `data-display`: cards, badges, avatar/identity, rating, scroll/separator helpers, table primitives, table states, column helpers, and compact filter chips.
- `states`: alert, progress, skeleton, empty/search/guided/collection/table loading, and generic error states.
- `inventory`: donor extraction status, stable/provisional/app-layer classification, and next candidate review notes.

There may also be an `overview` panel/leaf for the lab landing experience.
Do not treat it as a product dashboard contract.

## Coverage Rules

Coverage should answer what UI Lab can review without inventing new product contracts.

Stable coverage should focus on:

- approved primitives and low-risk shared patterns from `contracts/ui-kit.md`
- token and design-system behavior from `design-tokens`
- component states: default, hover, focus, disabled, invalid, empty, loading, and error where relevant
- usage guidance: when to use, when to avoid, props/API notes, accessibility notes, and layout constraints

Provisional coverage is allowed only when clearly marked as review-stage.
Examples include searchable choice helpers, richer data-display patterns, activity/timeline-style surfaces, and app-shell transport/loading experiments.

App-layer examples are allowed only as review references.
Their physical presence in UI Lab does not make them reusable package contracts.

## Closed Foundation Lessons

The first foundation rollout and gap review are closed.
UI Lab remains the verification surface for stable primitives, not a place to restart rollout phases.

Durable lessons:

- foundations pages should reflect live token files, not stale preview values
- stable examples must avoid invalid ids, missing labels, and misleading demo markup
- form examples should not trigger browser validation or accessibility issues
- preview wrappers should make component behavior clear without pretending every sample is a product card
- overlay, data-display, navigation, and state examples should use reusable documentation language, not route-specific copy
- state examples should use generic recovery language that can be reused across modules
- light, dark, desktop, and mobile presentation must stay reviewable before stable reuse

## Section-Specific Rules

Foundations:

- Show token usage and baseline layout rules.
- Do not invent decorative components that bypass `design-tokens`.

Form Controls:

- Keep examples generic and accessible.
- Do not encode tenant, billing, audit, or product workflow behavior.
- Treat `date-picker` as the user-facing date contract; lower-level date/calendar layers are review or implementation detail.

Overlay Contracts:

- Keep overlay examples generic and reusable.
- Separate alert confirmations, contextual popovers, transient hints, side surfaces, and mobile drawers clearly.

Navigation Primitives:

- `tree-view` may be reviewed as the generic expandable hierarchy primitive.
- `tree-view` read-only examples may allow branch expansion, but must not add
  leaf activation, selection styling, or app navigation behavior.
- `sidebar-nav` may be reviewed as the shared nested navigation tree.
- Sidebar search, theme toggle, tenant switching, and shell chrome remain app-owned.
- Mobile shell behavior may wrap the tree in a `sheet`, but that does not create a separate navigation-only overlay contract.

Data Display:

- Keep table behavior generic: table primitives, sort/header affordances, pagination, column visibility, row/meta support, and generic states.
- Keep page-specific bulk workflows, investigation rails, route-bound filters, and host adapters outside `ui-kit`.

States:

- Review generic empty, search-empty, guided-empty, loading, table-loading, collection-loading, error, alert, progress, and skeleton behavior.
- Keep transport/app-shell loading policy separate unless the surface is explicitly review-stage.

Inventory:

- Use this section for classification and donor coverage notes.
- Do not turn it into a screen gallery or product backlog.

## Promotion Boundary

Promotion into `ui-kit` requires the UI Kit contract.
UI Lab can demonstrate readiness, but it does not approve by itself.

Promote only when:

- the surface is generic and product-owned
- at least two real surfaces need it, or it is clearly foundational
- the API can be named without route or domain language
- the interaction model is approved outside the current page
- UI Lab documents usage, accessibility, and avoid-cases

Keep a surface in app code when it is tied to one route, one product workflow, one donor composition, or one shell decision.

## Fill Order

When extending UI Lab:

1. fully cover stable components and low-risk patterns already in `ui-kit`
2. expose provisional patterns only as review material
3. keep app-only navigation and shell experiments outside `ui-kit`
4. keep product screen composition out of UI Lab

Before using coverage facts for implementation, verify current package exports and the relevant UI Lab panel code.

## Editing Rules For Agents

- Read `platform/frontend/docs/contracts/ui-kit.md` before changing shared primitives or promotion status.
- Prefer narrow changes in one panel/helper at a time.
- Keep demo controls accessible with labels, ids, and names where applicable.
- Do not add business workflows unless the page is explicitly marked review or app-layer.
- Do not use UI Lab to bypass package boundaries.
- Do not treat donor labels or Metronic page names as product contracts.
