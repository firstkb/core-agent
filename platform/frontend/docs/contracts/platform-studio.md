# Platform Studio Contract

Status: active
Owner: frontend
Last audited: 2026-04-25
Canonical scope: Platform Studio suite boundary, tool ownership, tenant-web/shared package split, and canonical suite naming

This contract defines the Platform Studio suite boundary.
It intentionally does not expand Form Builder details; current Form Builder behavior lives in `platform/frontend/docs/modules/platform-studio/form-builder.md`.

## Core Invariants

- Platform Studio is the tenant-web builder/configuration tool suite.
- Platform Studio is not a synonym for Form Builder.
- Form Builder is the current active implementation tool.
- Navigation Builder, Action Builder, PDF Builder, and Report Builder are planned tools.
- Planned tool concerns must not be implemented inside Form Builder just because Form Builder is active first.
- Platform Studio UI stays app-local in `tenant-web`.
- Shared code for Platform Studio is non-UI contracts/helpers under `@platform/platform-studio-core`.
- Do not create per-builder shared packages until reuse and API stability are proven.
- Current apps are online web apps; do not add offline/PWA/mobile assumptions to Platform Studio without explicit activation.

## Current Code Boundaries

App-local Platform Studio UI:

- `platform/frontend/apps/tenant-web/src/features/platform-studio`

Shared non-UI package:

- `platform/frontend/packages/platform-studio-core`

Current package role:

- typed metadata contracts
- runtime validation schemas
- pure snapshot/runtime helpers
- compatibility aliases while older builder terminology migrates

Package anti-scope:

- it is not the whole Platform Studio product surface
- it must not become a shared UI package by accident
- it must not absorb per-tool screens before stable reuse is proven

## Tool Ownership

Form Builder:

- status: active
- owns model and view authoring
- owns field/layout authoring
- owns authoring save
- owns additive runtime apply for managed form data
- owns runtime view entry preparation for later Navigation Builder exposure

Navigation Builder:

- status: planned
- owns sidebar/navigation composition
- owns module assembly from authored views
- owns runtime exposure of configured application entries
- is expected to own access/permission assignment unless a later accepted decision creates a separate Access Builder

Action Builder:

- status: planned
- owns authored events
- owns view-triggered behavior
- owns notifications
- owns conditional field changes
- owns post-submit side effects

PDF Builder:

- status: planned
- owns PDF template configuration
- owns generated document output from authored/runtime data
- must not be confused with a generic table row action named `pdf`

Report Builder:

- status: planned
- owns report definitions
- owns analytical/read-only reporting outputs
- owns report-specific query/group/filter/presentation settings

Future tools:

- must declare owner boundary before implementation starts
- must not widen Form Builder scope by default

## Canonical User-Facing Language

Use:

- `Platform Studio`
- `Form Builder`
- `Navigation Builder`
- `Action Builder`
- `PDF Builder`
- `Report Builder`
- `Model`
- `View`

For current Form Builder UI, use:

- `Structure locked`
- `Field locked`
- `Can edit views only`

Do not use as active user-facing Form Builder language:

- `Object`
- `Screen`
- `Data Schema`
- `UI Schema`
- `UI Builder`

## Canonical Technical Language

Shared technical contracts should converge on:

- `ModelDefinition`
- `ModelFieldDefinition`
- `ViewDefinition`
- `LayoutNode`
- `LockPolicy`
- `StorageBinding`

Compatibility aliases may remain temporarily for older names when changing transport shape would create avoidable drift.

Allowed temporary compatibility examples:

- `EntityDefinition`
- `FieldDefinition`
- manifest payload keys such as `entities` and `fields`

## Current Route Model

Form Builder authoring routes:

- `/builder/forms`
- `/builder/forms/:modelId`
- `/builder/forms/:modelId/views/:viewId`

Legacy compatibility redirects:

- `/builder/forms/:modelId/screens/:viewId`
- `/builder/forms/:dataSchemaId/ui/:uiSchemaId`

Runtime and preview route direction:

- real runtime list route: `/app/forms/:modelId/views/:viewId`
- Platform Studio preview route: `/app/platform-studio/forms/:modelId/views/:viewId`

Route rules:

- active route params are `modelId` and `viewId`
- visible UI copy uses `Model` and `View`
- `/app/platform-studio/forms/...` is preview/authoring context, not a Navigation Builder runtime target

## Current Decisions

- Form Builder `Save` is authoring persistence plus additive runtime apply, not site publication.
- Site exposure, sidebar placement, and runtime permission assignment are Navigation Builder concerns.
- Events, notification side effects, and post-submit automation are Action Builder concerns.
- PDF and report generation are separate tool concerns unless an accepted lower-level capability contract says otherwise.

## Out Of Scope

- detailed Form Builder field/catalog/backend implementation detail
- full field catalog
- Form Builder backend API/storage rules
- Navigation Builder data model
- Action Builder workflow model
- PDF template schema
- Report definition schema
- offline/PWA/mobile delivery behavior
