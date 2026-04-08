---
template_id: control-task
template_version: 1.3.0
status: active
owner: ramp-platform-v108
last_updated: 2026-04-05
---

# CONTROL TASK

## Metadata
- task_id: 2026-04-08_research_form-builder-field-catalog-analysis
- title: Form Builder field source analysis
- status: closed
- created_at: 2026-04-08 10:19:42 -0400
- updated_at: 2026-04-08 11:02:00 -0400
- created_by: Atlas
- skill_name: ramp-conductor
- skill_display_name: Atlas
- skill_version: 1.4.1
- control_prompt_version: 1.4.1
- frontend_prompt_version: 1.1.0
- backend_prompt_version: 1.1.0

## Routing Decision
- run_required: yes
- primary_mode: RESEARCH_CONTRACT_LOCK
- recommended_chat_topology: CONTROL_ONLY
- active_lanes: none
- execution_order: research first
- scaffolder_action: created via new-run 1.3.0
- run_artifact_scope: platform/docs/ai/runs/2026-04-08_research_form-builder-field-catalog-analysis/

## Goal
- goal: Analyze EXTDB, ezform, and smartapp to derive a consolidated field catalog and page/filter notes for Platform Studio Form Builder
- why_now: The team needs a durable field inventory and legacy-to-V2 mapping before continuing Form Builder contract work
- business_or_technical_value: Lock the next Form Builder field catalog on observed legacy/runtime evidence instead of memory, and separate field primitives from page/view metadata, filters, and presentational presets.

## Scope
- in_scope:
  - inventory legacy field types and their identifiers from `platform/frontend/docs/platform-studio/EXTDB/`
  - capture `EzData Page` / view-level settings and filter configuration from EXTDB templates and UI surfaces
  - inventory the authored element taxonomy and schema split from `platform/frontend/docs/platform-studio/ezform/`
  - inspect `platform/frontend/docs/platform-studio/smartapp/src/templates/ejs/fields/*` as the current visual/runtime reference for field rendering
  - identify overloaded templates or name-marker conventions in smartapp where one template represents multiple legacy field behaviors
  - produce a normalized mapping toward Platform Studio V2 field/layout/content categories
- out_of_scope:
  - backend persistence design changes
  - implementing new Form Builder UI or runtime rendering
  - changing current canonical contracts unless the research clearly exposes a missing or incorrect documented contract
  - treating legacy builder UX as the default V2 baseline

## Locked Invariants
- locked_invariants:
  - Platform Studio Form Builder remains the active builder direction.
  - `ezform` is an interaction reference only, not code to copy.
  - old builder/runtime references may inform the catalog, but must not silently redefine the V2 contract.
  - V2 must keep field primitives separate from layout blocks, content blocks, readonly presets, relation presets, and page/view metadata.
  - visible product language for the active builder stays `Model` and `View`.
  - the output must distinguish field-level settings from page-level settings and from filter-level settings.

## Confirmed Shared Contract
- confirmed_shared_contract:
  - `platform/frontend/docs/platform-studio/form-builder-field-catalog.md` is the canonical target doc for the final field and layout catalog.
  - `platform/frontend/docs/platform-studio/form-builder-first-contract.md` locks the first backend-facing Form Builder contract around models, model fields, views, layout draft tree, locks, and save semantics.
  - `platform/docs/ai/modules/platform-studio.md` explicitly says not to turn old builder UI into the baseline again.

## Facts and Assumptions
- code_confirmed_facts:
  - `EXTDB`, `ezform`, and `smartapp` source trees are present under `platform/frontend/docs/platform-studio/`.
  - smartapp contains EJS field templates keyed by legacy numeric field identifiers such as `200`, `201`, `202`, `2030`, `2031`, `205`, `30`, `31`, `32`, `33`, `70`, `71`, `72`, `80`, `90`, `131`, `135`, `301`, and `302`.
  - the existing canonical field catalog doc already contains a first-pass legacy-to-V2 mapping and needs verification against source trees.
