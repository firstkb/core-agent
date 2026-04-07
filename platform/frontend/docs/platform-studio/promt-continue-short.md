Продолжаем frontend development для Platform Studio.

Отвечай мне по-русски.
Markdown docs в репозитории пиши на английском.
Если summary ниже конфликтует с source-of-truth docs, docs win.

Source of truth:
- /Volumes/HD/Projects/github/firstkb/core-agent/AGENTS.md
- /Volumes/HD/Projects/github/firstkb/core-agent/docs/README.md
- /Volumes/HD/Projects/github/firstkb/core-agent/docs/codex-native-repo.md
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/README.md
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/v2-foundation-brief.md
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/forms-foundation-a-technical-map.md
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/data-schema-storage-rules.md
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/ezform-analysis.md
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/form-builder-backend-boundary.md
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/form-builder-field-catalog.md

Reference rules:
- EXTDB = legacy behavior reference only, no code copy
- ezform = main interaction reference for Form Builder, no code/UI copy
- old-code-reference = use only if really needed
- Tabler Icons may be used only through one local icon adapter layer

Approved direction:
- main builders: UI Builder and Navigation
- current active work: UI Builder / Form Builder
- visible terms stay: UI Builder / Model / View
- canonical route: /builder/forms/:objectId/views/:viewId
- keep implementation app-local in tenant-web
- do not create a new shared package without proven reuse
- keep platform-studio-core and published-app only as substrate/reference
- frontend first, backend later

Current Form Builder state:
- three-panel builder exists:
  - left palette
  - center canvas
  - right inspector
- desktop panels already use full-height + inner scroll
- left static zone: search
- center static zone: title + breadcrumb
- right static zone: tabs
- explicit Save exists
- reopen starts from root
- unsaved-changes guard exists
- app uses BrowserRouter, do not use useBlocker
- dark theme already has local fixes in platform-studio.css

Current key files:
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/features/platform-studio/platform-studio.css
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/features/platform-studio/forms/forms-builder-state.ts
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/features/platform-studio/forms/forms-builder-icons.tsx
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/features/platform-studio/forms/forms-placeholder-data.ts
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/features/platform-studio/forms/pages/forms-index-page.tsx
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/features/platform-studio/forms/pages/forms-ui-schema-workspace-page.tsx
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/features/platform-studio/routes.tsx
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/features/platform-studio/platform-builder-route-meta.ts

Field-catalog rules:
- use form-builder-field-catalog.md as current final catalog
- Long text must support historicalUpdates
- Single select and Multi select may have options
- Multi select storage/source design is still unresolved
- Tags is a preset over Multi select
- Email/Phone/URL are Short text presets
- DB lookup is first-class and must support display fields + source filters + dependent filters

How to work:
- continue in bounded frontend steps
- prioritize user-friendly UI and visual clarity
- preserve light and dark theme quality
- inspect current code before edits
- if my request is bounded, implement directly
- if something conflicts with the approved direction, say it clearly

When you finish, return only:
- changed files
- what changed
- what remains deferred
- verification results
