# UI Archetypes

Pick one dominant archetype per screen. These are prompts for judgment, not
component requirements.

## Dashboard

Use for admin, analytics, operational, product, or engineering status screens.

Expected structure:

- navigation context: sidebar, top nav, local tabs, or breadcrumbs;
- header: title, short context, primary action, useful filter/status;
- KPI row: normally 3-4 cards, not a wall of equal metrics;
- primary panel: chart, table, queue, status map, or workflow list;
- secondary panel: activity, issues, alerts, recent changes, or next actions.

Rules:

- use tabular numerics for metrics;
- avoid fake precision and generic labels;
- make tables/lists scannable;
- keep accent sparse;
- cover loading, empty, refresh error, stale data, permissions, and responsive
  collapse when relevant.

## Live Dashboard

Use when data freshness, sync, refresh, or stale/offline behavior matters.

Expected additions:

- last updated indicator;
- refreshing state;
- stale state;
- failed refresh recovery;
- partial data behavior;
- calm alerting for degraded state.

Rules:

- do not animate constantly unless it communicates real change;
- do not hide stale data when it is still useful;
- avoid alarmist red unless the user must act.

## Kanban Or Cockpit

Use for task boards, review queues, agent-run boards, workflow operations, and
Maestro/Codex control surfaces.

Useful columns:

- Intake, Planned, In Progress, Review/QA, Blocked, Done;
- or Proposed, Scoped, Assigned, Running, Needs Review, Merged/Done.

Card anatomy:

- task id;
- title;
- scope/domain tag;
- owner or executor;
- status;
- risk level;
- last event timestamp;
- blocker;
- primary next action.

Rules:

- make workflow state obvious at a glance;
- risk/blockers should be visible but not dramatic;
- cards should not all look equally important;
- include filters for owner, status, risk, source, and search when useful.

## SaaS Landing

Use only for public product/offer pages. Do not apply landing-page composition
to operational product tools.

Expected structure:

- clear product or offer headline;
- concrete value prop in supporting text;
- primary call to action;
- product-revealing media or real screenshot when available;
- proof/benefit sections tied to the product;
- restrained pricing/FAQ/CTA only when relevant.

Rules:

- avoid generic hero-feature-pricing-faq structure when the product needs
  something more specific;
- do not invent metrics;
- do not use generic gradients or stock-like visual noise.

## Pricing Page

Use for plans, billing, or package comparison.

Expected structure:

- plan cards with real constraints;
- comparison table for detailed differences;
- FAQ for buying blockers;
- clear current/recommended plan state if logged in;
- mobile behavior that preserves comparison.

Rules:

- do not invent prices, guarantees, or quotas;
- make plan differences scannable;
- keep the upgrade/downgrade action unambiguous.

## Docs Or Reference Page

Use for documentation, API/reference, implementation notes, or product guides.

Expected structure:

- article or section title;
- table of contents when long;
- left nav or local section nav when the app already uses it;
- code blocks or examples where useful;
- strong heading hierarchy;
- search/filter only when content volume justifies it.

Rules:

- body prose should remain readable;
- avoid oversized marketing typography inside docs;
- preserve copy accuracy over visual flourish.

## Mobile Or PWA Screen

Use for mobile-first or narrow viewport screens.

Rules:

- one primary job per screen;
- tap targets at least 44px when possible;
- avoid dense multi-column layouts;
- prioritize columns or transform tables below tablet width;
- keep primary action reachable;
- test long labels and overflow.

## Product Spec Or PRD Page

Use for internal planning/specification UI or owner-facing product artifacts.

Expected structure:

- product goal;
- user roles;
- scope and non-scope;
- decisions;
- risks;
- acceptance;
- open questions;
- implementation slices.

Rules:

- keep it scannable and actionable;
- distinguish accepted decisions from options;
- avoid turning specs into decorative dashboards.

## Component System

Use when a UI task benefits from reusable primitives instead of one-off markup.

Consider:

- PageHeader;
- MetricCard;
- StatusPill;
- EmptyState;
- ErrorState;
- DataTable;
- FilterBar;
- ActivityFeed;
- TaskCard;
- AppSidebar;
- SectionCard.

Rules:

- do not create a competing design system;
- do not over-abstract for hypothetical reuse;
- promote to shared UI Kit only when product-owned, generic, reusable, and
  stable;
- props must match real usage;
- examples/tests/stories should follow existing repo patterns.
