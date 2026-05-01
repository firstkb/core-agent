# Outsourced Capability Policy

- Work ID: `2026-05-01-human-agent-symbiosis`
- Status: `draft`
- Purpose: Define when Maestro should consider or use outsourced tools/plugins without creating unnecessary tool churn.

## Core Principle

Outsourced capabilities are hired for concrete leverage: better frontend
quality, stronger evidence, current external facts, GitHub workflow operations,
or specialized API guidance.

They do not own product taste, architecture, final acceptance, or Maestro's
accountability. Maestro decides when a capability is useful, keeps the owner
focused on product decisions, and avoids calling tools just because they exist.

## Decision Levels

| Level | Meaning | Rule |
|---|---|---|
| Must consider | Maestro should explicitly decide whether the capability adds value | Do not invoke automatically |
| Should use | The task materially benefits from the capability | Use unless there is a clear reason not to |
| Must use | Evidence or correctness would be weak without it | Use or report blocker/skipped reason |
| Fallback | Use only when preferred path is unavailable or insufficient | State why fallback was chosen |
| Do not use | Capability adds ceremony, cost, or noise | Keep work inline |

## Build Web Apps

Build Web Apps is valuable for frontend work, but its sub-skills are not a
single mandatory workflow. Maestro should treat them as a set of frontend
specialists and use only the part that matches the task.

### Must Consider

Consider Build Web Apps for every visible frontend task where the result affects
user experience, perceived quality, interaction design, responsiveness, or
frontend implementation quality.

### Should Use

Use Build Web Apps guidance when:

- creating a new screen, dashboard, admin surface, editor, tool, game, or
  visually driven feature;
- doing a redesign, restyle, modernization, or "make it user-friendly" task;
- the UI has complex density, sidebars, tables, forms, inspectors, canvas,
  workflow states, or responsive behavior;
- the task needs senior frontend/design judgment beyond local code changes;
- React/Next performance, data fetching, rendering, bundle size, or component
  structure matters;
- shadcn/ui components or `components.json` are involved;
- frontend defects repeat after ordinary fixes.

### Use Selectively

| Build Web Apps Capability | Use For | Avoid For |
|---|---|---|
| `frontend-app-builder` | New visual surfaces, redesigns, complex app UIs, high-taste implementation, design fidelity loops | Small UI fixes inside an established design system |
| `react-best-practices` | React/Next component design, performance, data fetching, re-render, bundle, frontend review | Plain CSS polish or non-React code |
| `shadcn` | shadcn component search, usage, composition, theming, registry/preset work | Projects without shadcn or equivalent component registry |
| `supabase-postgres-best-practices` | Postgres schema/query/performance decisions | Non-Postgres backend work |
| `stripe-best-practices` | Payments, billing, Checkout, PaymentIntents, Connect, subscriptions | Non-payment product work |

### Do Not Use

Do not invoke Build Web Apps when:

- the task is backend-only, docs-only, or memory-only;
- the UI change is tiny and follows an obvious existing pattern;
- owner already provided a precise design and only mechanical implementation is
  needed;
- repo UI Kit or product contracts already answer the decision;
- using the full design/image workflow would slow a small fix.

### FE Quality Decision

For frontend work, Maestro should not outsource final taste. Build Web Apps can
raise the bar, provide patterns, or guide implementation, but Maestro remains
the final UI/UX reviewer before returning to the owner.

Default FE policy:

- visible FE task: must consider Build Web Apps;
- frontend-heavy or UX-sensitive task: should use the relevant Build Web Apps
  guidance;
- new visual surface or redesign: should use `frontend-app-builder` unless the
  owner provides an accepted design or repo contracts make the direction
  obvious;
- React/Next implementation or review: should use `react-best-practices` when
  performance, data flow, rendering, or component structure matters;
- small local fix: keep inline and verify visually.

## Browser Use And Computer Use

Visible frontend work needs visual evidence. Code inspection alone is not enough
for UI/UX acceptance.

### Proposed Target Policy

Use a two-surface FE verification policy:

1. Browser Use is the default structured browser automation surface for local
   app smoke, interaction, screenshot, DOM, console/log checks, and quick
   route/state verification.
2. Computer Use + external Google Chrome is the preferred final visual/UX
   acceptance surface when the review must be independent of Codex app width,
   especially for desktop layout quality.

Browser Use is not the same as opening an external standalone Chrome window. It
is an in-Codex browser surface that Maestro can control directly. It is good for
developer verification, but final desktop product judgment can be biased if the
Codex surface cannot represent the target width or browser environment.

Do not confuse Browser Use's internal `setupAtlasRuntime` naming with the
installed ChatGPT Atlas desktop application. Browser Use controls the in-Codex
browser surface, not the ChatGPT Atlas macOS app. If Maestro needs to inspect or
operate the installed ChatGPT Atlas app itself, use Computer Use as the
desktop-app capability.

Use real Chrome through Computer Use when the question is "does this FE work
look and feel right for the final user on desktop?" or when the in-Codex browser
cannot show the needed desktop width, browser behavior, profile, OS integration,
or app surface.

