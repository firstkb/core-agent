# Metronic Inventory

Status: reference metadata
Owner: frontend
Last audited: 2026-04-25
Canonical scope: Metronic donor inventory and extraction notes only

Inventory and migration tracker for the Metronic donor sources.
Use `reference-pack:metronic` as the stable alias; the raw pack is local-only under `reference-code/frontend/metronic`.

Read with:

- `maestro/memory/reference-code/README.md`
- `platform/frontend/docs/vendor/README.md`
- `platform/frontend/docs/contracts/ui-kit.md` only after a donor extraction task is explicitly activated
- `platform/frontend/docs/guides/ui-lab.md` only for UI review of extracted product-owned components

## Decision Rules

- `keep`: usable as-is because the artifact is pure UI and has no vendor-internal coupling
- `wrap`: good base implementation, but needs a product-owned API
- `rewrite`: concept is useful, implementation is too tied to template internals
- `delete`: demo-only or product-irrelevant code

## Initial Inventory

| Source path | Role | Decision | Target |
| --- | --- | --- | --- |
| `metronic-tailwind-react-starter-kit/typescript/vite/src/components/ui` | UI primitives donor set | `wrap` | `packages/ui-kit/src/components/*` |
| `metronic-tailwind-react-starter-kit/typescript/vite/src/components/layouts` | layout donor set | `rewrite` | `packages/ui-kit/src/layouts/*` |
| `metronic-tailwind-react-starter-kit/typescript/vite/src/styles` | token and visual policy donor | `wrap` | `packages/design-tokens/src/tokens/*` |
| `metronic-tailwind-react-starter-kit/typescript/vite/src/routing` | template routing model | `delete` | `apps/*/src/app` |
| `metronic-tailwind-react-starter-kit/typescript/vite/src/config/layout-*.config.tsx` | demo layout config | `delete` | none |
| `metronic-tailwind-react-concepts/typescript/vite/src/components/ui` | broader primitive examples | `wrap` | `packages/ui-kit/src/components/*` |
| `metronic-tailwind-react-concepts/typescript/vite/src/*/layout` | domain demo layouts | `delete` | none |
| `metronic-tailwind-react-concepts/typescript/vite/src/providers` | template providers | `rewrite` | `apps/*/src/app/providers` |

## First Extraction Order

1. `design-tokens`
2. `ui-kit/components/button`
3. `ui-kit/components/input`
4. `ui-kit/components/card`
5. `ui-kit/components/badge`
6. `ui-kit/patterns/empty-state`
7. `ui-kit/patterns/loading-state`
8. `ui-kit/layouts/app-shell`

## Current Foundation Status

- token package scaffolded under `packages/design-tokens`
- first product-owned foundations added under `packages/ui-kit`:
  - `accordion`
  - `alert-dialog`
  - `aspect-ratio`
  - `avatar`
  - `avatar-group`
  - `button`
  - `input`
  - `input-otp`
  - `date-picker`
  - `date-field`
  - `label`
  - `link`
  - `inline-status`
  - `status-dot`
  - `radio-group`
  - `rating`
  - `slider`
  - `toggle`
  - `toggle-group`
  - `card`
  - `badge`
  - `alert`
  - `code`
  - `context-menu`
  - `breadcrumb`
  - `calendar`
  - `collapsible`
  - `drawer`
  - `hover-card`
  - `kbd`
  - `menu`
  - `pagination`
  - `popover`
  - `progress-bar`
  - `skeleton`
  - `scroll-area`
  - `separator`
  - `combobox`
  - `tag-input`
  - `counting-number`
  - `stepper`
  - `switch`
  - `tabs`
  - `table`
  - `table-pagination-bar`
  - `table-column-visibility`
  - `empty-state`
  - `loading-state`
  - `error-state`
  - `tooltip`
  - `page-toolbar`
  - `date-range-field`
  - `app-shell`
  - `auth-shell`
  - `error-shell`

## Notes

- Do not copy routing, auth, or provider logic from Metronic as-is.
- Do not keep demo layout names such as `Demo1Layout`.
- Every extracted component should become product-owned immediately.
- Extraction into `ui-kit` is allowed only for stable primitives and approved reusable contracts.
- If a donor element is still page-specific or design-sensitive, keep it in app-layer until the contract is approved.
- Metronic exposes `datefield` and `calendar` surfaces with range mode, but not one small standalone shared `date-range` primitive. Keep `date-range-field` provisional until product fit is proven.
- Treat `date-picker` as the user-facing shared date contract for both single-date and range selection.
- Treat `calendar` as a review-stage internal building block under `date-picker` until month-grid selection proves necessary across more than one real surface.
- Keep `date-field` and `date-range-field` as lower-level compatibility layers rather than separate primary product contracts.
- Treat `alert-dialog` as a safe shared destructive-confirmation overlay when it stays narrower and stricter than a general dialog.
- Treat `aspect-ratio` as a safe shared framing utility for media, preview, and illustration surfaces.
- Treat `accordion` as a safe shared grouped disclosure primitive, but keep sidebar tree behavior app-layer until a generic nav API is approved.
- Treat `drawer` as a safe shared overlay extraction.
- Treat `code` as a safe shared support primitive for short technical identifiers and inline system values.
- Treat `label` as a safe shared semantic primitive for standalone control naming outside the heavier field shell.
- Treat `link` as a safe shared anchor primitive for inline navigation and external references while router-specific adapters stay outside the base contract.
- Treat `inline-status` and `status-dot` as safe shared status-marker primitives that sit between avatar presence dots and fuller status badges.
- Treat `slider` as a safe shared single-value range primitive; do not promote multi-thumb or chart-shaped range controls without a stronger reuse case.
- Treat `hover-card` as a safe richer-preview overlay as long as it stays summary-oriented and not interaction-heavy.
- Treat `context-menu` as a safe shared contextual action overlay when it stays object-local and does not become a hidden settings or workflow surface.
- Treat `kbd` and `scroll-area` as safe shared primitives because they stay low-risk, generic, and composition-friendly.
- Treat `input-otp` as a safe shared fixed-length code-entry primitive; keep auth-screen composition and branded verification flows outside the primitive.
- Treat `rating` as a safe shared compact scoring primitive as long as review cards, commentary, and richer review workflows stay outside the component.
- Treat `counting-number` as a review-stage display utility; keep motion, stat-card composition, and dashboard numerics under tighter validation before promotion.
- Treat linear `progress-bar` as the current safe donor extraction; do not promote radial or dashboard-shaped progress variants without a stronger reuse case.
- Treat searchable combobox donors such as `country-combobox` as the basis for a product-owned review-stage `combobox`, not as an expansion of the stable native `select`.
- Treat lightweight donor tagging patterns such as `ProductFormTagInput` as the basis for a separate review-stage `tag-input`, not as an overloaded combobox or select variant.
- Treat richer helpers like `table-column-header` and `table-pagination-bar` as part of the approved `table` primitive layer, not as a separate data-grid runtime.
- Treat `table-column-visibility` as part of the approved shared table helper layer now that toolbar fit, accessibility, and real-surface reuse have been proven.
- Treat `accordion-menu` and sidebar tree behavior as app-layer review material until desktop/mobile navigation rules and a generic API are both approved.

## Next Donor Candidates

Priority order for continued extraction from Metronic:

1. additional table helpers and collection states
2. remaining low-risk feedback surfaces
3. any still-missing lightweight form and utility primitives
4. identity-line compositions only if they stay generic and not profile-screen shaped
5. app-layer navigation candidates only when the shared primitive boundary stays clear