- doc_confirmed_facts:
  - Platform Studio module memory lists `form-builder-field-catalog.md` among the current source-of-truth surfaces.
  - `ezform-analysis.md` already positions ezform as an interaction reference and not a production baseline.
- inferred_facts:
  - the field catalog likely needs a stronger split between legacy field ids, smartapp render templates, and page/view/filter metadata than the current canonical doc provides.
  - smartapp likely encodes some behavior through template reuse and field-name markers because the old builder was hard to extend.
- assumptions:
  - the requested deliverable should include both a normalized field list for Form Builder and supporting notes for page settings and filters, with filters potentially split into a separate follow-up doc if the evidence is rich enough.

## Lane Plan
- lane_plan: mode=RESEARCH_CONTRACT_LOCK; lanes=none; Atlas will run three parallel research agents for EXTDB, ezform, and smartapp, then reconcile the outputs into one normalized catalog.
- fe_goal:
- fe_allowed_scope:
- fe_likely_files_or_modules:
- fe_locked_constraints:
- fe_required_reads:
- fe_required_checks:
- fe_expected_report_path:
- be_goal:
- be_allowed_scope:
- be_likely_files_or_modules:
- be_locked_constraints:
- be_required_reads:
- be_required_checks:
- be_expected_report_path:

## Prompt Delivery
- prompt_delivery_status: ready
- frontend_launch_prompt_path:
- backend_launch_prompt_path:
- direct_launch_prompt_required: no
- prompt_delivery_notes: No FE/BE lane chat is planned. Research is being performed through Atlas-controlled parallel codebase analysis packets.

## Memory and Risk
- memory_sources_read:
  - `AGENTS.md`
  - `platform/AGENTS.md`
  - `platform/docs/ai/README.md`
  - `platform/docs/ai/current-state.md`
  - `platform/docs/ai/canonical-docs.md`
  - `platform/docs/ai/modules/platform-studio.md`
  - `platform/frontend/AGENTS.md`
  - `platform/frontend/docs/README.md`
  - `platform/frontend/docs/platform-studio/README.md`
  - `platform/frontend/docs/platform-studio/form-builder-first-contract.md`
  - `platform/frontend/docs/platform-studio/forms-foundation-a-technical-map.md`
  - `platform/frontend/docs/platform-studio/form-builder-field-catalog.md`
  - `platform/frontend/docs/platform-studio/ezform-analysis.md`
- memory_update_targets: current-state.md | decisions-log.md | relevant modules/*.md | canonical-docs.md if authority changed
- approvals_required: none
- risks:
  - legacy source trees may mix field definitions, view settings, and rendering quirks in the same surfaces
  - smartapp template behavior may be partly implicit and require inference from naming and conditional rendering
  - existing canonical field catalog may need careful refinement instead of a wholesale rewrite

## Control Progress
- next_control_step: Research reconciled. Owner review is now needed on the corrected migration rules for `202`, `2031`, `201`, and `90`, followed by slice-1 palette and inspector-schema locking.
- checkpoint_notes:
  - completed research packets: EXTDB legacy builder, ezform prototype, smartapp runtime templates
  - updated canonical field catalog with source-backed corrections and overlay rules
  - added a supporting page/filter notes document and registered it in active docs indexes

## Final Closeout
- final_status: closed
- shared_memory_updates_applied: `platform/frontend/docs/platform-studio/form-builder-field-catalog.md`, `platform/frontend/docs/platform-studio/form-builder-page-and-filter-notes.md`, `platform/frontend/docs/platform-studio/README.md`, `platform/frontend/docs/README.md`, `platform/docs/ai/canonical-docs.md`
- unresolved_items:
  - lock the final V2 treatment of legacy `202`
  - lock when `2031` remains boolean versus generic single-select
  - decide how much of checklist, SOR, and CA remains in slice 1 versus later presets
- archive_recommendation: archive after owner review if no immediate follow-up run is needed
