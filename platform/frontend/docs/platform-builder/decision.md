# Platform Builder Decision

## 1. Final Decision

Platform Builder for tenant app should be built as a metadata-driven platform layer inside `tenant-web`, not as a standalone form builder and not inside `platform-admin-web`.

The correct target is:

- one `Entity Model`
- many `View Schemas`
- one `Navigation / Sidebar Tree`
- one `Policy Layer`
- one `Workflow / Action Binding Layer`
- one `Draft -> Validate -> Publish -> Runtime` pipeline

`Form Builder` is only one part of `View Builder`.

## 2. What Is Already Correct In `info1.md` And `info2.md`

The main ideas in both notes are aligned and should be treated as the base direction:

- one data schema must support many UI schemas
- `tenant-web` is the right home for Builder UI
- `platform-admin-web` should manage capability and rollout, not tenant UI design
- navigation must point to a target, not directly to a raw form
- workflow handlers, system modules, auth, billing, audit, storage infrastructure stay code-owned
- V1 must be structured and slot-based, not a freeform canvas
- runtime must read only published metadata, never live draft state

The second note is the more implementation-ready version because it also introduces:

- explicit V1 pillars
- minimal metamodel
- publish lifecycle
- monorepo placement
- capability model for Builder access

## 3. What `ezform` Actually Proves

The old `ezform` prototype is useful, but only as a narrow predecessor of the future `View Builder`.

What it proves well:

- drag-and-drop editing with left palette, center canvas, right inspector is the right builder interaction model
- tree-like nested editing is needed for containers such as groups, tabs, and subforms
- generating `dataSchema` and `uiSchema` from editor state is a valid idea
- grid/list projection as a separate concern is real and should exist

Evidence:

