# UI Quality Workflow

Use this workflow for visible frontend work when product quality matters. Keep
it compact for small changes and expand only for larger screens or flows.

## 1. Understand Product Context

Before coding or assigning implementation, identify:

- product/module;
- user role;
- user goal;
- trigger/event that brings the user to the screen;
- success condition;
- failure condition;
- route/app/package boundary;
- data source and mutation boundaries;
- known permissions or tenant rules.

Ask the owner only when product behavior, taste, acceptance, or risk is
materially unclear.

## 2. Lock The UI Contract

Use existing project contracts first:

- UI Kit and design token docs;
- app shell and package boundaries;
- existing components and screen patterns;
- route/module product docs;
- current CSS conventions.

If no design contract exists, create a small task-local contract in the work
artifact or response. Do not create a permanent `DESIGN.md` for tiny changes.

Resolve:

- screen archetype;
- density: compact, balanced, or spacious;
- primary action and secondary actions;
- navigation context;
- required panels, table/list columns, filters, and summary cards;
- product vocabulary to use and generic copy to avoid;
- responsive behavior;
- anti-patterns to avoid.

## 3. Choose One Screen Archetype

Pick one dominant archetype from `archetypes.md`. Do not mix landing-page,
dashboard, control-plane, and docs aesthetics unless the product surface truly
requires a hybrid.

State the choice internally or in the assignment:

```text
Archetype: dashboard
Reason: admin users need status, filters, primary list, and next action.
```

## 4. Plan State Coverage

Before implementation, list relevant states:

- loading;
- empty;
- success/default;
- error/retry;
- disabled or readonly;
- permission denied;
- stale/offline;
- long text and overflow;
- large data set;
- mobile layout.

For irrelevant states, say why. Do not silently omit core states for substantial
UI work.

## 5. Implement With Existing Stack

Rules:

- reuse existing components, tokens, CSS conventions, and data contracts;
- do not create a separate demo app;
- do not introduce dependencies unless the task truly needs them;
- keep app/package boundaries intact;
- keep route/page files orchestration-focused;
- keep presentational pieces focused and extract only when it reduces real
  complexity;
- use product-specific labels and realistic domain vocabulary;
- avoid hardcoded fake metrics in production paths;
- do not replace the component system or UI Kit.

## 6. Verify

Run the smallest useful evidence set:

- typecheck/lint/test/build when relevant;
- Storybook or UI Lab when the touched surface is a shared primitive/state;
- Browser Use for local route smoke when available;
- fixed viewport checks for responsive evidence;
- Computer Use with external Chrome when final desktop judgment must be
  independent of Codex viewport.

## 7. Critique

Run a five-axis critique after implementation:

- Philosophy Consistency;
- Visual Hierarchy;
- Detail Execution;
- Functionality;
- Innovation.

Use evidence from actual files, rendered behavior, screenshots, or browser
inspection. Do not inflate scores.

## 8. Targeted Fix Pass

Apply only P0/P1 fixes unless the owner asks for polish.

P0 examples:

- broken layout;
- unreadable text;
- inaccessible control;
- missing critical state;
- fake or placeholder production content;
- serious repository convention violation.

P1 examples:

- weak visual hierarchy;
- unclear empty/error state;
- overused accent;
- inconsistent spacing rhythm;
- generic copy;
- missing focus affordance where the project expects it.

Stop after the targeted pass. Do not redesign endlessly.
