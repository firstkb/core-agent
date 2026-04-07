# Reusable Foundation Notes

## Kept Active

### 1. Typed metadata contract layer

Keep active:

- `platform/frontend/packages/platform-studio-core/src/contracts/**`
- `platform/frontend/packages/platform-studio-core/src/schemas/**`
- `platform/frontend/packages/platform-studio-core/src/runtime/build-route-map.ts`
- `platform/frontend/packages/platform-studio-core/src/runtime/resolve-navigation-target.ts`
- `platform/frontend/packages/platform-studio-core/src/runtime/resolve-view-definition.ts`
- `platform/frontend/packages/platform-studio-core/src/runtime/evaluate-visibility-policy.ts`
- `platform/frontend/packages/platform-studio-core/src/runtime/validate-draft-snapshot.ts`
- `platform/frontend/packages/platform-studio-core/src/runtime/validate-published-manifest.ts`
- `platform/frontend/packages/platform-studio-core/src/runtime/published-manifest-runtime-error.ts`

Why it stayed:

- the V2 docs explicitly call out typed contracts, route wiring ideas, preview/runtime helpers, and policy support as useful technical foundation
- this package is UI-free and already separated from the retired cockpit UI
- the package name is historical technical debt, but the package content remains reusable foundation
- the published tenant runtime still depends on these helpers today

### 2. Neutral published-app runtime in tenant-web

Keep active:

- `platform/frontend/apps/tenant-web/src/features/published-app/**`

This is the extracted reusable slice from the old builder runtime:

- published manifest loading
- published route resolution
- published navigation sidebar adaptation
- visibility-subject evaluation
- published view placeholder rendering
- app-local system-module handoff

Why it stayed:

- it supports the live `/app/:routeKey/*` runtime path
- it is no longer presented as Platform Studio authoring UI
- it preserves route-resolution and manifest-consumption behavior that V2 can reuse later

### 3. Tenant shell navigation helpers

Keep active:

- `platform/frontend/apps/tenant-web/src/shared/navigation.ts`
- `platform/frontend/apps/tenant-web/src/shared/tenant-sidebar-navigation.tsx`

Why they stayed:

- tenant-web still needs a live dashboard entry and a published-app section
- the builder-specific mapping logic was removed

## Not Kept Active

Do not treat these as active foundation:

- builder draft stores
- builder authoring screens
- publish center UI
- preview screen chrome
- builder capability gate
- builder action rail / state rail UI
- builder-specific CSS shell

Those areas are documented as discarded UI. Their raw snapshot copies were removed during final cleanup so they do not keep biasing archive readers toward the retired product.

## Temporary Raw Snapshot Residue

Only a small temporary raw residue remains under `old-code-reference/code-snapshot/`:

- `draft/builder-draft-seed.ts`
- `draft/builder-draft-store.ts`
- `draft/builder-preview-manifest.ts`
- `preview/resolve-builder-preview-state.ts`
- `views/view-builder-state.ts`

Reason:

- these files still show draft/view mutation and preview adaptation patterns not preserved elsewhere
- the residue is temporary and should be deleted after those patterns are captured in notes or intentionally rehomed

## Compatibility Note

No builder-era localStorage compatibility bridge remains in the live published runtime.
`platform/frontend/apps/tenant-web/src/features/published-app/published-manifest-loader.ts` now reads only the neutral `tenant.published-runtime.manifests` key.
