# UI Kit Contract

Status: active
Owner: frontend
Last audited: 2026-04-25
Canonical scope: frontend UI Kit boundary, promotion rules, stable approval set, layout baseline, and UI delivery order

This contract is the active source for `@platform/ui-kit` governance.
It compacts the older UI delivery, layout baseline, boundary audit, and stable approval docs into one read path.

## Code Surfaces

Shared package:

- `platform/frontend/packages/ui-kit`
- `platform/frontend/packages/design-tokens`

Review surface:

- `platform/frontend/apps/platform-admin-web/src/internal/ui-lab`

Tracked companion docs:

- `platform/frontend/docs/contracts/package-boundaries.md`
- `platform/frontend/docs/guides/ui-lab.md`

## Supersedes

This contract supersedes the active-read role of:

- `platform/frontend/docs/ui-delivery-order.md`
- `platform/frontend/docs/layout-baseline.md`
- `platform/frontend/docs/ui-kit-boundary-audit.md`
- `platform/frontend/docs/ui-kit-stable-approved-audit.md`

It also carries durable foundation and gap-discipline lessons from:

- `platform/frontend/docs/foundation-rollout-plan.md`
- `platform/frontend/docs/phase-e-gap-review.md`

Use old docs only for historical audit detail.

## Core Boundary

`ui-kit` is for product-owned reusable UI primitives and low-risk reusable patterns.

Promote into `ui-kit` only when the surface is:

- vendor-free and product-owned
- generic enough for more than one real surface, or clearly foundational
- stable enough to survive near-term design iteration
- documented in UI Lab with usage guidance
- free of routing, auth, tenant, billing, audit, or page-specific workflow coupling

Do not use `ui-kit` as:

- a donor-code staging area
- a product page composition layer
- a route-specific workflow layer
- a place for app shell policy, auth policy, request orchestration, or tenant behavior

App-specific composition stays in app code until a new contract promotes it.

## Delivery Order

Frontend UI work follows this order:

1. extract needed donor primitives and low-risk patterns
2. review and correct them in UI Lab
3. fill only real primitive/shared-layer gaps
4. build the main product shell/template after the component base is mature

Do not start the main system template early.
Do not use theme/color revision as a reason to skip extraction, review, or gap validation.

## Foundation Baseline

The foundation rollout is closed for the current cycle.
Do not reopen it unless the token system, visual baseline, or core primitive contract materially changes.

Foundation rules:

- prefer native HTML behavior where it is good enough
- keep baseline controls light, compact, and easy to reason about
- avoid heavy dependency layers just to style primitives
- avoid animation or visual effects without clear interaction value
- keep one canonical token layer under `design-tokens`
- do not introduce alias-on-alias token vocabularies or parallel naming systems for the same token family
- use calm surfaces, border-first separation, compact readable typography, and shadows as secondary emphasis
- keep state semantics explicit and consistent across light and dark themes
- keep primary and info roles visually distinct

Core primitive baseline:

- required state uses label-level marking and the shared field rhythm
- ordinary buttons do not use default shadow
- primary buttons are reserved for the strongest local action
- inputs use calm hover, explicit focus, restrained radius, and field-shell helper/error rhythm

## Layout Baseline

Use a small explicit layout system, not a Bootstrap-style grid clone.

Canonical layout roles:

- App shell: explicit sidebar width and `minmax(0, 1fr)` content column.
- Content container: one column by default.
- Section grid: one column by default; two columns only for real side-by-side comparison.
- Form grid: use `FormGrid`; only one or two columns; collapse to one on small screens.
- Inline control row: may wrap in height, but must not expand parent width.
- Rail/panel layout: bounded local surfaces, not page shells.
- Summary/preset rows: one column on mobile, two columns on desktop; avoid fluid dashboard behavior.

Width stability defaults:

- use `min-width: 0` for grid/flex children that may contain long text
- use `width: 100%` for bounded shared surfaces
- avoid `repeat(auto-fit, minmax(...))` and `repeat(auto-fill, minmax(...))` in shared patterns unless a focused review proves the need

## Stable Approved Set

These may be treated as stable shared contracts.

Form and action:

- `button`
- `input`
- `input-otp`
- `date-picker`
- `label`
- `select`
- `textarea`
- `checkbox`
- `radio-group`
- `slider`
- `switch`
- `toggle`
- `toggle-group`
- `field`
- `form-shell`

