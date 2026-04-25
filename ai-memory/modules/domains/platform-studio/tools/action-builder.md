# Action Builder

Status: planned tool
Last compacted: 2026-04-25

## Expected Ownership

- Authored events.
- View-triggered behavior.
- Notifications.
- Conditional field changes.
- Post-submit side effects.
- Future automation attached to authored views or records.

## Current Integration Point

- Form Builder may prepare forms and runtime data targets.
- Backend package planning already points post-submit side effects toward a future `platformstudioformactions` package instead of expanding `platformstudioformbuilder`.

## Guardrails

- Do not collapse Action Builder into the current Form Builder save flow.
- Do not treat existing workflow or event plumbing as the full product contract without an accepted Action Builder contract.
- Any side effect triggered after authoring/runtime persistence must return actionable diagnostic context on partial failure.
