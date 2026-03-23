# UI Lab UI Kit Coverage

Inventory of what already exists in `platform/frontend/packages/ui-kit` for `platform-admin-web` `/root/ui-lab`.

Implementation note:

- `UI Lab` runtime route: `/root/ui-lab`
- `UI Lab` implementation module: `apps/platform-admin-web/src/internal/ui-lab`

This document answers one question:

- what can `UI Lab` already show today without inventing new contracts

It does not redefine package boundaries. For promotion rules, see:

- `ui-kit-boundary-audit.md`
- `ui-lab-structure.md`

## Coverage Summary

Current usable inventory for `UI Lab` is strong enough to support the canonical sections.

- stable component families: 46
- low-risk reusable patterns: 14
- provisional surfaces currently available for review: 15
- first-circle stable primitives now begin to include `Anatomy / Props / Accessibility` reference notes in addition to previews

## Section Mapping

### Foundations

Primary source:

- `design-tokens`

Support already available in `ui-kit`:

- `badge`
- `card`
- `code`
- `kbd`
- `progress-bar`
- `skeleton`

Available but provisional:

- `stat-card`

Notes:

- typography, spacing, radius, shadows, and surface rules are token-first concerns
- `Foundations` now includes a dedicated `Layout Grid` page so shell, section, and width-containment rules stay visible alongside token docs
- `UI Lab` foundations should show token usage, not invent new decorative components
- `kbd` now has its own component-deep page so shortcut and keycap hints can be reviewed separately from token swatches
- `code` now has its own component-deep page so technical identifiers and inline system values can be reviewed separately from badges or note cards
- `Foundations` now reflects the live canvas, radius, and elevation baseline from `design-tokens` rather than stale preview-only values

### Form Controls

Already available in `ui-kit`:

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

Ready for immediate `UI Lab` coverage:

- default
- focus
- disabled
- invalid
- helper text
- component-deep page for `label`
- component-deep pages for `button`, `input`, `date-picker`, `select`, `checkbox`, and `switch`
- component-deep page for `input-otp`
- component-deep page for `slider`
- component-deep page for `textarea`
- component-deep page for `radio-group`
- component-deep page for `toggle`
- component-deep page for `toggle-group`
- component-deep pages for `field` and `form-shell`
- field-level validation matrices for `input` and `select`
- `field` now documents two base label placements: stacked by default and responsive inline for desktop-left/mobile-top forms
- `input` docs now show the responsive-inline label pattern directly, not only through generic field pages
- first-circle form primitives now include `Anatomy / Props / Accessibility` notes for internal documentation use
- `button`, `input`, `select`, `toggle`, and `toggle-group` now also expose compact `Props API` reference blocks

Available but provisional:

- `calendar`
- `combobox`
- `tag-input`

Notes:

- `calendar` remains a review-stage internal building block under the shared `date-picker` contract, not a separate primary approval target
- `select` remains the stable native shared choice control for short fixed lists
- `combobox` now covers searchable local data and caller-owned async query flows as a review-stage helper
- `tag-input` now covers both inline free-form entry and preset-only local tag picking as a separate review-stage helper rather than being folded into `select`
- `UI Lab` now presents one shared `date-picker` page instead of splitting single-date and range selection across separate leaves
- lower-level `date-field` and `date-range-field` layers still exist for composition and compatibility, but they are no longer treated as separate user-facing contracts

### Overlay Contracts

Already available in `ui-kit`:

- `alert-dialog`
- `hover-card`
- `menu`
- `context-menu`
- `popover`
- `tooltip`
- `dialog`
- `drawer`
- `sheet`

Ready for immediate `UI Lab` coverage:

- trigger patterns
- richer hover previews
- destructive confirmation overlays through `alert-dialog`
- confirmation dialogs
- mobile-first drawer previews
- small contextual popovers
- tooltip hints
- larger side surfaces through `sheet`
- component-deep page for `alert-dialog`
- component-deep page for `dialog`
- component-deep page for `drawer`
- component-deep page for `hover-card`
- component-deep pages for `menu`, `context-menu`, `popover`, and `tooltip`
- component-deep page for `sheet`
- overlay docs now include explicit `when to use / do / avoid` review matrices for `hover-card`, `menu`, `context-menu`, `popover`, `tooltip`, `dialog`, `drawer`, and `sheet`
- misuse-prone overlay pages now also include explicit `Do not use for` guidance so alert-dialog/hover-card/menu/context-menu/popover/tooltip/dialog/drawer/sheet stay clearly separated
- stable overlay pages now also include `Anatomy / Props / Accessibility` notes for internal documentation use
- `alert-dialog`, `menu`, `context-menu`, `popover`, `tooltip`, `dialog`, `drawer`, and `sheet` now expose compact `Props API` reference blocks

### Navigation Primitives

Already available in `ui-kit`:

- `accordion`
- `breadcrumb`
- `collapsible`
- `link`
- `page-toolbar`
- `sidebar-nav`
- `stepper`
- `tabs`
- `pagination`
- component-deep page for `accordion`
- component-deep pages for `breadcrumb`, `link`, `tabs`, and `pagination` now include usage review guidance, not just previews
- component-deep page for `page-toolbar`
- component-deep page for `collapsible`
- component-deep page for `stepper`
- stable navigation primitives now also include `Anatomy / Props / Accessibility` notes
- `accordion`, `breadcrumb`, `link`, `collapsible`, `sidebar-nav`, `stepper`, `tabs`, `pagination`, and `page-toolbar` now expose compact `Props API` reference blocks where applicable

Available but provisional:

- none at this layer right now

Must stay app-layer for now:

- sidebar search
- page theme toggle

Reason:

