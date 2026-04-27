# UI Kit Styles Decomposition

Status: active

## Task

Reduce monolith risk in `platform/frontend/packages/ui-kit/src/styles.css`.

## Scope

- Frontend-only.
- `@platform/ui-kit` CSS organization only.
- Behavior-preserving extraction.
- No token contract, class name, component API, app shell, or product behavior changes.

## Locked Invariants

- `@platform/ui-kit/styles.css` remains the public CSS export.
- CSS cascade order must remain unchanged.
- Existing class names, selectors, declarations, and media query contents stay equivalent.
- New CSS files stay package-local under `platform/frontend/packages/ui-kit/src`.

## Initial Plan

1. Create a package-local styles entry/import structure.
2. Extract one autonomous top-of-file block first to validate CSS import behavior and cascade preservation.
3. Run `@platform/ui-kit` typecheck plus product preflight.