Feedback, utility, and support:

- `alert`
- `progress-bar`
- `code`
- `icons`
- `skeleton`

Navigation:

- `accordion`
- `breadcrumb`
- `collapsible`
- `kbd`
- `link`
- `sidebar-nav`
- `stepper`
- `tabs`
- `pagination`

Overlays:

- `alert-dialog`
- `hover-card`
- `menu`
- `context-menu`
- `popover`
- `tooltip`
- `dialog`
- `drawer`
- `sheet`

Data display:

- `aspect-ratio`
- `avatar`
- `avatar-group`
- `badge`
- `card`
- `inline-status`
- `status-dot`
- `rating`
- `scroll-area`
- `separator`
- `table`
- `table-column-header`
- `table-pagination-bar`
- `table-column-visibility`

State and low-risk patterns:

- `empty-state`
- `search-empty-state`
- `guided-empty-state`
- `loading-state`
- `collection-loading-state`
- `table-loading-state`
- `error-state`
- `collection-empty-state`
- `secondary-tabs`
- `page-toolbar`
- `filter-chip`

Approval means safe to reuse and document as canonical.
It does not permit casual API expansion or page-specific behavior inside the primitive.

## Provisional Set

These may live in `ui-kit` for review and donor extraction, but they are not stable shared design-system commitments:

- `summary-pill-strip`
- `view-preset-bar`
- `activity-feed`
- `calendar`
- `combobox`
- `timeline-feed`
- `stat-card`
- `tag-input`
- `toolbar-notice`
- `top-loader`

Rules:

- do not expand their APIs casually
- verify UI Lab coverage and real-surface fit before reuse
- move them back to app code if they remain single-surface or workflow-specific

`date-picker` is the approved user-facing date contract.
Lower-level `date-field`, `date-range-field`, and `calendar` may remain implementation/review-stage layers, but they are not separate primary product approvals.

## App-Layer Or Not Approved

Keep these out of stable `ui-kit` by default:

- tenant-specific filter groups
- billing-specific workflow controls
- audit-specific investigation controls
- admin-only summary bars
- route-specific section tabs
- table orchestration wrappers tied to one page flow
- donor dashboard/page compositions
- sidebar search, theme toggle, tenant switching, and shell-specific chrome around `sidebar-nav`

These are not stable approval candidates right now:

- `data-toolbar`
- `detail-panel`
- `filter-rail`
- `summary-strip`
- `counting-number`

If code still contains review-stage or removed-candidate surfaces, their physical presence is not approval.
Treat this contract as the approval boundary and verify exports plus UI Lab coverage before use.

## Promotion Checklist

Promote a provisional or app-layer surface only when all are true:

- it is used by at least two real surfaces or is clearly foundational
- its API can be named without domain or route language
- its interaction model is approved independently from the current page
- it can be documented as a reusable contract
- it does not move routing, auth, transport, or shell policy into `ui-kit`

## Gap Discipline

The closed foundation/gap review found no urgent net-new shared primitive required before module work.
Do not start a new shared-component wave by default.

Before inventing a component:

- verify whether an approved primitive already solves the need
- review existing provisional candidates before adding a new surface
- keep repeated page CSS or widget shape in app code until it proves a route-neutral contract
- treat local summary grids, detail snapshots, workflow toolbars, rails, and page filters as composition pressure, not automatic `ui-kit` candidates

Current durable outcome:

- `page-toolbar` and `filter-chip` are stable shared patterns
- `view-preset-bar` remains provisional because saved-view semantics are workflow-shaped
- `data-toolbar`, `detail-panel`, `filter-rail`, `summary-strip`, and `counting-number` are not approved shared contracts

## Table Rule

The table primitive layer is approved because admin products need consistent table behavior.

Approved table scope includes:

- table primitives
- sort/header affordances
- table pagination bar
- column visibility helper
- generic row/meta cell support
- generic empty/loading states

Keep page-specific bulk workflows, investigation rails, route-bound filter bars, and host adapters outside `ui-kit`.

## UI Lab Rule

UI Lab is the review and documentation surface for `ui-kit`.
It is not the product shell and must not become the default product page pattern by accident.
