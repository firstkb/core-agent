# Foundation Rollout Plan

Working plan for introducing the frontend visual foundation before the main system template.

This plan is subordinate to:

- `ui-delivery-order.md`

It does not replace the delivery order.

It defines how the foundation itself should be introduced so the resulting system stays:

- light to run
- visually disciplined
- understandable to future AI agents

## Primary Goal

Build a calm enterprise-grade visual foundation that makes the base primitives reliable before module-level UI work starts.

## Hard Constraints

### 1. Performance First

Base components must remain easy to render and easy to reason about.

Rules:

- prefer native HTML behavior where it is good enough
- avoid heavy runtime abstractions in baseline controls
- keep DOM structure compact
- do not introduce large dependency layers just to style primitives
- do not add animation or visual effects that increase interaction cost without clear value

### 2. No Token Alias Layer

Do not duplicate the token structure with alias-on-top-of-alias naming.

Rules:

- one canonical token layer only
- one naming system only
- component styles should read from the canonical token names directly
- avoid parallel systems like `sm/md/lg` tokens plus separate numeric tokens for the same concern

Meaning:

- if the typography scale is numeric, use the numeric scale as the source of truth
- if the radius scale is semantic, use one semantic scale only
- do not maintain two parallel vocabularies for the same token family

### 3. Enterprise Visual Discipline

The system must not only be technically correct. It must also feel structurally correct for enterprise UI.

Rules:

- use calm surfaces
- use border-first separation
- keep shadows secondary
- keep typography compact and readable
- avoid decorative intensity in controls
- keep state semantics explicit and consistent across light and dark themes

### 4. AI-Agent Readability

The foundation must be easy for AI agents to apply correctly during later module work.

Rules:

- token names must be explicit
- component contracts must stay small
- stable examples must exist in `UI Lab`
- usage guidance must be documented where misuse is likely
- package boundaries must stay obvious

## Visual Baseline To Adopt

Current target baseline:

- light canvas: `#EFF4F7`
- dark canvas: `#0B1220`
- surface model: `canvas / surface / muted surface / elevated surface / overlay / nav`
- border-first separation
- primary and info must stay clearly separated
- light and dark themes must use the same semantic roles

## Current Rollout Status

Status as of the current foundation pass:

- `Phase A` is complete
- `Phase B` is complete for the current core primitive baseline
- `Phase C` is complete for the first full `UI Lab` audit pass
- `Phase D` is complete for the current approval cycle
- `Phase E` is complete for the current gap-review cycle
- `Phase F` is now ready whenever module work begins

What is already done:

- canonical token vocabulary is live under `packages/design-tokens`
- light and dark themes share the same semantic role model
- core primitives already restyled onto the new foundation baseline
- `UI Lab` is already running on the new foundation and is being re-audited as the truth surface

What is currently true after the first full `UI Lab` audit pass:

- `required` uses label marker and a retained left field accent in the shared form layer
- `Form Controls` already passed the first cleanup wave for browser issues and misleading demo markup
- `Overlay Contracts` already passed a first targeted content and behavior review
- `Data Display` already passed a first targeted content and visual review
- `Navigation Primitives` already passed a first targeted content and example review
- `States` already passed a first targeted content and recovery-language review
- `Foundations` now reflects the live token layer instead of stale preview values
- formal approval review is now focused on stable versus provisional sync, not on more foundation rework

Foundation rollout closure note:

- the foundation rollout itself is now complete through `Phase E`
- remaining provisional patterns are intentional and do not block downstream work
- future component-by-component review and module work should not reopen this rollout unless the foundation itself changes materially

## Required Foundation Decisions

These decisions should be treated as part of the rollout, not as optional polish.

### Required State

Current audit baseline:

- required marker in the label
- retained left accent in shared field demos and controls

Future simplification target:

- validate whether the label marker alone is sufficient after the component review phase

### Button Baseline

Use:

