# Deferred Composed Surfaces

Deferred planning note for larger frontend surfaces that matter to the product, but should not be forced into `UI Lab` or `ui-kit` too early.

This document is subordinate to:

- `ui-delivery-order.md`
- `ui-lab-structure.md`
- `package-boundaries.md`
- `ui-kit-boundary-audit.md`

## Purpose

Capture the larger workflow-shaped surfaces that the team intends to revisit after the main interface baseline is mature enough.

These items are important, but they are not reasons to:

- reopen the foundation rollout
- add a new top-level `UI Lab` section
- promote screen-shaped workflows into `ui-kit`
- blur the boundary between primitive review and app-layer composition

## Current Decision

For now:

- keep the canonical `UI Lab` top-level sections unchanged
- keep these larger surfaces in the deferred backlog
- review only their reusable subcomponents in `UI Lab`
- move only proven generic contracts into `ui-kit`

Working interpretation:

- `ui-kit` owns reusable primitives and low-risk shared contracts
- `UI Lab` owns component and pattern review for those reusable pieces
- app-layer routes own full workflow surfaces, transport logic, and page orchestration

## Classification Rule

When one of these backlog items is started, split the work into three buckets.

### 1. `ui-kit`

Move something here only if it is:

- generic
- reusable across real surfaces
- stable enough to document as a contract
- nameable without route, tenant, AI, billing, or task-manager language

Examples of possible keepers:

- a reusable upload dropzone primitive
- a generic chat composer
- a generic attachment preview tile
- a reusable board card primitive
- a stable table helper that is still generic

### 2. `UI Lab`

Use `UI Lab` only to:

- review the extracted reusable piece
- document its states and constraints
- compare stable versus provisional contracts

Do not turn `UI Lab` into:

- a messenger application
- a kanban workspace
- a file manager
- a remote-data admin page

### 3. App Layer

Keep these concerns outside `ui-kit`:

- Ajax query orchestration
- mock transport wiring
- signed upload URL flow
- browser image conversion and resize pipeline
- AI conversation state
- employee messaging workflow
- kanban workflow rules and status transitions
- page-specific actions, filters, and toolbar behavior

## Deferred Surface List

### 1. Remote Table Workspace

Goal:

- validate a data-dense table surface with remote loading, filters, actions, totals, row actions, and pagination

Keep app-layer:

- Ajax request model
- mock API wiring
- filter/query synchronization
- toolbar actions such as add, delete, reload
- total count fetching
- route or page-specific row actions

Possible extraction targets later:

- a generic table toolbar helper only if it stays small and neutral
- a reusable table empty/loading wrapper only if current primitives are not enough
- a stable pagination contract only if the existing shared contract proves insufficient

Default placement when work starts:

- app-layer sandbox route first
- only small reviewed subcomponents return to `UI Lab`

### 2. File Upload Workspace

Goal:

- support upload flow with signed URL fetching, local preprocessing, file preview, and image inspection actions

Keep app-layer:

- signed URL request flow
- upload transport
- HEIC/HEIF conversion
- browser image resize
- `markerjs2` integration
- delete and replace workflow
- real file URL opening

Possible extraction targets later:

- upload trigger or dropzone
- file tile
- attachment list row
- image preview card
- generic viewer action bar

Default placement when work starts:

- app-layer sandbox route first
- `UI Lab` only for any reusable upload or preview primitives that prove generic

### 3. AI Assistant Dialog

Goal:

- provide a dialog-based AI assistant surface launched from a button inside the main application

Keep app-layer:

- model selection
- conversation state
- prompt orchestration
- transport and streaming logic
- assistant-specific controls and policies

Possible extraction targets later:

- message list
- message bubble
- composer
- compact attachment strip

Default placement when work starts:

- review the shell as an app-layer dialog
- move only generic chat pieces into `ui-kit` after reuse is proven

### 4. Full-Screen Messenger

Goal:

- provide a larger in-page or full-screen communication surface for staff messaging

Keep app-layer:

- channel and participant model
- message transport
- presence and delivery state
- thread ownership
- staff workflow behavior

Possible extraction targets later:

- message composer
- thread list item
- message group presentation
- attachment preview row

Default placement when work starts:

- separate app-layer sandbox route
- not a normal `UI Lab` page

### 5. Kanban Task Board

Goal:

- provide a board surface where columns map to system statuses and users can move tasks between them

Keep app-layer:

- task workflow rules
- drag-and-drop state
- status transition rules
- task detail persistence
- board filtering and ownership rules

Possible extraction targets later:

- board column shell
- task card primitive
- compact board counter
- reusable task detail side panel sections

Default interaction note:

- prefer a side `sheet` or detail panel over a blocking modal for task details
- use a full page only if the task form becomes too dense for side-panel editing

Default placement when work starts:

- separate app-layer sandbox route
- review extracted pieces in `UI Lab` only if they become generic

## Delivery Order For These Backlog Items

When the team returns to these items, use this order:

1. define the app-layer workflow and mock/runtime needs
2. build the first version outside `UI Lab`
3. identify the pieces that are actually generic
4. extract only those pieces into `ui-kit`
5. document those extracted pieces in `UI Lab`
6. update audit docs only if approval status truly changes

## Immediate Rule For Current Work

Until the main interface and current component review are far enough along:

- do not create a new `UI Lab` top-level section for these items
- do not treat them as `Inventory Snapshot`
- do not promote them wholesale into `ui-kit`
- do keep this document updated as decisions sharpen
