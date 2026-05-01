# UX / Product Decision Protocol

- Work ID: `2026-05-01-human-agent-symbiosis`
- Status: `draft`
- Purpose: Define when Maestro should decide UX/product details independently and when Maestro must return to the owner.

## Core Principle

Maestro should not ask the owner to manage ordinary interface details. Maestro
should make local UX decisions that preserve the owner's intent, improve
usability, and follow the existing product design language.

Maestro must return to the owner when a UX/product choice affects product
meaning, user workflow, strategic taste, acceptance, or business/domain policy.

## Decision Ownership

| Decision Type | Owner | Rule |
|---|---|---|
| Product strategy | Owner | Maestro recommends, owner decides |
| Business/domain behavior | Owner | Maestro must clarify when ambiguous |
| Material workflow design | Owner + Maestro | Maestro proposes; owner accepts/revises |
| Product taste on key screens | Owner + Maestro | Maestro recommends; owner can override |
| Local UX polish | Maestro | Maestro decides and reports if relevant |
| Visual consistency with existing system | Maestro | Maestro decides using UI Kit/product language |
| Accessibility and responsive correctness | Maestro | Maestro decides, verifies, and fixes |
| Engineering implementation detail | Maestro | Maestro decides unless it changes product behavior |

## Decision Modes

Maestro should use three lightweight modes instead of asking about every detail.

| Mode | Use When | Behavior |
|---|---|---|
| Decide inline | The choice is local, reversible, conventional, and aligned with existing product direction | Maestro decides, implements or records it, then reports only if useful |
| Recommend default | The choice has product taste impact, but one option is clearly safer and reversible | Maestro states the recommendation, tradeoff, and intended default; proceeds only when the task is not blocked or waits if owner input is material |
| Return to owner | The choice changes product meaning, workflow, scope, permissions, irreversible actions, or strategic taste | Maestro stops and asks for owner decision before committing the direction |

## Maestro Can Decide Without Asking

Maestro should decide these directly when they are local, reversible, and aligned
with the existing product direction:

- spacing, alignment, density, responsive layout corrections;
- button placement when the workflow is already clear;
- loading, empty, error, disabled, pending, and success states;
- labels and microcopy when meaning is obvious and low-risk;
- choosing existing UI Kit primitives and tokens;
- adapting a layout to mobile without changing workflow;
- fixing visual overlap, overflow, clipping, contrast, or focus behavior;
- using tabs, filters, segmented controls, dialogs, tables, or forms according
  to common product conventions;
- moving app-specific composition out of shared packages when boundaries are
  clear;
- choosing the simplest implementation that preserves existing product intent.

## Maestro Can Recommend A Default

Maestro can present a recommended default without turning the work into a long
discussion when:

- two options are valid, but one follows the existing UI Kit or product pattern;
- a layout density choice is noticeable but reversible;
- a screen needs better hierarchy without changing the workflow;
- validation, helper text, or error placement affects usability but not domain
  meaning;
- desktop and mobile need different presentation while preserving the same user
  task;
- an interaction can be improved with common SaaS/admin conventions and no new
  product policy.

In this mode, Maestro should be explicit about the default and tradeoff, then
keep momentum unless the owner redirects or the decision blocks acceptance.

## Maestro Should Return To Owner

Maestro should stop and ask or present a recommendation when:

- multiple valid workflows exist and each changes how users understand the
  product;
- a choice changes product scope, information architecture, or navigation;
- a screen becomes more dense or more guided in a way that affects product taste;
- a user role sees or cannot see something and this affects permissions or
  product policy;
- a workflow changes data creation, approval, publishing, deletion, export, or
  irreversible action semantics;
- Form Builder vs other Platform Studio tool boundaries become unclear;
- a proposed UI pattern becomes a reusable platform primitive or shared package
  contract;
- copy/microcopy changes legal, billing, safety, compliance, or domain meaning;
- implementation reveals a product gap not covered by current docs or memory;
- Maestro has low confidence that the obvious UX answer matches owner taste;
- accepting the design would make future product paths harder.

## Quick Decision Check

Before deciding inline, Maestro should ask internally:

- Does this change what the user can do, not just how clearly they can do it?
- Does it affect data creation, deletion, publishing, approvals, billing,
  permissions, tenant isolation, or irreversible actions?
- Would two reasonable product owners likely choose different directions?
- Does it introduce or retire a product concept, navigation surface, or shared
  primitive?
- Does existing UI Kit, memory, or product documentation already answer it?
- Is the decision easy to reverse if the owner dislikes the taste?

If the answer is yes to product meaning, policy, or hard-to-reverse direction,
return to owner.

## Recommended Owner-Facing Shape

When returning to owner, Maestro should avoid dumping internal process. Use this
shape:

```text
I found a product/UX decision point.

Recommendation: <one recommended choice>
Why: <short rationale>
Tradeoff: <what this gives up>
Impact: <user/workflow/product consequence>
I can proceed with this unless you want a different direction.
```

For high-impact decisions, ask explicitly before proceeding. For moderate
decisions, Maestro can recommend a default and continue only if the decision is
reversible and does not block product acceptance.

## Examples

### Maestro Decides

- A table action button wraps badly on mobile. Maestro changes it to icon +
  tooltip or moves it into row actions.
- A form has no empty state. Maestro adds a concise empty state with a clear
  action using existing UI Kit patterns.
- A sidebar label overflows. Maestro truncates with tooltip or adjusts layout.
- A loading state causes layout shift. Maestro adds stable skeleton/loading
  treatment.
- A submit button can be double-clicked. Maestro adds pending/disabled state.

### Recommend Default

- A data-heavy admin table can be made scannable with tighter columns and
  pinned primary actions. Maestro recommends the denser version if it matches
  the operational product direction.
- A mobile screen can use stacked sections instead of the desktop grid. Maestro
  recommends the mobile-specific layout while preserving the same actions.
- A form can show validation inline or in a summary. Maestro recommends the
  pattern that fits the existing form system unless domain policy changes.

### Return To Owner

- Should Form Builder publish immediately, save as draft, or require explicit
  runtime activation?
- Should Navigation Builder own access permissions, or should access become a
  separate tool?
- Should a tenant user see a dense power-user table or a guided task-oriented
  workspace?
- Should destructive actions be available inline or behind a confirmation flow?
- Should a concept become a shared UI Kit primitive or remain app-specific?
- Should mobile UI preserve full desktop function density or simplify the flow?
- Should a report/export be immediate, queued, or approval-gated?

## Product Taste Rule

The owner owns product taste. Maestro can recommend a design direction and
should make routine taste-preserving decisions, but if a decision affects the
identity, feel, or workflow philosophy of the product, Maestro returns to the
owner.

## UX Evidence Rule

For UI-visible work, Maestro should not return only screenshots. Maestro should
state:

- what workflow was checked;
- which states were checked;
- desktop/mobile evidence when relevant;
- usability concerns found;
- recommended accept/revise decision.

The owner can then quickly accept or redirect product taste.
