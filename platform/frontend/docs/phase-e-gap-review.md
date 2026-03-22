# Phase E Gap Review

Grounded gap review after the foundation rollout, the first full `UI Lab` pass, and the current stable approval cycle.

This document exists to answer one question:

- what is actually missing before the next shared component wave begins

It does not replace:

- `foundation-rollout-plan.md`
- `ui-kit-boundary-audit.md`
- `ui-kit-stable-approved-audit.md`

## Scope

This review was based on:

- the current foundation and approval docs
- the current `ui-kit` inventory
- actual usage in `platform-admin-web`
- actual usage in `tenant-web`

The goal is to avoid inventing new shared layers when the real need is:

- promotion of an existing provisional pattern
- leaving something in app-layer on purpose
- keeping a review-stage utility provisional

## Decision Summary

Current verdict:

- there is no urgent net-new shared primitive that must be created immediately to unblock the next UI phase
- the strongest next work is not new component invention
- the strongest next work is targeted review and possible promotion of a small set of already-existing provisional patterns with real multi-surface reuse

Progress note after the first two Priority 1 review passes:

- `page-toolbar` is now promoted
- `filter-chip` is now promoted
- `view-preset-bar` remains provisional on purpose

Post-component audit note:

- `data-toolbar`, `detail-panel`, `filter-rail`, and `summary-strip` were removed from `ui-kit` after the follow-up component review
- they should now be composed locally from smaller primitives until real module design proves the need
- `counting-number` was also removed from `ui-kit` because numeric motion still lacks enough real-surface validation
- `filter-chip` remains the only stable keeper in this cluster because it still behaves like a small distinct control rather than a page-shaped composition

Meaning:

- `Phase E` is real, but it currently points to refinement and promotion work before invention
- the current system is already broad enough that forced expansion would likely create noise rather than solve a true shared gap
- the current cycle is now complete because the strongest promotion targets were processed and the remaining provisional items are intentional

## Observed Reuse Signals

### Strong Multi-Surface Reuse Already Present

These are already used across more than one real surface and are the strongest next candidates for promotion work.

#### `page-toolbar`

Observed in:

- `apps/platform-admin-web/src/pages/dashboard/page.tsx`
- `apps/platform-admin-web/src/widgets/admin-surface-contract/admin-surface-contract.tsx`
- `apps/platform-admin-web/src/widgets/admin-table-surface-contract/admin-table-surface-contract.tsx`
- `apps/tenant-web/src/pages/home/page.tsx`

Verdict:

- not a missing shared layer
- already real enough to review for promotion

#### `filter-chip`

Observed in:

- `apps/platform-admin-web/src/pages/dashboard/page.tsx`
- `apps/platform-admin-web/src/widgets/admin-surface-contract/admin-surface-contract.tsx`
- `apps/platform-admin-web/src/widgets/admin-table-surface-contract/admin-table-surface-contract.tsx`
- `apps/platform-admin-web/src/widgets/tenant-operations-workbench/tenant-operations-workbench.tsx`

Verdict:

- generic enough to keep moving toward approval
- does not justify a new filter system on top

#### `view-preset-bar`

Observed in:

- `apps/platform-admin-web/src/pages/billing/page.tsx`
- `apps/platform-admin-web/src/pages/audit-log/page.tsx`

Verdict:

- real repeated use exists
- should be reviewed as a specific workflow helper, not replaced by a new generic navigation concept

### Reuse Exists, But Still Needs More Proof

These are real, but not yet strong enough to promote without a stricter review.

#### `timeline-feed`

Observed in:

- `apps/platform-admin-web/src/widgets/admin-surface-contract/admin-surface-contract.tsx`
- `apps/platform-admin-web/src/widgets/admin-table-surface-contract/admin-table-surface-contract.tsx`

Verdict:

- reused, but still concentrated in one family of list/detail investigation surfaces
- keep provisional until the feed proves itself outside that cluster

#### `date-range` behavior under `date-picker`

Observed through:

