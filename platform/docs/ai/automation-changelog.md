# Automation Changelog

Status: active

This file tracks versioned behavior changes for the Atlas manual control-plane workflow.

It covers:
- Atlas skill
- Control prompt
- Frontend lane prompt
- Backend lane prompt
- Control-task template
- Lane-report template
- Run scaffolder
- Automation manifest

These are operational behavior contracts, not canonical product memory.

---

## 2026-04-07

### Component
- ramp-conductor skill

### Version
- 1.4.1

### Status
- active

### Changed
- sharpened direct no-run vs run-backed routing heuristics
- added continuation triage for reuse vs replacement of existing `task-id` runs
- clarified clarifying-question policy to prefer conservative routing when user clarification is not worth the stop
- added an anti-ceremony guardrail against creating runs solely for ritual completeness

### Why
- make Atlas more deterministic in daily use without adding new workflow surfaces

### Migration impact
- no schema or scaffolder changes
- Atlas may choose direct no-run more confidently and may avoid blindly continuing stale runs

---

## 2026-04-07

### Component
- control-chat prompt

### Version
- 1.4.1

### Status
- active

### Changed
- aligned intake handling with conservative clarifying-question behavior
- added section-first read discipline and explicit failure handling
- synchronized routing guidance with sharper no-run vs run-backed heuristics
- added continuation triage and compact direct/no-run response guidance
- clarified manifest-backed version reading and explicit scaffolder trigger wording

### Why
- keep the control prompt behavior aligned with the refined Atlas skill contract

### Migration impact
- no template or environment changes required
- control responses for simple no-run tasks may be shorter and more decisive

---

## 2026-04-05

### Component
- ramp-conductor skill

### Version
- 1.4.0

### Status
- active

### Changed
- made ready-to-paste lane launch prompts a first-class Atlas responsibility
- required Atlas to return lane launch prompts in the same routing response
- required Atlas to write the same launch prompts into run lane files
- clarified that direct no-run routes must still return a ready direct lane prompt

### Why
- remove the extra user step of asking Atlas again for the FE/BE bootstrap prompt after routing is already decided

### Migration impact
- new Atlas intake responses should contain `Ready Chat Prompts`
- run-backed lane files should move from launch-prompt stub to launch-prompt ready before the lane chat is opened

---

## 2026-04-05

### Component
- control-chat prompt

### Version
- 1.4.0

### Status
- active

### Changed
- added explicit ready launch prompt contract
- updated output contract to include `Ready Chat Prompts`
- required Atlas to copy launch prompts into lane files for run-backed work

### Why
- make Atlas routing responses directly actionable without a second control exchange

### Migration impact
- control responses now include copy-paste lane bootstrap prompts

---

## 2026-04-05

### Component
- control-task template

### Version
- 1.3.0

### Status
- active

### Changed
- added prompt delivery tracking fields
- added launch prompt path fields

### Why
- let Atlas track whether lane launch prompts were generated and where they live

### Migration impact
- new runs should use the updated task schema

---

## 2026-04-05

### Component
- lane-report template

### Version
- 1.3.0

### Status
- active

### Changed
- added launch metadata section
- added `Ready Chat Launch Prompt` block
- kept packet snapshot and lane return report in the same file

### Why
- make each lane file the single handoff surface for launch + execution + return report

### Migration impact
- new lane files now start with launch-prompt metadata and a prompt block

---

## 2026-04-05

### Component
- new-run scaffolder

### Version
- 1.3.0

### Status
- active

### Changed
- stamps launch-metadata fields into new lane files
- sets launch-prompt placeholders to pending instead of pretending the prompt is already rendered

### Why
- keep the scaffolder mechanical while still giving Atlas a predictable place to write the final launch prompt

### Migration impact
- Atlas should fill the lane prompt after scaffolding, not ask the user to do it manually

---


## 2026-04-05

### Component
- ramp-conductor skill

### Version
- 1.3.0

### Status
- active

### Changed
- made Atlas the default intake surface for new `platform/` work during the pilot
- kept direct no-run routing as an intentional fast-path chosen by Atlas or by explicit user bypass
- added preferred intake-brief guidance
- documented manifest-backed version synchronization checks

### Why
- centralize routing and process decisions without forcing heavy orchestration for every tiny edit

### Migration impact
- start new platform tasks with Atlas by default

---

## 2026-04-05

### Component
- control-chat prompt

### Version
- 1.3.0

### Status
- active

### Changed
- aligned control prompt with Atlas-default intake
- added preferred intake brief structure
- clarified manifest-authoritative version wording and sync script usage

### Why
- make Atlas easier to brief and reduce version-drift risk

### Migration impact
- none beyond using Atlas as the default intake surface

---

## 2026-04-05

### Component
- automation version sync script

### Version
- 1.0.0

### Status
- active

### Changed
- added `scripts/ai/automation_versions.py`
- added `--check` and `--write` modes for mirrored version fields
- documented manifest as the authoritative editable source and prompts/templates/skill files as readable mirrors

### Why
- keep readable local version fields without letting them drift from the manifest

### Migration impact
- run the script after version bumps and in CI if desired

---


## 2026-04-05

### Component
- ramp-conductor skill

### Version
- 1.2.0

### Status
- active

