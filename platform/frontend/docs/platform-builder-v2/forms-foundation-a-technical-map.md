# Forms Foundation A Technical Map

## Purpose

This map translates the approved UX correction pass into the exact tenant-web boundary for the live Forms Foundation A scaffold.

Sources used for this map:

- `AGENTS.md`
- `docs/README.md`
- `docs/codex-native-repo.md`
- `platform/frontend/docs/platform-builder-v2/README.md`
- `platform/frontend/docs/platform-builder-v2/v2-foundation-brief.md`
- `platform/frontend/docs/platform-builder-v2/agent-prompts.md`
- tenant-web shell and feature code under `platform/frontend/apps/tenant-web/src/**`

## Current Live Boundary

### Observed facts

- `platform/frontend/apps/tenant-web/src/app/app.tsx` already mounts the builder route tree through `renderPlatformBuilderRoutes()`
- `platform/frontend/apps/tenant-web/src/app/private-app.tsx` owns the two shell seams required by the correction pass:
  - `railUtilities`
  - `headerMeta`
- `platform/frontend/apps/tenant-web/src/shared/navigation.ts` owns shell title resolution and is the correct place to extend breadcrumb/meta lookup
- the live scaffold is already app-local under:
  - `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/`
- locale strings for the scaffold are local to:
  - `platform/frontend/apps/tenant-web/src/locales/en.ts`
  - `platform/frontend/apps/tenant-web/src/locales/es.ts`

### Inference

The correction pass can stay fully inside tenant-web and does not need:

- a new shared package
- sidebar navigation changes
- published runtime changes

## Corrected Route Model

The live Forms route model should be:

- `/builder/forms`
  - Forms master-detail page
- `/builder/forms/:objectId`
  - same Forms master-detail page with selected object state
- `/builder/forms/:objectId/screens/:screenId`
  - minimal screen workspace route

Recommended compatibility note:

- legacy `/builder/forms/:dataSchemaId/ui/:uiSchemaId` links may redirect to the corrected screen route, but they are no longer the canonical IA

## Corrected Screen Model

### Forms master-detail page

Required behavior:

- object list and selected object detail live on one screen
- the object list stays in the left panel
- the selected object detail stays in the right panel
- the right panel shows actual screen rows, not count summaries
- the right panel includes a small search field above screens
- `Add object` and `Add screen` stay visible as scaffold actions

Do not restore:

- a standalone object summary page
- hero blocks
- primary-emphasis owner labels
- primary-emphasis field counts
- primary-emphasis UI-schema counts

### Screen workspace page

Required behavior:

- minimal chrome
- compact back action
- compact lock badges
- local placeholder workspace only

Do not restore:

- hero chrome
- large inspector-summary stacks
- publish/admin framing

## Visible Copy Rules

The live scaffold should use:

- `Object`
- `Screen`
- `Structure locked`
- `Field locked`
- `Can edit screens only`

Do not use `Data Schema` or `UI Schema` in visible scaffold copy.

## Reusable Technical Surface

### Reuse without edits

- `platform/frontend/packages/platform-builder-core/src/contracts/**`
- `platform/frontend/packages/platform-builder-core/src/schemas/**`
- `platform/frontend/packages/platform-builder-core/src/runtime/**`

### Reuse as technical reference only

- `platform/frontend/apps/tenant-web/src/features/published-app/**`
- approved old-code reference files under `platform/frontend/docs/platform-builder-v2/old-code-reference/**`

### Recommended non-reuse for this pass

- no shared package extraction
- no old header entry component
- no standalone object-summary page module

## Exact Edit Boundary

### Edit existing files

- `platform/frontend/apps/tenant-web/src/app/private-app.tsx`
  - move Platform Builder entry into `railUtilities`
  - remove header split-button entry
  - wire `headerMeta`
- `platform/frontend/apps/tenant-web/src/shared/navigation.ts`
  - resolve short title plus breadcrumb/meta for builder routes
- `platform/frontend/apps/tenant-web/src/locales/en.ts`
  - add corrected scaffold copy
- `platform/frontend/apps/tenant-web/src/locales/es.ts`
  - add corrected scaffold copy
- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/routes.tsx`
  - keep master-detail page routes together
  - keep minimal screen workspace route
- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/platform-builder-route-meta.ts`
  - resolve short titles and breadcrumb/meta
- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/forms/forms-placeholder-data.ts`
  - keep app-local placeholder data in object/screen language
- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/forms/pages/forms-index-page.tsx`
  - render the live master-detail page
- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/forms/pages/forms-ui-schema-workspace-page.tsx`
  - render the minimal screen workspace
- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/platform-builder-v2.css`
  - remove hero-oriented styling and support the corrected layout

### Remove or retire live files

- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/platform-builder-header-entry.tsx`
  - no longer the correct entry model
- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/forms/pages/forms-data-schema-page.tsx`
  - standalone object-summary page is no longer part of the live route model

## Preview Strategy For This Pass

The correction pass does not need real preview logic.

Required rule:

- keep the workspace placeholder local to the screen workspace route
- do not route preview through `/app/:routeKey/*`
- do not introduce persistence or runtime-source loading

## Risks And Constraints

1. Header title and breadcrumb/meta resolution must stay synchronous because shell chrome is computed directly from pathname.
2. Lock language in this pass is UX signaling only; real enforcement still belongs to later authoring logic.
3. Placeholder add actions should stay visibly present, but they should not imply persistence or creation flows already exist.
4. The underlying runtime contracts still use schema/view language, so visible object/screen copy must stay isolated in local scaffold helpers and locale strings.

## Recommended Next Step After This Pass

Once this scaffold matches the approved direction, the next implementation slice should start real authoring logic inside the minimal screen workspace route without reopening:

- left-rail entry placement
- master-detail Forms IA
- top-bar title/meta model
- visible object/screen terminology
