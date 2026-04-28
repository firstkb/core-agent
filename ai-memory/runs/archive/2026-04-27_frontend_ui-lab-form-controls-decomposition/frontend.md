# Frontend Lane: UI Lab Form Controls Decomposition

Status: archived

## Read Summary

- Read repo/platform/frontend instructions, UI Kit memory, UI Lab guide, UI Kit contract, package boundaries, platform-admin module docs, and target source.
- Confirmed this is app-local UI Lab decomposition. No shared package or product contract changes are intended.

## File Ownership Plan

- `panels/form-controls.tsx`: remains the public form-controls docs export surface for `render*Docs`.
- `panels/form-controls/action-layout-docs.tsx`: remains a thin compatibility barrel for button/layout docs exports.
- `panels/form-controls/button-docs.tsx`: owns the button docs block.
- `panels/form-controls/layout-support-docs.tsx`: owns scroll-area and aspect-ratio docs blocks.
- `panels/form-controls/action-previews.tsx`: owns split-button and slider stateful preview helpers.
- `panels/form-controls/combobox-previews.tsx`: owns combobox demo option data and stateful combobox previews.
- `panels/form-controls/rich-text-tag-previews.tsx`: owns rich-text and tag-input stateful previews plus tag option data.
- `panels/form-controls/interactive-previews.ts`: remains a thin barrel for preview imports.
- `panels/form-controls/text-entry-docs.ts`: remains a thin barrel for text-entry docs exports.
- `panels/form-controls/input-docs.tsx`: owns input docs.
- `panels/form-controls/input-otp-docs.tsx`: owns input OTP docs.
- `panels/form-controls/label-textarea-docs.tsx`: owns label and textarea docs.
- `panels/form-controls/choice-entry-docs.ts`: remains a thin barrel for choice-entry docs exports.
- `panels/form-controls/date-picker-docs.tsx`: owns date-picker docs.
- `panels/form-controls/select-docs.tsx`: owns select docs.
- `panels/form-controls/combobox-docs.tsx`: owns combobox docs.
- `panels/form-controls/tag-input-docs.tsx`: owns tag-input docs.
- `panels/form-controls/rich-text-docs.tsx`: owns rich text editor docs.
- `panels/form-controls/boolean-range-docs.tsx`: owns checkbox, switch, and slider docs.
- `panels/form-controls/toggle-docs.tsx`: owns toggle and toggle group docs.
- `panels/form-controls/radio-group-docs.tsx`: owns radio group docs.
- `panels/form-controls/field-shell-docs.tsx`: owns field and form shell docs.

## Risk Controls

- Preserve existing `render*Docs` exported function names.
- Preserve example text, ids, labels, and component props.
- Avoid moving styles or changing `ui-kit`.
- Keep this first slice small and reviewable.

## Lane Report

- Extracted stateful preview/demo helpers from `form-controls.tsx` into focused app-local form-controls helper files.
- Extracted `button`, `scroll-area`, and `aspect-ratio` docs blocks into `action-layout-docs.tsx` and re-exported them through `form-controls.tsx`.
- Split `action-layout-docs.tsx` into `button-docs.tsx` and `layout-support-docs.tsx`, leaving `action-layout-docs.tsx` as a 5-line barrel.
- Extracted the text-entry docs family (`input`, `input-otp`, `label`, `textarea`) into focused docs files and a 6-line barrel.
- Extracted the choice-entry docs family (`date-picker`, `select`, `combobox`, `tag-input`) into focused docs files and a 4-line barrel.
- Extracted the remaining docs families (`rich-text`, `checkbox/switch/slider`, `toggle/toggle-group`, `radio-group`, `field/form-shell`) into focused docs files.
- Kept all existing `render*Docs` public exports available from `panels/form-controls.tsx`.
- Added a UI Kit/UI Lab memory guardrail to avoid regrowing multi-thousand-line panel files.
- Main panel size moved from 3,064 lines to 32 lines.
- New focused helper sizes: 3, 4, 5, 6, 82, 107, 108, 126, 156, 157, 181, 183, 189, 210, 213, 222, 235, 266, 270, 280, and 290 lines.

## Checks

- `pnpm --filter @platform/platform-admin-web typecheck` passed after preview and docs extraction.
- `pnpm --filter @platform/platform-admin-web typecheck` passed after text-entry docs extraction.
- `pnpm --filter @platform/platform-admin-web typecheck` passed after choice-entry docs extraction.
- `pnpm --filter @platform/platform-admin-web typecheck` passed after near-barrel extraction.

## Risks / Follow-Up

- Browser smoke not run yet.
- Main panel is now a near-barrel; next step should be review/commit checkpoint before moving to another global monolith.
