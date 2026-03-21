# Metronic Inventory

Inventory and migration tracker for the Metronic donor sources under `platform/frontend/docs/metronic`.

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
  - `button`
  - `input`
  - `card`
  - `badge`
  - `table`
  - `empty-state`
  - `loading-state`
  - `error-state`
  - `page-toolbar`
  - `app-shell`
  - `auth-shell`
  - `error-shell`

## Notes

- Do not copy routing, auth, or provider logic from Metronic as-is.
- Do not keep demo layout names such as `Demo1Layout`.
- Every extracted component should become product-owned immediately.
