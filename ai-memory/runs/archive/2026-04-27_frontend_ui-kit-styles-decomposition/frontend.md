# Frontend Lane: UI Kit Styles Decomposition

Status: archived

## Read Summary

- Read UI Kit memory, UI Kit contract, package metadata, `styles.css`, and downstream style import paths.
- Confirmed `@platform/ui-kit/styles.css` is the public style entry consumed through `@platform/app-shell/styles.css`.
- First slice is CSS-only and must preserve selector/declaration order.

## File Ownership Plan

- `packages/ui-kit/src/styles.css`: remains the public CSS entrypoint and import-order owner.
- `packages/ui-kit/src/styles/base.css`: owns root shell sizing variables and global box sizing.
- `packages/ui-kit/src/styles/overlay-surfaces.css`: owns overlay, dialog, alert-dialog, sheet, drawer, and shared overlay close/header/body/title/description rules.
- `packages/ui-kit/src/styles/navigation-sidebar.css`: owns sidebar navigation structure, levels, active state, icon/meta/caret, and overflow toggle styles.
- `packages/ui-kit/src/styles/actions.css`: owns button, split-button, toggle, and toggle-group styles.
- `packages/ui-kit/src/styles/utility-primitives.css`: owns kbd, code, status-dot, inline-status, label, and link styles.
- `packages/ui-kit/src/styles/navigation-support.css`: owns scroll-area, breadcrumb, separator, tabs, stepper, skeleton, and skeleton keyframes.
- `packages/ui-kit/src/styles/interactive-surfaces.css`: owns switch, context-menu, menu, popover, collapsible, accordion, aspect-ratio, hover-card, and tooltip styles.
- `packages/ui-kit/src/styles/collection-controls.css`: owns pagination, filter-chip, and shared spin keyframe styles.
- `packages/ui-kit/src/styles/form-inputs.css`: owns base input, input OTP, date field, calendar, input group, and input addon styles.
- `packages/ui-kit/src/styles/selection-controls.css`: owns checkbox, radio, slider, and rating styles.
- `packages/ui-kit/src/styles/select-textarea-controls.css`: owns select and textarea styles.
- `packages/ui-kit/src/styles/combobox-controls.css`: owns combobox trigger, tag, content, option, and empty-state styles.
- `packages/ui-kit/src/styles/rich-text-controls.css`: owns rich-text editor shell, toolbar, content typography/table styles, popovers, source dialog textarea, and dark-theme rich-text overrides.
- `packages/ui-kit/src/styles/tag-input-controls.css`: owns tag input shell, tags, inline input, suggestions, active suggestion, and empty suggestion styles.
- `packages/ui-kit/src/styles/surface-feedback.css`: owns card and alert surface/feedback styles.
- `packages/ui-kit/src/styles/display-feedback.css`: owns stat-card, badge, avatar, and avatar-group styles.
- `packages/ui-kit/src/styles/loading-indicators.css`: owns progress and top-loader styles.
- `packages/ui-kit/src/styles/data-table.css`: owns base table, table meta, sorting, column header, pagination bar, and column visibility styles.
- `packages/ui-kit/src/styles/data-table-responsive.css`: owns the preserved mobile table pagination and colocated combobox content responsive overrides.
- `packages/ui-kit/src/styles/empty-states.css`: owns collection, search, and guided empty-state styles.
- `packages/ui-kit/src/styles/loading-states.css`: owns generic, collection, and table loading-state styles plus the loading wave keyframes.
- `packages/ui-kit/src/styles/date-view-controls.css`: owns date-range field and view-preset bar styles.
- `packages/ui-kit/src/styles/page-toolbar-tabs.css`: owns page toolbar and secondary tabs styles.
- `packages/ui-kit/src/styles/form-layout.css`: owns field layout, form shell, form sections, form grid, and related responsive rules.
- `packages/ui-kit/src/styles/summary-notices.css`: owns summary pill strip and toolbar notice styles.
- `packages/ui-kit/src/styles/activity-timeline.css`: owns activity feed and timeline feed styles.

## Risk Controls

- Preserve the current first import: `@platform/design-tokens/styles.css`.
- Move rules without changing selectors or declarations.
- Keep import order identical to original cascade order.
- Do not split token definitions or change app-shell/import consumers in this slice.

## Lane Report