- no default shadow for ordinary buttons
- compact enterprise sizing
- primary only for the strongest local action

### Input Baseline

Use:

- calm hover
- explicit focus ring
- restrained radius
- helper/error rhythm from the field shell

## Rollout Phases

### Phase A. Freeze The Canonical Token Vocabulary

Status:

- complete

Goal:

- lock the token structure before restyling components

Actions:

- replace the current partial token set with the agreed foundation roles
- separate color, typography, radius, spacing, motion, and elevation cleanly
- move shadow tokens out of motion concerns if needed
- keep one naming system per token family

Expected output:

- one canonical token vocabulary under `packages/design-tokens`
- no duplicate alias layer

### Phase B. Apply Tokens To The Core Primitive Layer

Status:

- complete for the current baseline pass

Goal:

- make the most reused primitives match the foundation baseline first

Priority order:

1. `button`
2. `input`
3. `select`
4. `textarea`
5. `field`
6. `label`
7. `card`
8. `badge`
9. `inline-status`
10. `dialog / drawer / sheet`

Review focus:

- height
- padding
- radius
- typography
- hover
- focus
- invalid
- disabled
- dark theme parity

Expected output:

- core primitives aligned with the new foundation
- no extra API growth during restyling

Completed baseline families:

- `button`
- `input`
- `select`
- `textarea`
- `field`
- `label`
- `card`
- `badge`
- `inline-status`
- `checkbox / radio / switch / toggle`
- `dialog / drawer / sheet`
- overlay/details surface pass

### Phase C. Re-Audit Stable UI Lab Pages

Status:

- complete for the first full pass

Goal:

- verify the foundation on real examples before module work starts

Actions:

- revisit each stable primitive page in `UI Lab`
- remove invalid examples and misleading demo markup
- ensure forms do not generate browser issues
- ensure light and dark themes stay consistent
- ensure desktop and mobile layouts remain readable

Current working order inside this phase:

1. `Form Controls`
2. `Overlay Contracts`
3. `Data Display`
4. `Navigation Primitives`
5. `States`
6. `Foundations`

Current progress inside this phase:

- `Form Controls` completed first cleanup for invalid ids, labels, and date-field behavior
- showcase surfaces were moved onto card-like backgrounds so component previews read closer to real usage
- showcase wrappers no longer pretend to be nested mini-cards around every preview
- `Overlay Contracts` removed stale guidance and aligned examples to the shared overlay contract
- `Data Display` reduced misleading CTA weight and tightened semantic state examples
- `Navigation Primitives` replaced placeholder panel copy with reusable documentation language
- `States` tightened generic recovery and empty-state copy so examples stay reusable
- `Foundations` now reflects the live token files and current visual baseline more directly

Expected output:

- `UI Lab` as the visual and behavioral truth surface for stable primitives

### Phase D. Stable Approval Review

Status:

- complete for the current approval cycle

Goal:

- decide which components are truly ready for system-wide reuse after the foundation change

Actions:

- update `ui-kit-stable-approved-audit.md`
- update `ui-kit-boundary-audit.md`
- update `ui-lab-ui-kit-coverage.md`
- recheck any component whose contract changed materially

Current review direction:

- do not promote by default just because a component survived the foundation pass
- keep stable approvals where the contract remained small and coherent
- leave patterns with lighter docs or review-stage behavior in provisional buckets until a later pass proves more

Current progress inside this phase:

