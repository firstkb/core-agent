# Maestro Report: Agent And Memory Cross-Model Audit

## Executive Assessment

The two external reports are directionally correct: the agent and memory architecture is strong, but it needs drift hardening. The core model is sound: native Maestro as an owner-facing engineering partner, small memory baseline, lazy deeper reads, flat vNext artifacts, scoped specialists, evidence, and owner gates. The risk is that too many active-looking files now carry runtime authority, and a few of them still describe older behavior.

My assessment:

| Area | Score | Notes |
|---|---:|---|
| Runtime architecture | 8.5/10 | Clear adaptive Maestro model, not a fixed pipeline. |
| Agent role model | 8/10 | Strong roles; a few unregistered/orphan files create ambiguity. |
| Memory routing | 8/10 | Good baseline + routes; needs machine validation and a few doc-order fixes. |
| Contract/template consistency | 6.5/10 | Strong schemas, but markdown/templates/prose drift exists. |
| Legacy isolation | 6/10 | Legacy is documented, but still visually and operationally noisy. |
| Maintainability | 6.5/10 | Good structure, but no enough automated registry/drift checks yet. |

The most useful next move is not hiring a new agent and not a broad rewrite. It is a small drift-hardening slice plus one lightweight validator.

## What The Reports Got Right

### 1. The architecture is mature

The reports correctly identify that this is not a loose prompt folder. The repo has:

- a root runtime map and role registry;
- a native Maestro skill;
- `.codex` agent configs and contracts;
- schema-backed Maestro contracts;
- a small memory entrypoint plus read routes;
- vNext flat artifacts;
- explicit owner approval gates;
- plugin/tool policy for UI, browser, and frontend work.

This is a strong foundation and should not be replaced with a classical orchestration pipeline.

### 2. The main weakness is drift, not missing structure

The recurring failure mode is that multiple files look authoritative at the same time. When one is updated and another is not, agents may receive conflicting instructions. This was verified in several places below.

### 3. Automated consistency checks are missing

The reports are right that current checks do not fully protect:

- agent file registration;
- active vs legacy contracts;
- stage enum alignment;
- template path resolution;
- template/schema mismatch;
- memory route path existence;
- stale decisions that reference deleted runtime surfaces.

This should be addressed with a small repo-local validator before more runtime complexity is added.

## Verified Findings

### P0-1. Stale artifact governance standard conflicts with vNext

Verified.

`.codex/standards/runtime/artifact-governance.md` still describes the old module feature tree:

- `artifacts/<module>/`
- `artifacts/<module>/features/<feature>/`
- CLI-owned mutable lifecycle state
- `status.json`

This conflicts with the current root runtime and Maestro skill, which use:

- `maestro/artifact/active/YYYY-MM-DD-<work-slug>/`
- `maestro/artifact/archive/YYYY-MM-DD-<work-slug>/`
- `work.md`, `evidence.md`, `closeout.md`

This is high priority because `.codex/standards/README.md` still includes `runtime/artifact-governance.md` in the runtime read order.

Recommendation: rewrite this standard for vNext, or rename the current file to a legacy standard and remove it from the active read path.

### P0-2. Unregistered `foundation-*` agent files create ambiguity

Verified.

The live `.codex/agents/` directory contains:

- `foundation-explorer.toml`
- `foundation-reviewer.toml`

They are not registered in `.codex/config.toml`, have no matching skill and no `.codex/contracts/<agent>/` folder. This violates the practical expectation that `.codex/agents/*` is an active runtime surface.

The first external report overstated one detail: there is no duplicate nickname inside the active `.codex/config.toml` registry. However, `foundation-explorer.toml` itself includes `nickname_candidates = ["Charlie", "Scout", "Map"]`, so if any future tool scans agent files directly rather than config, it can collide conceptually with active Charlie/Scout roles.

Recommendation: delete, move to explicit legacy/experimental storage, or fully register them. Prefer delete or explicit legacy storage because Charlie/Lens/Scout already cover the useful behavior.

### P0-3. `planning` mode wording conflicts between runtime and character docs

Verified.

Current surfaces disagree:

- `maestro/docs/runtime-contract.md` and `.agents/skills/maestro/SKILL.md`: planning permits lean artifact updates once T1+ work is understood.
- `maestro/docs/maestro-character.md`: planning says `no edits, repository inspection allowed`.

The current runtime decision is correct: planning should not edit product code, but may create/update lean artifacts for T1+ continuity. The character doc is stale.

Recommendation: update `maestro-character.md` to say "no product code edits; lean Maestro artifact updates allowed once T1+ work is understood."

