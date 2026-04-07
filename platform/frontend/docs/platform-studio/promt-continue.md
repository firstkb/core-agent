Продолжаем frontend development для Platform Studio.

Работай как coding partner по текущему tenant frontend.
Отвечай мне по-русски.
Все новые durable Markdown docs в репозитории пиши на английском.
Если summary ниже конфликтует с source-of-truth docs, docs win.

Primary source of truth:
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

Reference usage rules:
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/old-code-reference/** смотреть только при реальной необходимости
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/EXTDB/** использовать как legacy product-behavior reference:
  - field semantics
  - filters
  - pages
  - hidden business requirements
  - lookup behavior
  Код не копировать
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/ezform/** это главный interaction reference для Form Builder:
  - three-zone shell
  - contextual palette
  - nested level authoring
  - right inspector
  Не copy-paste UI/code
- Tabler Icons можно использовать как source for missing builder icons, but only through one local adapter layer, not by mixing random icon sets directly in the UI

Approved product direction:
- Platform Studio has two main builders:
  - UI Builder
  - Navigation
- current active work is UI Builder / Form Builder
- entry is through the rail/header shell area, not the tenant sidebar navigation tree
- visible terminology should currently stay:
  - UI Builder
  - Model
  - View
- canonical route shape is:
  - /builder/forms/:objectId/views/:viewId
- old /screens/ route is compatibility only
- do not reintroduce the old cockpit/admin-dashboard builder style
- maximize usability and clarity
- prefer calm, purposeful UI over metadata-heavy admin surfaces

Current frontend architecture direction:
- keep implementation app-local in tenant-web under platform-studio
- do not create a new shared package unless reuse is clearly proven
- keep platform-studio-core and published-app as technical substrate/reference only
- current work is frontend-first; backend docs are boundary references, not implementation scope yet

Current implementation state:
- /builder/forms page exists as UI Builder model/view master-detail surface
- Form Builder workspace exists as a three-panel builder:
  - left: palette
  - center: canvas
  - right: inspector
- desktop panel pattern is already established:
  - cards fill the available desktop height
  - internal programmatic scroll lives inside the panels
  - static top zone stays outside the scroll area
- Form Builder workspace conventions already established:
  - left static zone: search only
  - center static zone: title + breadcrumb
  - right static zone: tabs
- dark theme was already locally tuned in platform-studio.css
- Save is explicit
- reopening a builder view should start from root, not from the last nested level
- unsaved changes guard already exists
- app uses BrowserRouter, not a data router:
  - do not use useBlocker
  - use current beforeunload + custom leave-guard approach instead

Current important frontend files:
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/features/platform-studio/platform-studio.css
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/features/platform-studio/routes.tsx
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/features/platform-studio/platform-builder-route-meta.ts
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/features/platform-studio/forms/forms-builder-state.ts
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/features/platform-studio/forms/forms-builder-icons.tsx
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/features/platform-studio/forms/forms-placeholder-data.ts
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/features/platform-studio/forms/pages/forms-index-page.tsx
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/features/platform-studio/forms/pages/forms-ui-schema-workspace-page.tsx
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/app/private-app.tsx
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/locales/en.ts
- /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/locales/es.ts

Approved field-catalog direction:
- use /Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/form-builder-field-catalog.md as the current final field catalog
- do not mix layout/content/data/relation/special items into one flat legacy model
- Long text must support historicalUpdates as the V2 equivalent of Memo with Updates
- Single select and Multi select may have options
- Multi select still has unresolved backend/storage questions and must be treated carefully
- Tags is a special preset on top of Multi select, not a separate primitive
- Email / Phone / URL are not separate base field types; they are Short text presets with format/mask/validation
- DB lookup is first-class because it needs:
  - target model
  - display fields
  - stored value field
  - source filters
  - dependent filters

Approved lock/permission direction:
- locked schema/model rules are important
- if schema/model is locked, frontend must respect UI-only constraints
- do not casually allow structure edits that contradict locked-model behavior
- relation and lookup fields must eventually support filtered source examples like:
  - all users
  - filtered by selected company
  - custom display fields

Working style:
- continue in bounded steps
- do not widen into backend implementation
- when changing UI, prioritize user-friendly behavior and visual clarity
- preserve dark theme quality together with light theme
- prefer direct, concrete fixes over abstract planning unless planning is needed
- before major edits, inspect the exact current code and align with the established pattern
- when adding or changing docs, keep them durable and in English

What I want from you:
- first read the source-of-truth docs and the current implementation files that matter for the next step
- then continue helping me develop Platform Studio frontend without losing the decisions above
- if you see a conflict with the approved direction, call it out directly
- if my next request is safe and bounded, implement it directly
- when you finish a change, report:
  - changed files
  - what behavior/UI changed
  - what remains intentionally deferred
  - verification results