- generic state-family primitives now qualify for promotion after docs depth caught up in `UI Lab`
- `collection-empty-state` now qualifies for promotion after the highlight strip was constrained to short collection context instead of dashboard-style metric blocks
- `secondary-tabs` now qualifies for promotion as a stable subordinate navigation pattern because the API remained small and the hierarchy stayed explicit
- `progress-bar` remains stable approved and the docs are now synced to that decision
- `filter-chip` remains the stable keeper from the `Phase E` shortlist because it still reads as a distinct small control
- `data-toolbar`, `detail-panel`, `filter-rail`, and `summary-strip` were removed from `ui-kit` after the follow-up component review because they still overlap too closely with composition patterns that should be re-validated during real module design
- `table-column-visibility` still remains provisional because table personalization rules are still under review
- `summary-pill-strip` and `view-preset-bar` still remain provisional because their workflow fit and visual density need more multi-surface confirmation
- `calendar` remains provisional on purpose as an internal building block under `date-picker`, not as a standalone approval target
- `counting-number` was also removed from `ui-kit` because motion density still needs more than one real product surface before any shared reintroduction

Expected output:

- updated list of `stable approved` primitives
- explicit list of provisional components still under review

Completion note:

- the current approval boundary is now explicit enough to unblock gap review
- remaining provisional items are intentional review-stage choices, not unresolved approval ambiguity

### Phase E. Gap Filling Only After Re-Audit

Status:

- complete for the current cycle

Goal:

- create missing shared pieces only after the foundation is proven in the current primitives

Rules:

- do not invent large new components before this point
- create only real gaps
- prefer small reusable layers over product-shaped blocks

Current progress inside this phase:

- the initial gap review now exists in `phase-e-gap-review.md`
- no urgent net-new shared primitive has been identified yet
- the current strongest next move is a targeted review of already-existing provisional patterns with real multi-surface reuse
- the final outcome of the Priority 1 review cycle is:
  - keep `page-toolbar`
  - keep `filter-chip`
  - remove `data-toolbar`, `detail-panel`, `filter-rail`, and `summary-strip` from `ui-kit`
- `view-preset-bar` remains intentionally provisional because its saved-view semantics still overlap too closely with workflow-specific page state
- `calendar`, `table-column-visibility`, `activity-feed`, and `stat-card` remain intentionally provisional after the gap review
- `counting-number` was removed from `ui-kit` instead of being kept provisional

Working conclusion:

- do not start a new shared component wave yet
- the initial Priority 1 shortlist has now been processed
- do not start a new shared component wave unless a real product gap appears

Completion note:

- `Phase E` is closed for the current cycle
- the remaining provisional items are intentional and not blockers
- further work should move into component-specific review or module delivery, not back into blind shared-component expansion

Examples:

- missing form helper
- missing table helper
- missing overlay utility
- missing layout contract

### Phase F. Module-Oriented UI Development

Status:

- ready when module work begins

Goal:

- start real module work only after the foundation and primitive layer are stable enough

Rules for future AI-agent work:

- modules must consume the stable token vocabulary directly
- modules must prefer approved primitives from `ui-kit`
- module-specific layout or workflow logic must stay outside shared primitives
- if an agent needs a new shared component, it must first prove the gap

Expected output:

- module UIs built on stable shared contracts instead of ad hoc styling

Document closure note:

- this rollout plan is now closed as the foundation-introduction document
- use it as a recorded baseline and decision log
- continue future work through component review docs, approval audits, gap reviews, and module-specific delivery artifacts instead of extending the rollout phases unless the foundation itself is reopened

## Implementation Order Inside The Foundation

Recommended exact order:

1. tokens
2. field shell and input family
3. button family
4. card and surface family
5. overlay family
6. status and badge family
7. `UI Lab` verification pass
8. stable approval pass
9. gap filling
10. module work

## Stop Rules

Do not proceed to the next step if one of these is still false:

- the token vocabulary is not final
- core controls still disagree visually
- `UI Lab` still throws browser issues for stable examples
- dark mode for the stable baseline is not credible
- stable/provisional boundaries are unclear in docs

## What This Plan Protects

This plan protects the project from:

- building modules on unstable tokens
- teaching future AI agents two parallel styling systems
- overdesigning the shell before the control layer is stable
- growing `ui-kit` by visual improvisation
- shipping enterprise UI that is technically functional but visually inconsistent