### P0-4. `intake` stage is inconsistently modeled

Verified, but the interpretation needs care.

`intake` exists in:

- `maestro/docs/stage-contract.md`
- `maestro/contracts/orchestration-plan.schema.json`

It does not exist in:

- `maestro/contracts/task-packet.schema.json` `assigned_stage`
- `maestro/contracts/stage-handoff.schema.json` `stage`

This may be intentional: `intake` is probably Maestro-owned orchestration state and should not produce specialist packets/handoffs. But that rule is not explicit enough. If `intake` is plan-only, schemas should document that asymmetry. If `intake` can be assigned or handed off, the enums are incomplete.

Recommendation: do not blindly add `intake` everywhere. First decide and document one of two models:

- preferred: `intake` is orchestration-only and never packeted/handoffed;
- alternative: `intake` becomes a packet/handoff stage with clear role rules.

### P1-1. Legacy `.codex/contracts/*/contract.json` template paths are broken

Verified.

Legacy contracts reference templates such as `../templates/brief.md.tmpl`, but actual files live under `.codex/templates/<agent>/...`. Resolving those relative to the contract file fails.

Affected files include:

- `.codex/contracts/module_orchestrator/contract.json`
- `.codex/contracts/research_codebase/contract.json`

This is lower priority than P0 because these are legacy-only, but legacy continuation is still allowed for old `artifacts/<module>/...` runs.

Recommendation: either fix the paths to `.codex/templates/<agent>/...` or mark the fields as legacy/dead if no runtime consumes them.

### P1-2. Approval mapping README misses enum values

Verified.

`maestro/contracts/approval.schema.json` and `maestro/templates/approval.md.tmpl` include:

- `runtime_restore`
- `destructive_operation`

`maestro/contracts/README.md` mapping does not list them.

Recommendation: update the README table. If there are no `owner_*` gate names for these, state that they are direct approval record types.

### P1-3. Markdown templates and JSON schemas are not fully aligned

Verified, with some nuance.

Examples:

- `closeout.schema.json` requires `owner_input_required`; `closeout.md.tmpl` has no matching field or section.
- `packet.md.tmpl` omits `approval` and `archive` in its assigned-stage placeholder while the schema allows them.
- `evidence.schema.json` describes one structured evidence item; `evidence.md.tmpl` is an aggregate evidence log. This can be valid, but the relationship is undocumented.
- `review.md.tmpl` has a narrower verdict set than `stage-handoff.schema.json` recommendation. That may be intentional for review notes, but should be documented or renamed.

Recommendation: do not force every markdown template to mirror every JSON field one-to-one. Instead document which templates are aggregate human-readable files and add required missing fields where they matter for closeout/resume.

### P1-4. Decision memory contains stale active-looking legacy entries

Verified.

Several decisions still reference deleted `maestro/memory/runs/**` or `maestro/memory/retired-runtime/**` paths. Some are correctly marked `superseded`, but at least `DEC-060`, `DEC-062`, and related entries still read as active landed operational guidance while `DEC-088` says retired runtime provenance was removed from the active tree.

This is not a catastrophic memory flaw because `DEC-088` exists, but it creates unnecessary cognitive tax and can confuse retrieval.

Recommendation: leave historical provenance intact, but update active statuses/wording so no active decision tells agents to use deleted retired-runtime paths.

### P1-5. Frontend memory doc-map read order conflicts with memory baseline

Verified.

`maestro/memory/docs/frontend/doc-map.md` starts its read order with `maestro/memory/index/memory-index.yaml`, while `START_HERE.md` and the Maestro skill say `memory-index.yaml` is broader routing, not a default first-read file.

Recommendation: update frontend doc-map to start from `START_HERE.md` / `read-routes.yaml` and then deepen only when routed.

### P1-6. Frontend drift report has a stale follow-up item

Verified.

`maestro/memory/docs/frontend/drift-report.md` says the old `auth-runtime-followups.md` pointer file was deleted, but later still says to rewrite or archive it.

Recommendation: remove or reword the stale follow-up.

### P1-7. Release handoff filename has redundant wording

Verified.

`.codex/contracts/release_manager/contract.json` uses:

```text
handoff-release-release-{attempt}.json
```

Recommendation: change to `handoff-release-manager-{attempt}.json` or `handoff-release-{attempt}.json`. This is cosmetic but cheap and reduces confusion.

### P2-1. `read-routes.yaml` and memory index need validation

Verified as a missing guard, not a current proven failure.

