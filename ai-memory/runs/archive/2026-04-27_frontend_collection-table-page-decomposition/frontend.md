# Frontend Lane: Collection Table Page Decomposition

Status: archived

## Read Summary

- Read repo/platform/frontend guidance plus collection-table memory and tracked frontend contracts.
- Confirmed Collection Table package owns generic runtime/UI interactions while app hosts own endpoint mapping, auth/session, route navigation, and host side effects.

## Exact File Ownership Plan

- `collection-table-page.tsx`: remains the stateful controller/orchestrator for adapter mutations, navigation, row actions, selection, and final page wiring.
- `components/collection-table-toolbar.tsx`: owns the thin toolbar shell and composes focused search/actions/token components.
- `components/collection-table-search-control.tsx`: owns search field/operator/input and suggestion list presentation.
- `components/collection-table-toolbar-actions.tsx`: owns desktop/mobile favorite, saved-filter menu, reload, and export action presentation.
- `components/collection-table-filter-token-bar.tsx`: owns active quick-filter token row and reset/save-filter buttons.
- `components/collection-table-save-filter-dialog.tsx`: owns saved-filter dialog presentation; receives draft label, validation state, and callbacks.
- `components/collection-table-bulk-bar.tsx`: owns selected-row bulk action bar presentation; receives selected count, actions, tone/label helpers, and callbacks.
- `components/collection-table-icons.tsx`: owns small package-local toolbar SVG icons.
- `controller/collection-table-page-helpers.ts`: owns pure action labels, toolbar action derivation, bulk tone class, filter-token derivation, saved-filter validation, and saved-filter signature checks.
- `controller/collection-table-search-suggestions.ts`: owns pure search suggestion key/id helpers.
- `controller/use-collection-table-meta-loader.ts`: owns meta loading/hydration orchestration.
- `controller/use-collection-table-query-loader.ts`: owns query execution/reload orchestration.
- `controller/use-collection-table-search-suggestions.ts`: owns search suggestion cache/read/write/loading orchestration.
- `controller/use-collection-table-search-controller.ts`: owns search draft, suggestion open/highlight state, and search input event orchestration.
- `controller/use-collection-table-search-derived-state.ts`: owns memoized search field/operator/suggestion derived state.
- `controller/collection-table-search-controller-helpers.ts`: owns pure search controller helper decisions.

## Risk Controls

- No adapter, query, saved-filter, favorite, export, selection, or row-action behavior changes.
- No public export changes unless needed by existing package entrypoint.
- No app-code imports from the package.
- Keep first slice reviewable; defer controller/state extraction until UI shell is smaller.

## Lane Report

- Extracted toolbar/search/action/token presentation from `collection-table-page.tsx`.
- Extracted saved-filter menu rows, saved-filter dialog, bulk action bar, and toolbar SVG icons.
- Added pure search suggestion id/key helper under package-local `controller/`.
- Extracted collection meta loading into `controller/use-collection-table-meta-loader.ts`.
- Extracted query execution/reload orchestration into `controller/use-collection-table-query-loader.ts`.
- Extracted search suggestion cache/read/write/loading orchestration into `controller/use-collection-table-search-suggestions.ts`.
- Extracted search draft/suggestion UI controller state into `controller/use-collection-table-search-controller.ts`.
- Extracted search field/operator/suggestion derived state into `controller/use-collection-table-search-derived-state.ts`.
- Extracted pure search controller decisions into `controller/collection-table-search-controller-helpers.ts`.
- Extracted action labels, toolbar action derivation, bulk tone class, active filter-token derivation, saved-filter label validation, and saved-filter signature checks into `controller/collection-table-page-helpers.ts`.
- Kept navigation, row action routing, saved-filter/favorite/export mutations, selection state, and page-level UI wiring in `collection-table-page.tsx`.
- Page size moved from 1,827 lines to 848 lines.
- New focused units are 9-367 lines each; most units are under 210 lines, with the search controller hook intentionally larger because it owns tightly coupled input/open/highlight behavior.

## Checks

- `pnpm --filter @platform/collection-table typecheck` passed after search controller extraction.
- `pnpm --filter @platform/platform-admin-web typecheck` passed after search controller extraction.
- `pnpm --filter @platform/tenant-web typecheck` passed after search controller extraction.
- `scripts/ai/preflight.sh` passed after search controller extraction.
- `git diff --check` passed after search controller extraction.

## Risks / Follow-Up

- Browser smoke was not run.
- `collection-table-page.tsx` is now below 900 lines. Remaining handler clusters are mostly adapter mutations and navigation; further decomposition should happen only after a closeout review shows a high-value boundary.
