# Evidence

- Work ID: `2026-05-05-ui-kit-tree`
- Shape: aggregate Markdown evidence log; individual machine-readable evidence
  items use `maestro/contracts/evidence.schema.json`.

## Summary

Implemented a reusable UI Kit `TreeView` and exposed it in UI Lab and Storybook
for expandable project/org-style hierarchies. Added `readOnly` browsing mode
where branch rows may expand/collapse while leaf activation, selection
callbacks, and selected styling are suppressed.

## Commands / Checks

| Check | Status | Evidence | Notes |
|---|---|---|---|
| `pnpm --filter @platform/ui-kit typecheck` | passed | local shell | Default shell Node 18.17.0 emits frontend engine warning; command passed. |
| `pnpm --filter @platform/ui-kit lint` | passed | local shell | Ran before closeout. |
| `pnpm --filter @platform/platform-admin-web typecheck` | passed | local shell | Ran before closeout. |
| `pnpm --filter @platform/platform-admin-web lint` | passed | local shell | Ran before closeout. |
| `pnpm storybook:build` | passed | local shell | Verified with `/opt/homebrew/bin` Node 22.22.1. |
| `git diff --check` | passed | local shell | No whitespace errors. |
| `scripts/preflight.sh` | passed | local shell | Lite mode: docs memory, env policy, runtime drift. |

## Changed Files

- `platform/frontend/packages/ui-kit/src/components/tree-view/tree-view.tsx`
- `platform/frontend/packages/ui-kit/src/components/tree-view/index.ts`
- `platform/frontend/packages/ui-kit/src/styles/tree-view.css`
- `platform/frontend/packages/ui-kit/src/styles.css`
- `platform/frontend/packages/ui-kit/src/index.ts`
- `platform/frontend/packages/ui-kit/src/stories/tree-view.stories.tsx`
- `platform/frontend/apps/platform-admin-web/src/internal/ui-lab/panels/navigation-primitives.tsx`
- `platform/frontend/apps/platform-admin-web/src/internal/ui-lab/panels/index.tsx`
- `platform/frontend/apps/platform-admin-web/src/internal/ui-lab/model/leaf-meta.ts`
- `platform/frontend/apps/platform-admin-web/src/internal/ui-lab/model/status.ts`
- `platform/frontend/apps/platform-admin-web/src/internal/ui-lab/styles/content.css`
- `platform/frontend/docs/contracts/ui-kit.md`
- `platform/frontend/docs/guides/ui-lab.md`
- `platform/frontend/packages/ui-kit/README.md`
- `maestro/memory/modules/frontend/ui-kit/README.md`

## Browser / Visual Evidence

- UI Lab route rendered the new Navigation Primitives / Tree View page in the
  local admin app.
- The project organization hierarchy rendered with folder/leaf icons, dotted
  guides, nested branch rows, selected state, and compact controlled example.
- Clicking `P1A (Palisades Tunnel)` collapsed its nested children and restored
  sibling rows below it.
- `readOnly` behavior was code-reviewed after the owner clarified that branch
  expansion should remain available: branch rows still toggle expansion, leaf
  rows render as static tree items, and selected styling is not applied.

## Review Evidence

- Self-review of `TreeView` API, ARIA attributes, keyboard navigation, styles,
  Storybook sample, and UI Lab wiring.

## Skipped Checks

- Storybook dev server command: blocked by local Storybook 10 dev CLI invocation
  expecting a port option. Static Storybook build passed.

## Residual Risks

- No known residual product-code risk.
