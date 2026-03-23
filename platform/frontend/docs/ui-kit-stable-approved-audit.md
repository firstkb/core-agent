# UI Kit Stable Approved Audit

Current approval snapshot for which `platform/frontend/packages/ui-kit` primitives are ready to be treated as stable shared contracts.

This document is stricter than `ui-kit-boundary-audit.md`.

- `ui-kit-boundary-audit.md` answers what is allowed to live in `ui-kit`
- this file answers what is already approved enough to be treated as stable shared UI

## Approval Rule

Mark a primitive as `stable approved` only when all of the following are true:

- it is product-owned and not vendor-shaped
- it is generic enough for more than one surface
- its API is already small and coherent
- it is documented in `UI Lab` with preview, usage guidance, and reference notes
- the current interaction model is unlikely to be undone by near-term layout work

## Phase D Review Note

After the foundation rollout and the first full `UI Lab` audit pass:

- no previously approved primitive has been demoted in the initial review
- first-circle stable primitives remain approved where the contract stayed small and coherent
- generic state-family primitives are now promoted where docs depth and reuse confidence caught up
- `collection-empty-state` and `secondary-tabs` are now promoted because their API stayed small and their shared role became clearer after the foundation pass
- denser workflow helpers and review-stage composition patterns remain provisional on purpose

## Stable Approved Now

These can be treated as approved shared contracts.

### Form And Action Primitives

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

Form note:

- `select` remains the approved lightweight native choice control
- searchable `combobox` and review-stage `tag-input` variants remain outside the stable approval set

### Feedback Primitives

- `alert`
- `progress-bar`

### Utility And Support Primitives

- `code`
- `icons`

### Navigation Primitives

- `accordion`
- `breadcrumb`
- `collapsible`
- `kbd`
- `link`
- `sidebar-nav`
- `stepper`
- `tabs`
- `pagination`

Sidebar note:

- `sidebar-nav` is now approved as the shared nested navigation tree itself
- search, theme toggles, tenant switching, and shell-specific sidebar chrome remain app-layer concerns

Icon note:

- approve only the small shared semantic icon set itself, including future menu-safe entries such as dashboard, reports, settings, and help
- the approved menu-safe subset may also cover generic domains such as people, locations, facilities, and transport when the symbol stays reusable across surfaces
- section-level taxonomy icons like spark, route-path, pulse, and document-list are also acceptable when they stay generic rather than tied to one app's menu wording
- keep component-internal structural icons private where they are part of one primitive's own anatomy

### Overlay Primitives

- `alert-dialog`
- `hover-card`
- `menu`
- `context-menu`
- `popover`
- `tooltip`
- `dialog`
- `drawer`
- `sheet`

### Data Display Primitives

- `aspect-ratio`
- `avatar` and `avatar-group`
- `badge`
- `card`
- `inline-status` and `status-dot`
- `rating`
- `scroll-area`
- `separator`
- `table` primitives

### Loading Support Primitives

- `skeleton`

### State Family Primitives

- `empty-state`
- `search-empty-state`
- `guided-empty-state`
- `loading-state`
- `collection-loading-state`
- `table-loading-state`
- `error-state`
- `collection-empty-state`

### Low-Risk Navigation And Display Patterns

- `secondary-tabs`

### Shared Page And Collection Patterns

- `page-toolbar`
- `filter-chip`

Note on `table`:

- approve the shared table primitive layer itself
- this now includes richer helpers such as `table-column-header`, `table-pagination-bar`, and `table-column-visibility` in addition to sort and meta-cell support
- keep page-specific orchestration such as bulk workflows, investigation rails, and route-bound filter bars outside this approval

## Provisional, Not Approved Yet

These may remain in `ui-kit` for donor extraction and review, but they are not approved shared design-system commitments.

- `summary-pill-strip`
- `view-preset-bar`
- `activity-feed`
- `calendar`
- `combobox`
- `timeline-feed`
- `stat-card`
- `tag-input`
- `toolbar-notice`

Rule:

- allowed in `ui-kit`
- useful in `UI Lab`
- not approved as final shared language

Date note:

- `calendar` remains an internal review-stage building block under `date-picker`
- do not treat `calendar` as a separate primary promotion target unless month-grid interaction proves necessary across more than one real product surface

## Must Stay Outside Approval Scope

These are not approval candidates right now:

- sidebar search
- page theme toggle
- tenant-specific filters
- billing-specific presets
- audit-specific investigation controls
- route-specific page compositions

These remain app-level references or workflow-specific surfaces.

## Immediate Next Approval Candidates

If another approval pass is needed, the next likely candidates for `stable approved` are:

1. `view-preset-bar` only if its saved-view semantics prove broader than the current route-specific review flows
2. `summary-pill-strip`

## Promotion Warning

Do not treat `stable approved` as permission to expand APIs casually.

Approval means:

- safe to reuse
- safe to document as canonical
- safe to rely on in multiple surfaces

It does not mean:

- add variants freely
- move page-specific behavior into the primitive
- treat every donor-inspired pattern as approved by association

Note on date contracts:

- `date-picker` is the approved user-facing contract for choosing either one date or a range
- lower-level `date-field` and `date-range-field` layers may remain in `ui-kit` as implementation and compatibility surfaces, but they should not be treated as separate primary approvals
- `calendar` follows the same rule and remains an internal composition layer under `date-picker`

## Phase E Review Note

After the stricter follow-up audit:

- `filter-chip` remains the only stable keeper from that cluster
- `data-toolbar`, `detail-panel`, `filter-rail`, and `summary-strip` were removed from `ui-kit`
- those surfaces should now be composed locally from primitives like `card`, `button`, `input`, `badge`, and `filter-chip`
- `counting-number` was also removed from `ui-kit` and should be reconsidered only if real module work proves lightweight numeric motion is necessary
- `view-preset-bar` remains provisional because its saved-view semantics still overlap too closely with workflow-specific page state