`read-routes.yaml` is useful, but it is now large enough that path existence, unique route ids, and retired-path prevention should be checked mechanically.

Recommendation: add a small runtime/memory validator or extend `docs_memory_check.py`.

### P2-2. Local browser auth is ignored but still deserves a guard

Verified.

`maestro/memory/local/browser-use-auth.md` is ignored by `.gitignore` and is not tracked. This is good. The risk is not current leakage; the risk is future accidental movement or copying into tracked artifacts.

Recommendation: add a guard that fails if `maestro/memory/local/**` is tracked or if obvious local auth tokens are referenced from tracked artifacts.

## Claims I Would Not Adopt Blindly

### 1. Full stage-to-role schema hard-locking may be too rigid

The second report proposes strict schema rules such as:

- `research -> charlie`
- `audit -> grant`
- `implementation -> mason`
- `verification -> scout`
- `review -> lens`
- `closeout -> scribe`
- `memory -> archivist`

This is mostly right for specialist packets, but too rigid if applied globally. Maestro may handle small work inline, may perform owner-facing planning, and may record low-risk notes without launching a specialist.

Recommendation: apply role/stage constraints only when `assigned_role` is a specialist packet or when `output_mode = handoff_json`. Preserve Maestro's ability to keep work inline.

### 2. The Maestro skill is long, but do not shrink it before fixing drift

The skill is 343 lines. That is not tiny, but it now contains important rules recently agreed with the owner: UI/UX ownership, plugin/tool policy, context compaction, artifact resume, and next-step behavior.

Recommendation: after P0/P1 drift is fixed, consider a semantic reduction. Do not compress it first and risk losing newly agreed behavior.

### 3. `target-docs-structure.md` is not simply wrong

The file clearly says it is a future physical rewrite plan and that no tracked files are moved by the plan. It does mix landed progress and future targets, but this is less dangerous than the reports imply.

Recommendation: improve visual separation between landed and future-only paths, but do not treat it as a P0 defect.

### 4. `current-state.md` is not currently too large

It is 178 lines. That is reasonable for current state. It should be monitored, not rewritten immediately.

### 5. `allow_implicit_invocation: false` for Maestro is probably acceptable

The owner intentionally uses `$maestro`, and explicit invocation helps avoid accidental runtime activation. I would not change this unless actual invocation friction appears.

## Recommended Prioritized Plan

### Slice A: High-confidence drift cleanup

Goal: make the active runtime surfaces stop contradicting each other.

Checklist:

- Rewrite or legacy-mark `.codex/standards/runtime/artifact-governance.md`.
- Update `.codex/standards/README.md` read order if needed.
- Resolve `foundation-explorer.toml` and `foundation-reviewer.toml`.
- Align `planning` mode wording in `maestro/docs/maestro-character.md`.
- Decide/document `intake` stage semantics.
- Fix approval mapping docs.
- Fix or explicitly legacy-mark broken template paths.
- Clean stale active-looking decision entries.

### Slice B: Template/schema hygiene

Goal: reduce future handoff and closeout ambiguity.

Checklist:

- Add `owner_input_required` to closeout markdown template or document markdown/JSON mapping.
- Update packet stage placeholder or document non-packetable stages.
- Clarify evidence item schema vs aggregate evidence markdown.
- Rename or align review verdict semantics.
- Fix release handoff filename.

### Slice C: Runtime model validator MVP

Goal: catch drift automatically.

Minimum checks:

- Every `.codex/agents/*.toml` is registered or explicitly ignored as legacy/experimental.
- Every registered config file exists.
- Active agents have contract folders.
- Template paths in contract files resolve.
- Stage enum subsets are intentional and documented.
- `read-routes.yaml` paths exist unless explicitly optional/future/legacy.
- `maestro/memory/local/**` is not tracked.

### Slice D: Skill and docs compaction

Goal: reduce hot-path cost without losing agreed behavior.

Checklist:

- Only after drift cleanup, reduce repetitive text in Maestro skill.
- Keep owner/engineering boundary, UI/UX ownership, plugin policy, compaction continuity, artifact resume, and next-step rule in the hot skill.
- Move rationale and examples to runtime docs.

## Final Judgment

The external reports are useful and mostly accurate. The best parts are the concrete drift findings and the call for automated consistency checks. The weakest parts are where they recommend over-hardening the adaptive runtime into rigid schema routing, or treating intentionally future/aggregate docs as defects.

The architecture should stay adaptive and owner-facing. The next improvement should be surgical: eliminate stale authoritative files, make active/legacy boundaries mechanically obvious, and add a small validator so drift cannot quietly return.
