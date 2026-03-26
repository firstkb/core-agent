# Legacy Lineage: EzData -> EzForm -> Platform Builder

## Purpose

This document explains the real lineage of the product idea:

- `EXTDB / EzData` = old working metadata-driven platform configuration system
- `ezform` = later visual experiment focused mostly on form composition
- `Platform Builder` = the correct next system for `tenant-web`

The goal is not to copy legacy behavior literally.
The goal is to understand what legacy already solved, where it became overloaded, and which concepts must survive in the new architecture.

## 1. What `EXTDB` Actually Is

`EXTDB` is not just a "data form editor".
It is already a primitive platform builder.

This is visible in the top-level configuration shell:

- `Data Forms`
- `Modules`
- `Pages`
- `PWA`
- config import
- module import
- full recheck

Evidence: [config.htm](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/EXTDB/Template/config.htm#L4)

This means the legacy system already treated the platform as multiple registries, not as one flat form designer.

## 2. What The Screenshots Confirm

The attached screenshots match the code very closely.

### Data Forms

The `Data Forms` screen is an entity/config registry with operational actions:

- edit schema
- web form
- import data
- export data
- CSV template
- export config

This is not a pure UI builder. It is a data model + operational configuration screen.

Code evidence: [default.asp](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/EXTDB/default.asp#L1306)

### Data Form Editor

The form editor mixes:

- storage field types
- UI-only blocks
- data lookups
- related dropdown logic
- subforms
- survey elements
- report SQL fields
- form type presets such as `SOR`, `CHECKLIST`, `CA`

Code evidence:

- field type catalog: [ExtDBtbl2.htm](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/EXTDB/Template/ExtDBtbl2.htm#L187)
- form type selector: [ExtDBtbl2.htm](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/EXTDB/Template/ExtDBtbl2.htm#L675)

### Modules

The module screen is already a separate registry with:

- title
- type
- active
- access

Module types are explicit, for example `MAIN`, `SMART`, `PWA`.

Code evidence:

- module editor: [default.asp](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/EXTDB/default.asp#L691)
- module list: [default.asp](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/EXTDB/default.asp#L1248)

### Pages

The page screen is a distinct registry, separate from data forms.
It already shows:

- module binding
- page title
- active
- actions
- access
- web flag
- PWA flag
- order
- help

Code evidence: [default.asp](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/EXTDB/default.asp#L1369)

### Page Editor

The page editor already acts like a primitive view/page builder and page policy editor.
It includes:

- module binding
- attachments
- web share
- PWA
- semantic field mapping for web share
- action toggles
- page filter
- grid sorting
- grid prefilters
- per-field access
- per-field in-grid settings

Code evidence: [ExtDBpg_edit.htm](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/EXTDB/Template/ExtDBpg_edit.htm#L90)

### Access

`EXTDB` distinguishes module access and page access, each with recipient lists across:

- contacts
- companies
- job types

Page access also has a mode type controlling default allow/deny behavior.

Code evidence:

- module access: [MdlAccess.htm](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/EXTDB/Template/MdlAccess.htm#L86)
- page access: [PgAccess.htm](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/EXTDB/Template/PgAccess.htm#L86)

## 3. The Real Legacy Metamodel

From the code, the real core objects already look like this:

- `ExtDBtbl` = data form / table definition
- `ExtDBfld` = field definition
- `ExtDBmdl` = module definition
- `ExtDBpg` = page definition
- `ExtDBpgfld` = page-specific field settings
- `ExtDBview` = additional page actions/views
- `ExtDBweb` = public/web form definition
- `ExtDBmdlU/C/T` = module access assignments
- `ExtDBpgU/C/T` = page access assignments

Evidence:

- `GenerateWebForm` reads `ExtDBtbl` + `ExtDBfld`: [lib.asp](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/EXTDB/lib.asp#L171)
- `GeneratePgWebForm` reads `ExtDBpg` + `ExtDBfld` + `ExtDBpgfld`: [lib.asp](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/EXTDB/lib.asp#L249)
- page field settings persist in `ExtDBpgfld`: [default.asp](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/EXTDB/default.asp#L1477)
- extra actions/views live in `ExtDBview`: [default.asp](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/EXTDB/default.asp#L4507)
- web forms live in `ExtDBweb`: [default.asp](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/EXTDB/default.asp#L4530)

This is the key conclusion:

`EXTDB` already had the right object split at the registry level, but the UX and field model mixed too many concerns together.

## 4. What Legacy Already Solved Correctly

### A. Separate page from data form

This is one of the strongest legacy ideas.
`Data Form` and `Page` are not the same object.

That matches the target architecture perfectly:

- entity/data schema
- many views/pages

### B. One data source can support many pages

The screenshots show multiple pages for the same underlying form, and the code supports it by binding `ExtDBpg` to `ExtDBtbl`.

This is already the foundation of:

- one entity
- many views

### C. Page-specific field behavior

`ExtDBpgfld` already stores per-page field access and grid inclusion.
This means legacy understood that field behavior depends on view/page context, not only on field definition.

### D. Typed access assignments

Legacy separates:

- module access
- page access
- field visibility behavior

That is not a complete policy engine, but it is already much closer to a real platform than a simple CRUD form editor.

### E. Config portability

Legacy already supports:

- import config
- import module
- export config

That is a primitive publish/package mindset.

Evidence: [config.htm](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/EXTDB/Template/config.htm#L94)

### F. Generated runtime behavior

Legacy does not just store metadata.
It uses metadata to generate:

- physical tables
- views/grid views
- public form configs
- page-specific web form configs

Evidence:

- table and field mutation: [default.asp](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/EXTDB/default.asp#L1486)
- page web form generation: [lib.asp](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/EXTDB/lib.asp#L249)

## 5. Where `EXTDB` Breaks Down

### A. `FieldType` is overloaded

The same field catalog contains all of these:

- storage types
- UI-only blocks
- lookup bindings
- relation selectors
- survey widgets
- subforms
- report SQL fields

Evidence: [ExtDBtbl2.htm](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/EXTDB/Template/ExtDBtbl2.htm#L187)

This is the core reason the system becomes hard to evolve.

### B. FormType is overloaded too

`SOR`, `CHECKLIST`, `CA` are treated almost like structural mode switches.
That is too high-level to live in the base data schema.

In the new system they should become:

- presets
- workflow templates
- view variants
- module templates

Not the primary storage contract.

### C. Page editor mixes too many layers

In one page screen legacy mixes:

- routing/menu placement
- view behavior
- web share config
- action permissions
- filter logic
- grid config
- field access

Evidence: [ExtDBpg_edit.htm](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/EXTDB/Template/ExtDBpg_edit.htm#L103)

### D. Access is better than nothing, but not a real policy model

Legacy access is assignment-driven and page-centric.
It does not fully separate:

- navigation visibility
- CRUD permissions
- record filters
- workflow state permissions

### E. Runtime and design-time are coupled too tightly

Legacy mutates tables and runtime artifacts directly from the configuration flow.
It does not have a clean `draft -> validate -> publish` lifecycle boundary.

## 6. Where `ezform` Fits In This Lineage

`ezform` is not the successor to `EXTDB`.
It is a focused exploration of one slice of the problem:

- better visual editing UX
- drag-and-drop field composition
- nested containers
- schema generation

But compared to `EXTDB`, `ezform` is much narrower:

- it has no module layer
- no page registry
- no access layer
- no workflow layer
- no publish lifecycle
- no runtime navigation model

Evidence:

- `ezform` focuses on fields, containers, and schema output: [FormContext.tsx](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/ezform/src/context/FormContext.tsx#L21), [schemaGenerator.ts](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/ezform/src/utils/schemaGenerator.ts#L4)

So the lineage is:

- `EXTDB` preserved the broad platform problem
- `ezform` explored a better UI for only one part of that problem

## 7. Correct Mapping From Legacy To New Builder

### Keep conceptually

- `ExtDBtbl` -> `EntityDefinition`
- `ExtDBfld` -> `FieldDefinition`
- `ExtDBmdl` -> `System module or navigation group context`
- `ExtDBpg` -> `ViewDefinition`
- `ExtDBpgfld` -> `ViewFieldBinding` or field overrides inside view
- `ExtDBview` -> `ViewAction` or `secondary target / action registry`
- `ExtDBweb` -> public/web view variant
- module/page access assignments -> policy bindings

### Replace structurally

- `FieldType` catalog -> split into data type, source type, widget, layout node kind
- `FormType` -> presets/templates
- page-centric filters -> policy DSL + dataset filters
- direct DB mutation from editor -> publish pipeline + storage adapter

### Do not carry over literally

- raw numeric field type codes
- mixed form/page/module editing in one mental model
- direct table-level mutations from UI saves
- page flags as the main architecture instead of typed targets and view channels

## 8. Final Product Interpretation

If we combine all three sources:

- your notes in `info1.md` and `info2.md`
- `ezform`
- `EXTDB`

the full picture becomes clear:

### What you are coming from

You are coming from a real working metadata platform, not from a simple hand-coded form system.

`EXTDB` already proves that your product needs:

- data schema
- many pages/views
- modules
- access
- web/public variants
- import/export/config portability

### What you tried next

`ezform` is a useful UX experiment for visual view editing, but it reduced the problem too much and collapsed back into "form builder".

### What you actually need now

You need a proper `Platform Builder` with these main workspaces:

1. Model Designer
2. View Builder
3. Navigation Builder
4. Access Builder
5. Workflow Builder
6. Publish Center

And the runtime must consume only published metadata.

## 9. Final Strategic Conclusion

`EXTDB` is the strongest evidence that the target should be a metadata-driven platform builder.

It proves that:

- page is not the same as form
- module is not the same as page
- one form can drive multiple pages
- access cannot live only inside the form editor
- public/web variants are real
- import/export/version-like operations matter

`ezform` proves that:

- the future builder needs a much better visual editing experience
- left palette + center canvas + right inspector is the right interaction pattern

So the correct next step is not:

- "rewrite EXTDB in React"
- "continue only the form builder"

The correct next step is:

- keep the product breadth revealed by `EXTDB`
- keep the editor UX direction explored by `ezform`
- rebuild the system around a clean metamodel and publish pipeline inside `tenant-web`

## 10. One-Line Summary

`EXTDB` already solved the breadth of the problem, `ezform` explored the UX of one slice, and `Platform Builder` must combine both into a typed metadata platform for `tenant-web`.