- `FormContext` already stores editable field tree plus selected node state and nested parent navigation: [FormContext.tsx](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/ezform/src/context/FormContext.tsx#L21)
- schema generation is already split into `dataSchema` and `uiSchema`: [schemaGenerator.ts](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/ezform/src/utils/schemaGenerator.ts#L4)
- canvas + inspector + palette shell already exists: [Builder.tsx](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/ezform/src/components/Builder.tsx), [FormCanvas.tsx](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/ezform/src/components/FormBuilder/FormCanvas.tsx#L68), [SettingsPanel.tsx](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/ezform/src/components/SettingsPanel/SettingsPanel.tsx#L20)
- grid configuration is already treated separately from form editing: [GridSettingsTab.tsx](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/ezform/src/components/SettingsPanel/GridSettingsTab.tsx#L7)

What it proves is wrong for the final architecture:

- `FieldType` is overloaded and mixes storage, widget, layout, source, and container semantics in one object
- container nodes and business fields share the same model
- JSON Schema is treated as the main truth instead of a generated runtime artifact
- grid/list definition is bolted onto field state via `showInGrid` and `pidGrid`
- nested editing is modeled as generic recursive children, which is too weak for explicit layout slots and view node types

Evidence:

- `Field` and `FieldType` mix `type`, `settings`, `ui`, `isContainer`, `containerType`, `allowedChildTypes`, and `disabledChildTypes`: [FormContext.tsx](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/ezform/src/context/FormContext.tsx#L21)
- palette constants mix business fields with layout containers such as `group`, `tabs`, and `tab_item`: [constants.ts](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/ezform/src/utils/constants.ts#L6)
- data type resolution is derived from UI field type names and falls back to `string`, which is not a stable storage contract: [schemaGenerator.ts](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/ezform/src/utils/schemaGenerator.ts#L134)
- list/grid behavior is embedded into generic field state instead of a dedicated dataset/list view model: [GridSettingsTab.tsx](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/ezform/src/components/SettingsPanel/GridSettingsTab.tsx#L45)

## 4. Final Architecture To Build

The platform should be split into six runtime layers and one lifecycle layer.

### A. Model Registry

Owns:

- `EntityDefinition`
- `FieldDefinition`
- `RelationDefinition`
- `ChildCollectionDefinition`
- `SemanticRoleBinding`
- optionally `OptionSetDefinition`

This layer defines storage and business meaning.

### B. View Registry

Owns:

- `ViewDefinition`
- `ViewLayoutNode`
- `ViewActionPlacement`
- `ViewVariant`

This layer defines how data is rendered.

One entity can have many views:

- form
- detail
- list
- checklist
- modal

### C. Navigation Registry

Owns:

- `NavigationTree`
- `NavigationNode`
- `NavigationTarget`

Supported V1 targets:

- `view`
- `system-module`
- `external-link`

### D. Policy Registry

Owns:

- `PolicySet`
- `FieldPolicy`
- `ActionPolicy`
- `RecordFilterPolicy`

### E. Workflow Registry

Owns:

- `WorkflowDefinition`
- `StatusDefinition`
- `TransitionDefinition`
- `ButtonDefinition`
- `ActionBinding`

Handlers stay code-owned and come from a platform registry.

### F. Runtime Registry

Owns generated state:

- `DraftSnapshot`
- `ValidationReport`
- `PublishedManifest`
- `VersionSnapshot`

### G. Lifecycle Pipeline

The correct pipeline is:

`Draft -> Validate -> Preview -> Publish -> Runtime Resolve`

The runtime tenant app must read only `PublishedManifest`.

## 5. Hard Separation Rules

These rules should be treated as non-negotiable.

### Separate data from UI

Do not store layout blocks as fields.

Examples:

- `TITLE`, `HTML`, `TABS`, `SECTION`, `DIVIDER` are `ViewLayoutNode`
- `DB LOOKUP` is a source/binding concern
- `SQL Field` is a computed field or dataset column
- relation lookup is not a standalone storage type

### Separate navigation from business scope

Do not merge:

- sidebar tree
- company/project/location scope tree

They serve different purposes and should remain different systems.

### Separate builder-owned and code-owned registries

Builder-owned:

- entities
- views
- navigation nodes
- policies
- workflows

Code-owned:

- auth model
- permission engine
- action handlers
- system modules
- audit infrastructure
- storage provisioning
- notifications
- attachments

## 6. V1 Scope

V1 should include exactly these product workspaces:

1. Entity Model Designer
2. View Builder
3. Navigation / Sidebar Builder
4. Access Builder
5. Workflow Builder
6. Publish Center

V1 should explicitly avoid:

- freeform pixel canvas
- full ER-diagram editor
- raw SQL as the primary admin DSL
- builder-defined system modules
- builder-defined auth model
- direct runtime reads from draft state

## 7. Recommended Internal Contracts

The notes already point in the right direction. The main correction is to make `View Builder` operate on a typed node tree instead of a generic recursive `Field[]`.

Recommended editor models:

```ts
type BuilderNodeId = string;

type EntityDefinition = {
  id: string;
  key: string;
  name: string;
  description?: string;
};

type FieldDefinition = {
  id: string;
  entityId: string;
  key: string;
  label: string;
  dataType: "string" | "text" | "number" | "boolean" | "date" | "datetime" | "enum" | "relation" | "file" | "json" | "computed";
  required?: boolean;
};

type ViewDefinition = {
  id: string;
  entityId: string;
  type: "form" | "detail" | "list" | "checklist" | "modal";
  channel: "web" | "mobile" | "pwa" | "public";
  title: string;
  rootNodeId: BuilderNodeId;
  variantOf?: string;
};

type ViewLayoutNode =
  | { id: BuilderNodeId; kind: "section"; slots: { body: BuilderNodeId[] } }
  | { id: BuilderNodeId; kind: "tabs"; slots: { tabs: BuilderNodeId[] } }
  | { id: BuilderNodeId; kind: "tab"; label: string; slots: { body: BuilderNodeId[] } }
  | { id: BuilderNodeId; kind: "field"; fieldId: string; widget: string }
  | { id: BuilderNodeId; kind: "collection"; collectionId: string }
  | { id: BuilderNodeId; kind: "text"; text: string }
  | { id: BuilderNodeId; kind: "divider" };
```

That model is much safer than the current `ezform` shape because it makes layout explicit and keeps entity fields outside layout nodes.

## 8. Monorepo Implementation Decision

The notes are correct here and match the current frontend workspace boundaries.

Current reality:

- `tenant-web` is still very small and only has dashboard routing plus a flat navigation list: [app.tsx](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/app/app.tsx#L191), [navigation.ts](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/shared/navigation.ts#L8)
- `tenant-web` explicitly expects app-local features to live under `src/features` before extraction to shared packages: [tenant-web README](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/README.md#L3)
- `packages/forms` is currently minimal and not yet a runtime schema engine: [forms index](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/forms/src/index.ts#L1)
- `WorkspaceShell` currently accepts a flat `WorkspaceNavItem[]`, so a navigation builder will require a richer runtime navigation contract or an adapter layer: [workspace-shell.tsx](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/app-shell/src/workspace-shell.tsx#L25), [workspace-shell.tsx](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/app-shell/src/workspace-shell.tsx#L299)

Decision:

- start with app-local Builder UI in `apps/tenant-web/src/features/platform-builder/`
- create only one new shared package first: `packages/platform-builder-core/`
- do not split runtime/designer/navigation/workflow packages until contracts stabilize

## 9. What To Reuse From `ezform`

Reuse the following ideas:

- palette / canvas / inspector screen composition
- nested structure navigation as an editor affordance
- drag-and-drop ordering within bounded zones
- schema generation as a derived artifact
- separate list/grid settings as a dedicated editor concern

Do not reuse these models directly:

- `Field`
- `FieldType`
- generic `children`
- JSON Schema as source of truth
- `showInGrid` on field definition
- `pidGrid` ordering trick

## 10. Correct Build Order

This is the safest implementation sequence for this repo.

### Phase 0. Repo Discovery And Runtime Constraints

Confirm:

- tenant routing
- auth capabilities
- tenant context
- shell extension points
- API boundary for draft and publish

### Phase 1. Core Contracts

Create `packages/platform-builder-core` with:

- entity types
- view types
- navigation types
- policy types
- workflow types
- manifest types
- zod validation

No UI here.

### Phase 2. Builder Shell In `tenant-web`

Add:

- `/builder`
- `/builder/models`
- `/builder/views`
- `/builder/navigation`
- `/builder/access`
- `/builder/workflows`
- `/builder/publish`

Guard them behind builder capabilities.

### Phase 3. Runtime Resolver

Before making a polished View Builder, implement the runtime resolver that can:

- load published manifest
- build navigation targets
- resolve route to target
- render a metadata-based view

Without this, preview remains fake.

### Phase 4. Entity Model Designer

Build first:

- entities
- fields
- relations
- child collections
- semantic roles

This is the foundation for every next designer.

### Phase 5. View Builder

Build only slot-based editing:

- sections
- groups
- tabs
- collection blocks
- field placements
- action bars

No free positioning.

### Phase 6. Navigation Builder

Build tree editing with typed targets:

- view target
- system module target
- external link target

### Phase 7. Access And Workflow

After models, views, and navigation exist, add:

- role matrix
- field access
- action permissions
- record filters
- statuses
- transitions
- action bindings

### Phase 8. Publish Center

Finalize:

- validation
- preview
- publish
- version snapshot
- rollback

## 11. Main Risks To Avoid

### Risk 1. Rebuilding another form builder

If the team starts from fields and form canvas only, the product will repeat the old limitation and fail once lists, navigation, access, and workflow need equal status.

### Risk 2. Making JSON Schema the metamodel

JSON Schema may be one output, but it should not become the platform contract.

### Risk 3. Mixing system modules into metadata

System modules should be referenced from a catalog, not authored inside tenant metadata.

### Risk 4. Freeform layout

A pixel-level editor will consume most of the project budget and still produce unstable runtime rendering.

### Risk 5. Publishing without lifecycle discipline

Draft and published states must be explicit from day one.

## 12. Short Final Answer

You do not need to choose between "form builder" and "platform builder".
The correct decision is:

- build `Platform Builder`
- make `Form Builder` one workspace inside `View Builder`
- keep Builder inside `tenant-web`
- use `platform-admin-web` only for capability control
- start with one core package and app-local UI
- treat `ezform` as a UX prototype, not as the domain model

If you follow that line, the implementation stays scalable and the old prototype remains useful as inspiration instead of becoming technical debt.
