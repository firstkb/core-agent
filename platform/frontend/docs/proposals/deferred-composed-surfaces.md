# Deferred Composed Surfaces Proposal

Status: future proposal
Owner: frontend
Last audited: 2026-04-25
Canonical scope: deferred workflow-shaped frontend surfaces that must not be promoted wholesale into UI Lab or UI Kit

This proposal captures larger frontend surfaces that may matter later, but are not active implementation scope.
They must not reopen the UI foundation rollout, add default UI Lab top-level sections, or move screen-shaped workflows into `@platform/ui-kit`.

Read with:

- `platform/frontend/docs/contracts/ui-kit.md`
- `platform/frontend/docs/guides/ui-lab.md`
- `platform/frontend/docs/contracts/package-boundaries.md`

Authoritative active boundaries:

- `platform/frontend/docs/contracts/ui-kit.md`
- `platform/frontend/docs/guides/ui-lab.md`
- `platform/frontend/docs/contracts/package-boundaries.md`

## Decision

Keep deferred workflow-shaped surfaces out of the hot UI Kit/UI Lab path.

Current default:

- keep canonical UI Lab sections unchanged
- keep full workflow surfaces in app-layer or future sandbox routes first
- review only proven generic subcomponents in UI Lab
- promote only stable, reusable, route-neutral pieces into `ui-kit`
- do not treat donor page names or mock workflow labels as product contracts

## Classification Rule

When a deferred surface is activated, split the work into three buckets.

`ui-kit` bucket:

- generic primitive or low-risk reusable pattern
- reusable across real surfaces or clearly foundational
- stable enough to document as a contract
- nameable without route, tenant, AI, billing, upload, messaging, kanban, or task-manager language
- free of transport, auth, tenant, routing, and workflow orchestration

UI Lab bucket:

- extracted reusable piece only
- component states, accessibility, props/API notes, constraints, and avoid-cases
- stable versus provisional review visibility

App-layer bucket:

- Ajax/query orchestration
- mock or real transport wiring
- signed upload URL flow
- browser file conversion/resize pipeline
- AI conversation state and prompt orchestration
- messaging channel/thread/participant workflow
- kanban status transition rules
- page-specific actions, filters, toolbars, and route state

## Deferred Surfaces

### Remote Table Workspace

Goal:

- validate a data-dense remote table surface with loading, filters, actions, totals, row actions, and pagination

Keep app-layer:

- request/query model
- mock API wiring
- filter/query synchronization
- add/delete/reload toolbar actions
- total count fetching
- page-specific row actions

Possible extraction later:

- small neutral table toolbar helper
- table empty/loading wrapper if current primitives are insufficient
- pagination extension only if the existing shared contract proves insufficient

Default start:

- app-layer sandbox route first
- only small reviewed subcomponents return to UI Lab

### File Upload Workspace

Goal:

- support upload flow with signed URL fetching, local preprocessing, file preview, and image inspection actions

Keep app-layer:

- signed URL request flow
- upload transport
- HEIC/HEIF conversion
- browser image resize
- marker/annotation integration
- delete and replace workflow
- real file URL opening

Possible extraction later:

- upload trigger or dropzone
- file tile
- attachment list row
- image preview card
- generic viewer action bar

Default start:

- app-layer sandbox route first
- UI Lab only for reusable upload or preview primitives that prove generic

### AI Assistant Dialog

Goal:

- provide a dialog-based AI assistant surface launched from inside the main application

Keep app-layer:

- model selection
- conversation state
- prompt orchestration
- streaming and transport logic
- assistant-specific controls and policy

Possible extraction later:

- message list
- message bubble
- composer
- compact attachment strip

Default start:

- review the shell as an app-layer dialog
- move only generic chat pieces into `ui-kit` after reuse is proven

### Full-Screen Messenger

Goal:

- provide larger in-page or full-screen communication for staff messaging

Keep app-layer:

- channel and participant model
- message transport
- presence and delivery state
- thread ownership
- staff workflow behavior

Possible extraction later:

- message composer
- thread list item
- message group presentation
- attachment preview row

Default start:

- separate app-layer sandbox route
- not a normal UI Lab page

### Kanban Task Board

Goal:

- provide a board where columns map to system statuses and users move tasks between them

Keep app-layer:

- task workflow rules
- drag-and-drop state
- status transitions
- task detail persistence
- board filtering and ownership rules

Possible extraction later:

- board column shell
- task card primitive
- compact board counter
- reusable task-detail side-panel sections

Default start:

- separate app-layer sandbox route
- prefer a side sheet/detail panel over a blocking modal for task details
- use a full page only if the task form becomes too dense for side-panel editing
- review extracted pieces in UI Lab only if they become generic

## Delivery Order

When one of these surfaces becomes active:

1. define the app-layer workflow and mock/runtime needs
2. build the first version outside UI Lab
3. identify pieces that are actually generic
4. extract only those pieces into `ui-kit`
5. document extracted pieces in UI Lab
6. update UI Kit approval only if status truly changes

## Current Guardrail

Until the main interface and current component review mature:

- do not create a new UI Lab top-level section for these items
- do not treat them as Inventory Snapshot content by default
- do not promote them wholesale into `ui-kit`
- do not implement them as active scope without owner activation
