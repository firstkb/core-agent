# UI Kit

Status: active compact frontend pack
Owner surface: frontend shared UI
Last compacted: 2026-04-25

## Read This When

- promoting UI primitives into `ui-kit`
- changing shared tokens, shell-wide layout behavior, or stable UI primitives
- using UI Lab as a promotion/review surface

## Owner Sources

- `platform/frontend/docs/contracts/ui-kit.md`
- `platform/frontend/docs/guides/ui-lab.md`
- `platform/frontend/docs/proposals/deferred-composed-surfaces.md`

## Contract

- `ui-kit` is not a staging area for every donor pattern.
- Promote into `ui-kit` only when product-owned, generic, reusable, and stable.
- The foundation rollout is closed; do not reopen it unless tokens or core primitive contracts materially change.
- Stable/provisional/app-layer boundaries are tracked in `platform/frontend/docs/contracts/ui-kit.md`.
- UI Lab route, sections, coverage, and editing rules are tracked in `platform/frontend/docs/guides/ui-lab.md`.
- Route-specific compositions stay in app code.
- Workflow-shaped surfaces such as remote table workspaces, file uploads, AI assistant, messenger, and kanban stay future/app-layer-first unless explicitly activated.
- Layout should preserve stable width behavior and avoid accidental overflow.
- Do not invent net-new shared primitives unless a real product gap is proven after checking approved and provisional surfaces.
- Donor/vendor material is reference only, not runtime source of truth.

## Lessons

- Do not make `ui-kit` a dumping ground.
- Do not expand provisional primitive APIs casually.
- Do not treat repeated page CSS or workflow-shaped widgets as automatic design-system candidates.
- Do not read vendor docs before checking current UI owner docs.
