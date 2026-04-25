# UI Kit Source Layout

- `components`: reusable UI primitives migrated from donor references
- `icons`: small shared semantic SVG icons used across primitives and app-layer surfaces
- `layouts`: reusable shells such as `app-shell`, `auth-shell`, and `error-shell`
- `patterns`: reusable screen states and page composition blocks

Runtime usage:

- import components from `@platform/ui-kit`
- import styles from `@platform/ui-kit/styles.css`

Migration source of truth:

- `platform/frontend/docs/contracts/ui-kit.md`
- `platform/frontend/docs/guides/ui-lab.md`
- `platform/frontend/docs/vendor/metronic-inventory.md`

The old boundary, stable-approved, and UI Lab coverage docs are compatibility pointers after the docs compaction slices.