- `apps/platform-admin-web/src/pages/billing/page.tsx`
- `apps/platform-admin-web/src/pages/audit-log/page.tsx`

Verdict:

- this is not a separate component gap
- the right review target is the range behavior inside the approved `date-picker` contract

#### `summary-pill-strip`

Observed in:

- `apps/platform-admin-web/src/widgets/tenant-operations-workbench/tenant-operations-workbench.tsx`

Verdict:

- useful, but still single-surface today
- keep provisional

#### `toolbar-notice`

Observed in:

- `apps/platform-admin-web/src/widgets/tenant-operations-workbench/tenant-operations-workbench.tsx`

Verdict:

- useful local workflow helper
- not yet a proven shared layer

### Explicitly Not Proven Enough

These should remain provisional and should not trigger new shared work right now.

#### `calendar`

Verdict:

- stays an internal building block under `date-picker`
- not a separate user-facing gap

#### `counting-number`

Verdict:

- removed from `ui-kit`
- reconsider only if real module work proves lightweight numeric motion is necessary

#### `table-column-visibility`

Verdict:

- still tied to table personalization decisions that are not yet settled
- not ready for promotion or expansion

#### `activity-feed`

Observed in:

- `apps/platform-admin-web/src/widgets/tenant-activity-feed/tenant-activity-feed.tsx`

Verdict:

- single-surface today
- keep provisional

#### `stat-card`

Observed in:

- `apps/platform-admin-web/src/widgets/tenant-portfolio-stats/tenant-portfolio-stats.tsx`

Verdict:

- single-surface today
- keep provisional

## App-Layer Repetition That Still Does Not Justify Promotion

Some local CSS and widget structures repeat, but they still do not yet prove a clean shared contract.

Examples:

- `admin-web__page-flow-*`
- `admin-web__contract-*`
- `admin-web__tenant-*`
- `admin-web__surface-summary-*`

Current reading:

- these show real composition pressure
- but most of them are still route-shaped or workflow-shaped
- promoting them now would likely freeze product layout decisions too early

## Structured Shortlist

### Priority 1. Review For Promotion Next

These are the strongest next candidates and should be reviewed before inventing anything new:

Completed in the first pass:

1. `page-toolbar`
2. remove `data-toolbar`
3. remove `detail-panel`

Completed in the second pass:

4. `filter-chip`
5. remove `filter-rail`
6. remove `summary-strip`
Left provisional intentionally:

7. `view-preset-bar`

### Priority 2. Review After Priority 1

These are worth another pass, but do not need to move first:

1. `timeline-feed`
2. range behavior inside `date-picker`
3. `summary-pill-strip`
4. `toolbar-notice`

### Priority 3. Keep Provisional On Purpose

Do not promote these in the next cycle:

1. `calendar`
2. numeric motion utilities only if real module work proves the need
3. `table-column-visibility`
4. `activity-feed`
5. `stat-card`

## True Gap Verdict

Current verdict:

- no urgent net-new shared primitive is required before the next review wave

The most realistic future gap to watch is:

- a compact key-value summary or snapshot composition layer

Reason:

- local summary grids and detail snapshots appear in more than one place
- but they still do not yet have enough consistent shape to justify promotion now

So this is not an approved new task yet.
It is only the first emerging candidate to watch if repetition grows.

## Recommended Next Step After This Review

Do this next:

1. keep `view-preset-bar` provisional until its semantics prove broader than the current saved-view workflow use
2. keep Priority 2 provisional unless the review clearly proves broader reuse
3. do not create net-new shared components until a real product gap appears

Phase E closure note:

- this gap review is complete for the current cycle
- no urgent missing shared layer remains
- future work should proceed through targeted component review or module delivery until a real shared gap is proven

## What This Review Prevents

This review is meant to prevent:

- creating a new shared component only because a page looks repetitive
- turning route-specific workflow compositions into design-system primitives
- confusing provisional reuse with a true system gap
- expanding `ui-kit` when the real need is promotion discipline
