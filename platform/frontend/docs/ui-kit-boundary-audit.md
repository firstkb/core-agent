# UI Kit Boundary Audit

Decision audit for what belongs in `platform/frontend/packages/ui-kit` and what must stay in app-layer while Metronic extraction is still in progress.

## Core Rule

`ui-kit` is not a staging area for every donor pattern taken from Metronic.

Promote something into `ui-kit` only when it is:

- product-owned rather than vendor-shaped
- generic enough for more than one surface
- stable enough to survive design iteration
- free of page-specific wording, routing assumptions, and domain workflow coupling

If an element is still acting as a screen experiment, a page composition block, or a one-surface admin affordance, it stays in app code until the product contract is approved.

Phase D note:

- the foundation rollout and the first full `UI Lab` audit pass did not change this boundary split
- approval review may tighten or relax specific promotion decisions, but it does not turn app-layer candidates into `ui-kit` by default

## Stable To Keep In `ui-kit`

These are low-risk, reusable, and not tied to a specific admin flow.

### Components

- `accordion`
- `alert-dialog`
- `aspect-ratio`
- `avatar`
- `avatar-group`
- `badge`
- `breadcrumb`
- `button`
- `card`
- `checkbox`
- `collapsible`
- `code`
- `icons`
- `kbd`
- `stepper`
- `dialog`, `drawer`, and `sheet`
- `date-picker`
- `input`
- `input-otp`
- `label`
- `link`
- `menu`
- `context-menu`
- `hover-card`
- `pagination`
- `popover`
- `progress-bar`
- `radio-group`
- `rating`
- `sidebar-nav`
- `slider`
- `scroll-area`
- `inline-status`
- `status-dot`
- `toggle`
- `toggle-group`
- `separator`
- `select`
- `tabs`
- `switch`
- `table` primitives
- `table-pagination-bar`
- `table-column-visibility`
- `textarea`
- `tooltip`
- `skeleton`
- `alert`

### Low-Risk Patterns

- `collection-loading-state`
- `collection-empty-state`
- `empty-state`
- `error-state`
- `field`
- `filter-chip`
- `form-shell`
- `guided-empty-state`
- `loading-state`
- `page-toolbar`
- `search-empty-state`
- `secondary-tabs`
- `table-loading-state`

## Provisional In `ui-kit`

These are useful for donor extraction and live testing, but they are not yet canonical design-system commitments.

- `activity-feed`
- `calendar`
- `combobox`
- `stat-card`
- `summary-pill-strip`
- `tag-input`
- `top-loader`
- `timeline-feed`
- `toolbar-notice`
- `view-preset-bar`

Rule for this bucket:

- allowed for validation and donor extraction
- do not expand their API casually
- do not treat them as final design language
- if they remain single-surface or design-sensitive, move them back to app code later

Date note:

- `date-picker` is the stable user-facing contract
- lower-level `date-field` and `date-range-field` layers may remain in `ui-kit` for composition and compatibility, but they should not be treated as separate primary product components
- `calendar` also remains in `ui-kit` only as an internal review-stage building block under `date-picker`, not as a separate approved user-facing component

Choice-entry note:

- `select` remains the stable native shared contract for short fixed option sets
- searchable `combobox` and review-stage `tag-input` variants may live in `ui-kit` for review, but they are still provisional until their API and real-surface fit are proven

Transport note:

- `top-loader` may live in `ui-kit` as a review-stage shared viewport activity bar because it stays generic and caller-controlled
- keep global request coordination, silence policies, and API-wrapper wiring in app/runtime code rather than burying transport policy inside the component

Phase E note:

- `page-toolbar` remains a stable keeper in `ui-kit`
- `filter-chip` remains a stable keeper because it is still the clearest small pressed-state collection control in the current system
- `data-toolbar`, `detail-panel`, `filter-rail`, and `summary-strip` were removed from `ui-kit` after the component audit because they still read more like reusable compositions than final shared design language
- `counting-number` was also removed from `ui-kit`; motion-heavy numeric emphasis should be reintroduced only if real module work proves the need
- `view-preset-bar` remains provisional because its semantics still read more like saved-view workflow state than a broadly reusable base pattern

Icon note:

- keep only a small semantic icon set in `ui-kit`, including utility symbols and menu-safe navigation icons
- menu-safe entries may cover generic domains such as people, locations, facilities, transport, reports, settings, and help
- the same shared set may also cover generic section-level categories such as foundations, routes, records, and state monitoring when the names stay reusable
- component-internal chevrons, stars, carets, and other anatomy-specific SVGs may remain private to the owning primitive
- do not promote route-specific or donor-only illustrations into the shared icon set

## Must Stay In App Layer

Do not promote these by default:

- tenant-specific filter groups
- billing-specific workflow controls
- audit-specific investigation presets
- admin-only summary bars
- route-specific section tabs
- table orchestration wrappers tied to one page flow
- donor screen compositions from Metronic dashboards
- sidebar search, theme toggle, and shell-specific chrome around `sidebar-nav`

These belong in `apps/platform-admin-web/src/widgets` or `apps/platform-admin-web/src/pages` until the product contract is explicitly approved.

## Promotion Checklist

Promote an item from app-layer or provisional status into canonical `ui-kit` only when all of the following are true:

- it is used by at least two real surfaces or is clearly foundational
- the API can be named without tenant, billing, audit, or page-specific language
- the interaction model is approved independently from the current page design
- it can be documented as a reusable contract rather than a screen fragment

## Donor Extraction Order From Metronic

Priority should stay on elements with the highest reuse and lowest design risk.

### High Priority

1. table contract and table primitives
2. pagination
3. dropdown or menu primitives
4. popover and tooltip
5. switch or toggle controls
6. skeleton and richer loading states

### Medium Priority

1. tabs
2. breadcrumb
3. inline notice or alert
4. date or date-range controls
5. stats and dashboard cards

### Low Priority

1. donor page compositions
2. marketing or demo sections
3. settings shells that assume a fixed product layout

## Note On Table

Yes, table is one of the strongest future candidates for a real `ui-kit` standard.

Reason:

- large admin products depend on table consistency more than almost any other UI surface
- sorting, density, selection, row meta, bulk actions, and empty states benefit from one contract
- table behavior is expensive to reinvent per page

So the target is not "copy Metronic tables as-is". The target is to take the useful donor behavior from Metronic and turn it into the table contract we actually want.

This approved table layer now includes richer helpers like `table-column-header`, `table-pagination-bar`, and `table-column-visibility` where they stay generic and semantically table-bound.