### Changed
- widened Atlas from non-trivial orchestration only to universal product-task intake during the v1 pilot
- added explicit direct no-run routes for tiny local FE/BE work
- made Atlas responsible for prompt selection, chat topology, and scaffolder invocation decision
- aligned skill language with run/no-run routing

### Why
- centralize routing, memory awareness, and process decisions without forcing heavy orchestration for every task

### Migration impact
- prefer Atlas first for new platform tasks; direct lane bypass remains optional for obviously tiny local edits

---

## 2026-04-05

### Component
- control-chat prompt

### Version
- 1.2.0

### Status
- active

### Changed
- turned Control into universal Atlas intake
- added route decision, run-required, prompt plan, and chat-topology output contract
- clarified no-run direct routes versus run-backed modes

### Why
- make Atlas the single routing surface for platform work during pilot

### Migration impact
- control responses should now include route decision and prompt/chat plan even when no run is created

---


## 2026-04-05

### Component
- frontend lane prompts

### Version
- 1.1.0

### Status
- active

### Changed
- clarified that the same lane summary shape should be returned whether work is run-backed or direct/no-run
- aligned lane wording with Atlas-first routing
- kept the lane itself non-owning for shared memory

### Why
- support Atlas as universal intake without forcing separate prompt families for run and no-run tasks

### Migration impact
- none beyond using the manifest-recorded version in new run artifacts

---

## 2026-04-05

### Component
- backend lane prompts

### Version
- 1.1.0

### Status
- active

### Changed
- clarified that the same lane summary shape should be returned whether work is run-backed or direct/no-run
- aligned lane wording with Atlas-first routing
- kept the lane itself non-owning for shared memory

### Why
- support Atlas as universal intake without forcing separate prompt families for run and no-run tasks

### Migration impact
- none beyond using the manifest-recorded version in new run artifacts

---

## 2026-04-05

### Component
- control-task template

### Version
- 1.2.0

### Status
- active

### Changed
- aligned task schema with the skill contract
- replaced mixed field names with one consistent field set
- added run-required, chat topology, lane plan, and memory target fields
- split facts into code-confirmed, doc-confirmed, inferred, and assumptions

### Why
- remove early schema drift between skill, templates, and scaffolder

### Migration impact
- new runs should use the updated template schema

---

## 2026-04-05

### Component
- lane-report template

### Version
- 1.2.0

### Status
- active

### Changed
- removed `partial` from lane status values
- aligned lane report fields with the skill contract
- added explicit analysis snapshot and reconciliation readiness fields

### Why
- keep lane files consistent and predictable for Atlas reconciliation

### Migration impact
- new lane files should use `active | blocked | done`

---

## 2026-04-05

### Component
- new-run scaffolder

### Version
- 1.2.0

### Status
- active

### Changed
- switched from hardcoded versions to manifest-driven version reads
- aligned generated task/lane files with the updated template schema
- stamps routing and prompt metadata more consistently

### Why
- reduce multi-file version drift and keep generated run files aligned with templates

### Migration impact
- `platform/docs/ai/automation-manifest.json` is now required for version stamping

---

## 2026-04-05

### Component
- automation manifest

### Version
- 1.0.0

### Status
- active

### Changed
- introduced `platform/docs/ai/automation-manifest.json`
- centralized live version values for skill, prompts, templates, and scaffolder

### Why
- separate live version source from change history and remove manual duplication

### Migration impact
- scripts and future workflow tooling should read version values from the manifest

---

## 2026-04-05

### Component
- orchestration boundaries guide

### Version
- 1.0.0

### Status
- active

### Changed
- added a short boundary document for Atlas versus repo-level orchestration

### Why
- reduce cognitive overhead when a task might be platform-local or repo-wide

### Migration impact
- none

---

## 2026-04-05

### Component
- ramp-conductor skill

### Version
- 1.0.0

### Status
- superseded

### Changed
- established manual control-plane orchestration skill
- added mode selection
- added task-id rules
- added run artifact lifecycle
- added lane packet and reconciliation workflow
- fixed human display name as `Atlas`

### Why
- create one stable orchestration surface for cross-stack and high-risk work

### Migration impact
- none

### Notes
- explicit invocation only via `$ramp-conductor`
- human display name: `Atlas`

---

## 2026-04-05

### Component
- control-chat prompt

### Version
- 1.0.0

### Status
- superseded

### Changed
- established stable control prompt
- memory-first read order
- task-id and mode selection rules
- task-packet workflow on top of base prompts
- shared-memory ownership by Control
- optional scaffolder usage clarified

### Why
- prevent contract drift and shared-memory race conditions

### Migration impact
- none

---

## 2026-04-05

### Component
- frontend lane prompt

### Version
- 1.0.0

### Status
- superseded

### Changed
- established stable frontend lane prompt
- boundary classification
- collection-table guardrails
- memory-delta reporting

### Why
- keep frontend execution narrow and aligned to control packets

### Migration impact
- none

---

## 2026-04-05

### Component
- backend lane prompt

### Version
- 1.0.0

### Status
- superseded

### Changed
- established stable backend lane prompt
- tenancy/auth risk focus
- contract drift checks
- memory-delta reporting

### Why
- keep backend execution narrow and aligned to control packets

### Migration impact
- none