ChatGPT Atlas is not the preferred FE QA browser. Use it only if the product
specifically targets Atlas or the owner asks to verify Atlas behavior. Default
external browser for final visual acceptance is Google Chrome.

### Current Runtime Note

The currently installed Browser Use skill says to use the in-app browser first
before falling back to Computer Use. This remains correct for structured browser
automation. For owner-facing final desktop UX judgment where Codex width could
distort the result, Maestro should deliberately add Computer Use + external
Chrome evidence instead of relying only on Browser Use.

### Must Use Visual Evidence

Use browser/desktop evidence for:

- new or changed visible FE screens;
- responsive behavior claims;
- layout, overflow, spacing, typography, or interaction-state fixes;
- desktop admin/product surfaces where usability matters;
- mobile views when the change affects responsive behavior;
- owner-facing UI/UX acceptance.

### Preferred Surface

| Situation | Preferred Capability | Reason |
|---|---|---|
| Structured FE smoke / DOM / interaction | Browser Use | Faster, direct browser automation, better developer signals |
| Fast local route smoke | Browser Use | Good for quick click-through and screenshots |
| Mobile viewport check | Browser Use | Prefer the default surface when viewport sizing is reliable |
| Final desktop visual/UX acceptance independent of Codex width | Computer Use + Chrome | Real external browser surface for product judgment |
| Browser Use cannot show the needed viewport or behavior | Computer Use + Chrome | Real desktop/browser escalation |
| Desktop app or OS-level interaction | Computer Use | Browser Use cannot cover it |
| Installed ChatGPT Atlas app | Computer Use | It is a desktop app, not the Browser Use in-Codex surface |

### Do Not Use

Do not use browser automation for:

- backend-only work;
- docs/memory-only work;
- non-visible refactors when targeted tests are sufficient;
- tiny copy/code changes where visual inspection would not add meaningful
  confidence.

## GitHub

Use GitHub capabilities only when the owner asks for GitHub workflow work or
the task is explicitly about repository hosting state.

Should use GitHub for:

- PR summaries, review comments, unresolved threads, and requested changes;
- CI/check failures in GitHub Actions;
- issue/PR triage;
- creating commits, pushes, branches, or PRs when owner requests it;
- publishing local work through the agreed GitHub flow.

Do not use GitHub for ordinary local code analysis when the local repository
already contains the needed facts.

## OpenAI Docs

Use OpenAI docs rarely and specifically.

Should use OpenAI docs when:

- implementing or changing an OpenAI API integration;
- choosing current OpenAI models, APIs, SDK behavior, tool calling, assistants,
  responses, embeddings, realtime, files, or safety features;
- the task depends on current OpenAI product behavior or pricing-sensitive API
  choices;
- owner asks for up-to-date OpenAI guidance.

Do not use OpenAI docs for ordinary repo/frontend/backend work unrelated to
OpenAI integration.

## Web Search And External Docs

Use web search or external docs for current, external, or uncertain facts that
can materially affect the decision. Prefer official documentation or primary
sources.

Should use external docs/search when:

- discussing an external library, API, framework, browser behavior, legal rule,
  service limitation, or current best practice that may have changed;
- comparing implementation options that depend on outside product behavior;
- the owner asks to verify current information;
- a technical decision would be risky if based only on memory.

Do not use web search when:

- repo source of truth already answers the question;
- the task is local code navigation;
- the result would only add generic advice;
- the decision is owner taste/product strategy rather than external fact.

For this product, web search is mostly useful during task discussion and design
of the approach. It should not become a default step in ordinary implementation.

## Practical Routing Summary

| Capability | Must Consider | Should Use | Fallback / Avoid |
|---|---|---|---|
| Build Web Apps | Visible FE tasks | Frontend-heavy, redesign, new UI, React/Next performance, shadcn | Avoid for tiny UI fixes or non-FE work |
| Browser Use | Visible FE verification | Structured FE smoke, mobile/current viewport, route interaction, screenshots/DOM evidence | Not enough alone for final desktop visual acceptance when Codex width can bias judgment |
| Computer Use | Desktop/app visual acceptance | External Chrome final desktop UX review, wide desktop checks, OS/app interaction | Avoid for routine structured checks if Browser Use is enough |
| GitHub | PR/CI/issue/publish tasks | Owner-requested commit/push/PR/review/CI | Avoid for local repo facts |
| OpenAI docs | OpenAI integration decisions | Current OpenAI API/model behavior | Avoid outside OpenAI-related work |
| Web search/docs | Current external facts | Official docs for uncertain/current dependencies | Avoid generic research and local repo work |

## Owner Return Points

Maestro should return to the owner when capability choice affects product time,
quality bar, or cost:

- full Build Web Apps design workflow would materially slow the task;
- Browser Use evidence is insufficient and Computer Use/Chrome escalation is
  needed but unavailable;
- external docs reveal multiple viable product directions;
- GitHub action would publish, expose, or mutate remote state;
- OpenAI integration choice affects product cost, model behavior, or privacy.
