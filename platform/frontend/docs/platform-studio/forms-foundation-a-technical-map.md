# Forms Foundation A Technical Map

## Purpose

This map translates the approved UX correction pass into the exact tenant-web boundary for the live Forms Foundation A scaffold.

Sources used for this map:

- `AGENTS.md`
- `docs/README.md`
- `docs/codex-native-repo.md`
- `platform/frontend/docs/platform-studio/README.md`
- `platform/frontend/docs/platform-studio/taxonomy-and-naming.md`
- `platform/frontend/docs/platform-studio/form-builder-first-contract.md`
- `platform/frontend/docs/platform-studio/v2-foundation-brief.md`
- `platform/frontend/docs/platform-studio/agent-prompts.md`
- tenant-web shell and feature code under `platform/frontend/apps/tenant-web/src/**`

## Current Live Boundary

### Observed facts

- `platform/frontend/apps/tenant-web/src/app/app.tsx` already mounts the builder route tree through `renderPlatformStudioRoutes()`
- `platform/frontend/apps/tenant-web/src/app/private-app.tsx` owns the two shell seams required by the correction pass:
  - `railUtilities`
  - `headerMeta`
- `platform/frontend/apps/tenant-web/src/shared/navigation.ts` owns shell title resolution and is the correct place to extend breadcrumb/meta lookup
- the live scaffold is already app-local under:
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/`
- locale strings for the scaffold are local to:
  - `platform/frontend/apps/tenant-web/src/locales/en.ts`
  - `platform/frontend/apps/tenant-web/src/locales/es.ts`

### Inference

The correction pass can stay fully inside tenant-web and does not need:

- a new shared package
- sidebar navigation changes
- published runtime changes

## Corrected Route Model

The live Form Builder route model should be:

- `/builder/forms`
  - Form Builder master-detail page
- `/builder/forms/:modelId`
  - same Form Builder master-detail page with selected model state
- `/builder/forms/:modelId/views/:viewId`
  - minimal view workspace route

Recommended compatibility note:

- legacy `/builder/forms/:dataSchemaId/ui/:uiSchemaId` links may redirect to the corrected view route, but they are no longer the canonical IA

## Corrected Form Builder Model

### Forms master-detail page

Required behavior:

- model list and selected model detail live on one screen
- the model list stays in the left panel
- the selected model detail stays in the right panel
- the right panel shows actual view rows, not count summaries
- the right panel includes a small search field above views
- `Add model` and `Add view` stay visible as scaffold actions

Do not restore:

- a standalone model summary page
- hero blocks
- primary-emphasis owner labels
- primary-emphasis field counts
- primary-emphasis view counts

### View workspace page

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

- `Model`
- `View`
- `Structure locked`
- `Field locked`
- `Can edit views only`

Do not use `Data Schema` or `UI Schema` in visible scaffold copy.

## Reusable Technical Surface

### Reuse without edits

- `platform/frontend/packages/platform-studio-core/src/contracts/**`
- `platform/frontend/packages/platform-studio-core/src/schemas/**`
- `platform/frontend/packages/platform-studio-core/src/runtime/**`

### Reuse as technical reference only

- `platform/frontend/apps/tenant-web/src/features/published-app/**`
- approved old-code reference files under `platform/frontend/docs/platform-studio/old-code-reference/**`

### Recommended non-reuse for this pass

- no shared package extraction
- no old header entry component
- no standalone object-summary page module

## Exact Edit Boundary

### Edit existing files

- `platform/frontend/apps/tenant-web/src/app/private-app.tsx`
  - move Platform Studio entry into `railUtilities`
  - remove header split-button entry
  - wire `headerMeta`
- `platform/frontend/apps/tenant-web/src/shared/navigation.ts`
  - resolve short title plus breadcrumb/meta for builder routes
- `platform/frontend/apps/tenant-web/src/locales/en.ts`
  - add corrected scaffold copy
- `platform/frontend/apps/tenant-web/src/locales/es.ts`
  - add corrected scaffold copy
- `platform/frontend/apps/tenant-web/src/features/platform-studio/routes.tsx`
  - keep master-detail page routes together
  - keep minimal view workspace route
- `platform/frontend/apps/tenant-web/src/features/platform-studio/platform-studio-route-meta.ts`
  - resolve short titles and breadcrumb/meta
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/forms-placeholder-data.ts`
  - keep app-local placeholder data but expose model/view adapter aliases
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/pages/forms-index-page.tsx`
  - render the live master-detail page
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/pages/forms-ui-schema-workspace-page.tsx`
  - render the minimal view workspace
- `platform/frontend/apps/tenant-web/src/features/platform-studio/platform-studio.css`
  - remove hero-oriented styling and support the corrected layout

### Remove or retire live files

- `platform/frontend/apps/tenant-web/src/features/platform-studio/platform-studio-header-entry.tsx`
  - no longer the correct entry model
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/pages/forms-data-schema-page.tsx`
  - standalone model-summary page is no longer part of the live route model

## Preview Strategy For This Pass

The correction pass does not need real preview logic.

Required rule:

- keep the workspace placeholder local to the view workspace route
- do not route preview through `/app/:routeKey/*`
- do not introduce persistence or runtime-source loading

## Risks And Constraints

1. Header title and breadcrumb/meta resolution must stay synchronous because shell chrome is computed directly from pathname.
2. Lock language in this pass is UX signaling only; real enforcement still belongs to later authoring logic.
3. Placeholder add actions should stay visibly present, but they should not imply persistence or creation flows already exist.
4. The underlying runtime contracts still carry some older entity/field names, so visible model/view copy must stay aligned through adapters and compatibility aliases until migration is complete.

## Recommended Next Step After This Pass

Once this scaffold matches the approved direction, the next implementation slice should start real authoring logic inside the minimal view workspace route without reopening:

- left-rail entry placement
- master-detail Forms IA
- top-bar title/meta model
- visible model/view terminology
