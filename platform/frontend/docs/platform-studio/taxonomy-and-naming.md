# Platform Studio Taxonomy And Naming

Status: active
Date: 2026-04-07

## Purpose

This document locks the canonical product and contract language for Platform Studio.
Its job is to remove ambiguity before backend integration begins.

## Product umbrella

- `Platform Studio` is the umbrella product surface in `tenant-web`
- Platform Studio may contain multiple authoring tools over time

## Tool matrix

Current and planned tool names:

- `Form Builder`
  - current active implementation slice
  - owns `Model` and `View` authoring
- `Navigation Builder`
  - planned
  - owns sidebar structure, module assembly from views, and access-facing navigation composition
- `Action Builder`
  - planned
  - owns view-triggered events, notifications, conditional field changes, and similar authored actions
- future tools may be added under `Platform Studio`

## Package and code boundary matrix

- `@platform/platform-studio-core`
  - shared non-UI contract layer for Platform Studio
  - may contain contracts for multiple builders
  - must not become the whole product surface
- `platform/frontend/apps/tenant-web/src/features/platform-studio/**`
  - app-local Platform Studio UI
  - current home for Form Builder screens and builder-local state
- do not create per-builder shared packages yet
  - separate `form-builder-*`, `navigation-builder-*`, or `action-builder-*` packages must wait for proven reuse and a stable API boundary

## Canonical user-facing language

Active Form Builder UI must use:

- `Platform Studio`
- `Form Builder`
- `Model`
- `View`
- `Structure locked`
- `Field locked`
- `Can edit views only`

Do not use these as active user-facing terms in current Form Builder UI:

- `Object`
- `Screen`
- `Data Schema`
- `UI Schema`
- `UI Builder`

## Canonical technical language

Shared technical contracts should converge on:

- `ModelDefinition`
- `ModelFieldDefinition`
- `ViewDefinition`
- `LayoutNode`
- `LockPolicy`
- `StorageBinding`

Compatibility rule:

- legacy `EntityDefinition` and `FieldDefinition` exports may remain as aliases while the repo migrates
- legacy manifest payload keys such as `entities` and `fields` may remain temporarily where changing transport shape would create avoidable drift

## Canonical route model

Form Builder routes are:

- `/builder/forms`
- `/builder/forms/:modelId`
- `/builder/forms/:modelId/views/:viewId`

Legacy compatibility:

- `/builder/forms/:modelId/screens/:viewId` redirects to the canonical `/views` route
- older `/builder/forms/:dataSchemaId/ui/:uiSchemaId` links may continue to redirect during migration

## Anti-drift rules

- visible UI copy uses `Model` and `View`
- active route params use `modelId` and `viewId`
- shared package naming uses `platform-studio-*`, not `platform-builder-*`
- Form Builder implementation may keep local adapter aliases while the placeholder layer still stores older object/screen-shaped fixture data
- Navigation Builder and Action Builder remain planned Platform Studio tools, not implicit meanings of existing workflow or navigation substrate types