- `sidebar-nav` is now stable as the shared nested tree itself, but search and shell-specific chrome still remain app-owned
- mobile uses a left `sheet` shell around the same shared tree rather than a second navigation-only overlay primitive
- `secondary-tabs` still qualify as stable subordinate in-page navigation and should not replace durable sidebar hierarchy

### Data Display

Already available in `ui-kit`:

- `aspect-ratio`
- `avatar`
- `avatar-group`
- `rating`
- `card`
- `filter-chip`
- `badge`
- `inline-status`
- `status-dot`
- `scroll-area`
- `separator`
- `table`
- `table-meta-cell`
- `table-column-header`
- `table-pagination-bar`
- `table-column-visibility`

Available but provisional:

- `stat-card`
- `summary-pill-strip`
- `activity-feed`
- `timeline-feed`

Ready for immediate `UI Lab` coverage:

- table density
- row meta presentation
- predictable media and preview framing through `aspect-ratio`
- bounded scroll surfaces for dense local overflow
- richer table header composition through `table-column-header`
- stable page and rows-per-page rhythm through `table-pagination-bar`
- shared column personalization through `table-column-visibility`
- avatar sizes, fallback states, presence indicators, and grouped identity clusters
- compact score display through `rating`
- compact pressed-state collection controls through `filter-chip`
- status badges
- calm inline status markers
- mixed card and table surfaces
- component-deep page for `aspect-ratio`
- component-deep page for `avatar`
- component-deep page for `rating`
- component-deep pages for `card`, `filter-chip`, `badge`, `inline status`, `separator`, `scroll-area`, and `table`
- component-deep page for `table-column-header`
- component-deep page for `table-pagination-bar`
- component-deep page for `table-column-visibility`
- stable data-display primitives now also include `Anatomy / Props / Accessibility` notes
- `aspect-ratio`, `card`, `separator`, `scroll-area`, `table`, and `table-column-header` now expose compact `Props API` reference blocks
- `filter-chip` remains documented as the stable small control in this cluster, while heavier local compositions are now expected to be built in app code until real module work proves a shared need
- `badge`, `table`, and `table states` now include explicit usage review guidance alongside previews

Review note:

- `counting-number` was removed from `ui-kit` because motion density and metric emphasis still need more than one real product surface before any reintroduction
- `view-preset-bar` remains provisional in the inventory layer because saved-view semantics still look narrower than the rest of the approved data-display collection patterns

### States

Already available in `ui-kit`:

- `alert`
- `progress-bar`
- `skeleton`
- `empty-state`
- `search-empty-state`
- `guided-empty-state`
- `loading-state`
- `collection-loading-state`
- `table-loading-state`
- `error-state`
- `collection-empty-state`

Available but provisional:

- `top-loader`

Ready for immediate `UI Lab` coverage:

- generic route empty states
- inline and sectional alert feedback
- linear progress feedback for workflows and background tasks
- viewport transport activity through a controlled top loader with external `start()` and `done()` calls
- skeleton placeholders and grouped loading placeholders
- collection empty states
- generic loading states
- table loading states
- generic error states
- component-deep page for `progress`
- component-deep page for `skeleton`
- component-deep pages for `empty`, `loading`, and `error` state families
- state-family pages now include usage review guidance so `empty`, `loading`, and `error` are documented with adoption rules, not only previews
- state-family pages now also include `Props API` and `Reference notes`, which brings the generic empty/loading/error family up to the same approval depth as the first stable wave

Review note:

- after the first full `UI Lab` audit pass, generic `empty-state`, `search-empty-state`, `guided-empty-state`, `loading-state`, `collection-loading-state`, `table-loading-state`, `error-state`, and `collection-empty-state` now qualify for stable approval
- `collection-empty-state` was promoted once the highlight strip was constrained to short contextual items rather than dashboard-like metric blocks
- `top-loader` remains review-stage because transport semantics, silent-request policy, and real app-shell integration still need validation outside the lab

### Inventory Snapshot

This section is mostly documentation-backed.

Primary sources:

- `ui-kit-boundary-audit.md`
- `vendor/metronic-inventory.md`
- `ui-lab-structure.md`

What `ui-kit` contributes here:

- the inventory section can show classification summaries using stable primitives like `badge`, `card`, and `guided-empty-state`
- provisional pattern pages now use the same review format as the rest of `UI Lab`, including explicit promotion guidance
- `summary-pill-strip` and `view-preset-bar` now also expose compact `Props API` and `Reference notes` blocks while still remaining provisional
- date range behavior is now reviewed through the unified `date-picker` page instead of a separate inventory leaf

## Current Gaps

These are not blockers for `UI Lab`, but they are not yet fully closed.

- some provisional patterns exist in `ui-kit` but are not yet fully surfaced in `UI Lab`
- `UI Lab` search is a local lab utility and should not be treated as a reusable nav search contract

## Related Audits

- `ui-kit-boundary-audit.md`: package-boundary and provisional policy
- `ui-kit-stable-approved-audit.md`: current approval snapshot for stable shared primitives

## Recommended Fill Order For UI Lab

1. fully cover stable components and low-risk patterns already in `ui-kit`
2. expose provisional patterns only as review material, clearly marked
3. keep app-only navigation experiments outside `ui-kit`
4. keep product screen composition out of `UI Lab`

## Immediate Safe Candidates To Show More Clearly

Without changing package boundaries, `UI Lab` can still expand coverage for:

- `empty-state`
- `loading-state`
- `search-empty-state`
- `guided-empty-state`
- `collection-loading-state`
- `table-loading-state`
- `table-meta-cell`
- `table-sort-button`
- `kbd`
- `scroll-area`
- `table-column-header`
- `secondary-tabs` as stable subordinate navigation
- `summary-pill-strip` as provisional
- `view-preset-bar` as provisional
- deeper token/foundation documentation beyond swatches and surface notes