- Created package-local `src/styles/` CSS module folder.
- Moved root/global base rules into `styles/base.css`.
- Moved overlay/dialog/alert-dialog/sheet/drawer CSS into `styles/overlay-surfaces.css`.
- Moved sidebar navigation CSS into `styles/navigation-sidebar.css`.
- Moved action controls CSS into `styles/actions.css`.
- Moved utility primitives CSS into `styles/utility-primitives.css`.
- Moved navigation/support primitives CSS into `styles/navigation-support.css`.
- Moved interactive surface CSS into `styles/interactive-surfaces.css`.
- Moved collection control CSS into `styles/collection-controls.css`.
- Moved base input/date/calendar CSS into `styles/form-inputs.css`.
- Moved selection/range/rating CSS into `styles/selection-controls.css`.
- Moved select/textarea CSS into `styles/select-textarea-controls.css`.
- Moved combobox CSS into `styles/combobox-controls.css`.
- Moved rich-text editor/content CSS into `styles/rich-text-controls.css`.
- Moved tag-input CSS into `styles/tag-input-controls.css`.
- Moved card and alert surface feedback CSS into `styles/surface-feedback.css`.
- Moved stat-card, badge, avatar, and avatar-group CSS into `styles/display-feedback.css`.
- Moved progress/top-loader CSS into `styles/loading-indicators.css`.
- Moved base table/data CSS into `styles/data-table.css`.
- Moved responsive table pagination CSS into `styles/data-table-responsive.css`.
- Moved empty-state CSS into `styles/empty-states.css`.
- Moved loading-state CSS into `styles/loading-states.css`.
- Moved date-range and view-preset CSS into `styles/date-view-controls.css`.
- Moved page toolbar and secondary tabs CSS into `styles/page-toolbar-tabs.css`.
- Moved field/form-shell/form-grid CSS into `styles/form-layout.css`.
- Moved summary pill strip and toolbar notice CSS into `styles/summary-notices.css`.
- Moved activity feed and timeline feed CSS into `styles/activity-timeline.css`.
- Kept `styles.css` as the public CSS entrypoint with top-level imports before remaining rules.
- Main `styles.css` size moved from 6,024 lines to 149 lines.

## Checks

- `pnpm --filter @platform/ui-kit typecheck` passed.
- `pnpm --filter @platform/platform-admin-web build` passed and validated CSS import resolution through the downstream app-shell/admin consumer path.
- `pnpm --filter @platform/ui-kit typecheck` passed after sidebar extraction.
- `pnpm --filter @platform/platform-admin-web build` passed after sidebar extraction.
- `pnpm --filter @platform/ui-kit typecheck` passed after action controls extraction.
- `pnpm --filter @platform/platform-admin-web build` passed after action controls extraction.
- `pnpm --filter @platform/ui-kit typecheck` passed after utility primitives extraction.
- `pnpm --filter @platform/platform-admin-web build` passed after utility primitives extraction.
- `pnpm --filter @platform/ui-kit typecheck` passed after navigation/support extraction.
- `pnpm --filter @platform/platform-admin-web build` passed after navigation/support extraction.
- `pnpm --filter @platform/ui-kit typecheck` passed after interactive surfaces extraction.
- `pnpm --filter @platform/platform-admin-web build` passed after interactive surfaces extraction.
- `pnpm --filter @platform/ui-kit typecheck` passed after collection controls extraction.
- `pnpm --filter @platform/platform-admin-web build` passed after collection controls extraction.
- `pnpm --filter @platform/ui-kit typecheck` passed after form inputs extraction.
- `pnpm --filter @platform/platform-admin-web build` passed after form inputs extraction.
- `pnpm --filter @platform/ui-kit typecheck` passed after selection controls extraction.
- `pnpm --filter @platform/platform-admin-web build` passed after selection controls extraction.
- `pnpm --filter @platform/ui-kit typecheck` passed after select/textarea and combobox extraction.
- `pnpm --filter @platform/platform-admin-web build` passed after select/textarea and combobox extraction.
- `pnpm --filter @platform/ui-kit typecheck` passed after rich-text extraction.
- `pnpm --filter @platform/platform-admin-web build` passed after rich-text extraction.
- `pnpm --filter @platform/ui-kit typecheck` passed after tag-input extraction.
- `pnpm --filter @platform/platform-admin-web build` passed after tag-input extraction.
- `pnpm --filter @platform/ui-kit typecheck` passed after surface feedback extraction.
- `pnpm --filter @platform/platform-admin-web build` passed after surface feedback extraction.
- `pnpm --filter @platform/ui-kit typecheck` passed after display feedback extraction.
- `pnpm --filter @platform/platform-admin-web build` passed after display feedback extraction.
- `pnpm --filter @platform/ui-kit typecheck` passed after loading/table extraction.
- `pnpm --filter @platform/platform-admin-web build` passed after loading/table extraction.
- `pnpm --filter @platform/ui-kit typecheck` passed after empty/loading-state extraction.
- `pnpm --filter @platform/platform-admin-web build` passed after empty/loading-state extraction.
- `pnpm --filter @platform/ui-kit typecheck` passed after date/view/page-toolbar extraction.
- `pnpm --filter @platform/platform-admin-web build` passed after date/view/page-toolbar extraction.
- `pnpm --filter @platform/ui-kit typecheck` passed after form layout extraction.
- `pnpm --filter @platform/platform-admin-web build` passed after form layout extraction.
- `pnpm --filter @platform/ui-kit typecheck` passed after summary/activity extraction.
- `pnpm --filter @platform/platform-admin-web build` passed after summary/activity extraction.
- `scripts/ai/preflight.sh` passed.
- `git diff --check` passed.

## Risks / Follow-Up

- Browser smoke not run yet.
- Vite emitted the existing Node version warning under local Node 18.17.0; build still completed.
- Next step should be closeout review and commit checkpoint for UI Kit CSS decomposition; `styles.css` is now a near-entrypoint shell.
