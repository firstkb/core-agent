---
doc_status: current
doc_scope: next_phase
doc_type: readiness_plan
canonical_for: maestro_pre_launch_reference
phase_status: in_progress
---

# Maestro Reference Plan Before Orchestration

This document defines the implementation plan for bringing Maestro to reference quality up to the point where downstream orchestration can start.

The target boundary is deliberate:

- Maestro must be reference-ready through brief discussion, brief approval, feature seeding, execution approval, and ordered feature start.
- Maestro must stop at clean owner-facing boundaries.
- Feature execution must remain sequential.
- No parallel feature orchestration is part of this phase.

This phase ends when:

- the first feature can be started cleanly;
- later features can be started one by one in approved order;
- Maestro behavior is deterministic and owner-facing.

This phase does not yet include:

- richer downstream taxonomy finalization;
- recovery paths like `block` / `escalate_to_owner`;
- autonomous run-to-completion across all features;
- full post-launch stage routing beyond the first sequential handoff model.

## Current Progress

- `4.1 Live Contracts Cleanup` — done
- `4.2 Grant Contract` — done
- `4.3 Prompt Hardening` — done
- `4.4 Brief Structure Finalization` — done
- `4.5 Acceptance Suite` — partial

---

## 1. Fixed Operating Model

## 1.1. Modes

Maestro should expose only two operating modes:

- `discuss`
- `continue`

### `discuss`

Use when:

- a module run does not exist yet;
- the owner wants to create a new run;
- the owner wants to discuss and shape the brief.

Expected behavior:

- create the module if it does not exist;
- author or refine `brief.md`;
- stay inside discussion unless the owner explicitly asks to advance.

### `continue`

Use when:

- the module already exists;
- Maestro must inspect current state and continue from the current lifecycle boundary.

Expected behavior:

- read current `brief.md` and `status.json`;
- determine the current valid next owner-facing action;
- execute only the requested owner intent;
- stop at the correct lifecycle boundary.

### What is not a mode

These are not modes:

- `refine brief`
- `approve brief`
- `seed features`
- `approve execution`
- `start first feature`
- `start next feature`

These are owner intents inside `continue`.

---

## 1.2. Optional brief reviewer

The optional brief review helper is:

- system name: `brief_auditor`
- human nickname: `Grant`

`Grant` is not a mode and not a lifecycle owner.

`Grant` is an optional helper that may be invoked only:

- when the owner explicitly asks for brief review;
- or when Maestro recommends review and the owner agrees.

`Grant` does not:

- approve the brief;
- change JSON state;
- create extra artifact files;
- advance lifecycle.

`Grant` only contributes clearly marked notes under `## Reviewer Notes` in `brief.md`.

---

## 1.3. One brief, no extra pre-launch documents

Before downstream orchestration starts:

- keep only one module-level working document: `brief.md`
- do not introduce `brief-approved.md`
- do not introduce `feature-index.md`
- do not introduce a separate brief-audit document

Feature materialization happens after brief approval:

- seed features in approved order
- author one feature `README.md` per feature in the same pass

---

## 1.4. Sequential feature execution only

The first cut is strictly sequential:

- one active feature at a time
- no parallel feature launches
- later features wait until earlier features reach a stable accepted boundary or complete

If dependencies exist:

- dependency feature must appear earlier in the approved order
- dependent feature must not start before the dependency boundary is satisfied

---

## 2. Owner Intents

These are the owner-facing actions Maestro should understand and execute.

## 2.1. `approve brief`

Meaning:

- the owner approves the current brief and wants it frozen

Internal CLI mapping:

If current phase is `discussion`:

1. `module submit-for-brief-approval --module <module>`
2. `module record-owner-approval --module <module> --approval brief`
3. `module freeze-brief --module <module>`

If current phase is already `awaiting_owner_brief_approval`:

1. `module record-owner-approval --module <module> --approval brief`
2. `module freeze-brief --module <module>`

Expected stop point:

- module ends in `brief_frozen`
- `brief.md` is frozen by process rule
- no features are seeded yet

Owner-facing summary:

- `brief approved and frozen`

Notes:

- `freeze` is not a separate owner-facing intent
- it is part of `approve brief`

---

## 2.2. `seed features`

Meaning:

- materialize all owner-approved features from the frozen brief

Internal steps:

For each approved feature, in owner-approved order:

1. choose the stable `feature_id`
2. `feature seed --module <module> --feature <feature>`
3. verify feature `status.json`
4. author feature `README.md`

Expected stop point:

- all approved features exist
- `module.status.json.features` preserves approved order
- each feature has `status.json`
- each feature has `README.md`
- all seeded features remain in `seeded`

Owner-facing summary:

- `features seeded`

Notes:

- this intent always preserves ordering
- this intent is not split into a separate `author feature README` owner step

---

## 2.3. `approve execution`

Meaning:

- the owner allows execution to begin later
- this does not automatically start the first feature

Internal CLI mapping:

If current phase is `brief_frozen`:

1. `module prepare-execution --module <module>`
2. `module record-owner-approval --module <module> --approval execution`

If current phase is already `awaiting_owner_execution_approval`:

1. `module record-owner-approval --module <module> --approval execution`

Expected stop point:

- execution is approved
- no feature is started yet

Owner-facing summary:

- `execution approved`

Notes:

- this is permission to start execution
- this is not automatic run-to-completion

---

## 2.4. `start first feature`

Meaning:

- start the first launchable feature in approved order

Internal steps:

1. determine the first launchable feature in `module.status.json.features`
2. verify dependency preconditions are satisfied
3. `feature set-next-stage --module <module> --feature <feature> --stage research`
4. `stage start --module <module> --feature <feature> --stage research --agent research_codebase`

Expected stop point:

- the first feature is in `stage_in_progress`
- later features remain idle
- Maestro stops and hands off to downstream execution

Owner-facing summary:

- `first feature started`

Notes:

- this phase assumes `research` as the first stage in the current minimal path

---

## 2.5. `start next feature`

Meaning:

- start the next feature in approved order after the current feature is accepted far enough or completed

Internal steps:

1. find the next launchable feature after the previously active one
2. verify ordering and dependency conditions
3. `feature set-next-stage --module <module> --feature <feature> --stage research`
4. `stage start --module <module> --feature <feature> --stage research --agent research_codebase`

Expected stop point:

- the next ordered feature is in `stage_in_progress`
- later features remain idle

Owner-facing summary:

- `next feature started`

Notes:

- `start next feature` must not skip ahead in the ordered roster

---

## 2.6. `Grant review`

Meaning:

- run optional brief review before owner approval

Internal behavior:

1. invoke `brief_auditor / Grant`
2. gather review notes
3. insert clearly marked notes under `## Reviewer Notes` in `brief.md`

Expected stop point:

- module lifecycle does not change
- `brief.md` remains the only module-level document

Owner-facing summary:

- `Grant review inserted into brief`

---

## 3. Canonical Pre-Launch Sequence

This is the reference Maestro sequence before orchestration launch.

1. `discuss`
2. refine `brief.md` as needed
3. optional `Grant review`
4. `approve brief`
5. `seed features`
6. `approve execution`
7. `start first feature`
8. later: `start next feature`

This is the owner-facing sequence.

Internal CLI fragmentation may exist underneath, but the model should reason about this owner-facing sequence.

---

## 4. Implementation Workstreams

## 4.1. Live Contracts Cleanup

Status:

- done

Goal:

- clean up the live contract layer so the repo does not describe multiple conflicting Maestro models

Scope:

- `AGENTS.md`
- working-set docs
- future-target document labels

Required work:

- remove or rewrite outdated validator-first guidance in `AGENTS.md`
- ensure `AGENTS.md` matches the current typed CLI and current artifact model
- clearly mark future-target docs as future-target rather than live runtime contract
- ensure the working-set docs remain the only active pre-launch reference

Acceptance:

- no contradiction between `AGENTS.md`, prompt, and working-set docs

## 4.2. `Grant` Contract

Status:

- done

Goal:

- fully define `brief_auditor / Grant`

Required decisions:

- purpose
- invocation rules
- allowed reads
- allowed writes
- output shape
- insertion format under `Reviewer Notes`

Recommended contract:

- read-only except for the returned note payload
- no JSON writes
- no lifecycle transitions
- no extra files
- no approval authority

Acceptance:

- a complete `Grant` contract exists
- Maestro can invoke it consistently

## 4.3. Prompt Hardening

Status:

- done

Goal:

- make sure the source-of-truth prompt fully matches the fixed operating model

Required work:

- verify the two-mode model: `discuss`, `continue`
- verify owner intents are expressed clearly
- remove any remaining ambiguity around sequential launch
- verify compound-intent mappings stay aligned with the CLI

Acceptance:

- prompt, templates, and docs agree

## 4.4. Brief Structure Finalization

Status:

- done

Goal:

- finalize the canonical brief shape for durable pre-launch use

Required work:

- keep only durable truth in `brief.md`
- keep ordered feature table
- keep explicit dependencies and launch rules
- remove transient lifecycle narration from real runs and templates

Acceptance:

- new briefs stay valid even after approval, seeding, and execution approval
- the canonical template and working guidance both describe a durable normalized brief
- at least one live run brief has been normalized to the new durable form

## 4.5. Acceptance Suite

Status:

- partial

Goal:

- prove Maestro works through repeated live scenarios

Required live scenarios:

1. create a new discuss run
2. continue an existing discussion run
3. optional `Grant review`
4. approve brief
5. seed multiple ordered features
6. verify ordered `features[]`
7. approve execution
8. start first feature only
9. verify later features remain idle
10. start next feature only when allowed
11. combined `continue` request with multiple explicit owner intents stops at the last requested boundary without silently continuing beyond it

Acceptance:

- all scenarios behave consistently with the plan
- the suite is written down as a canonical working-set document

---

## 5. Open Design Decisions To Discuss Before Implementation

These are the points worth discussing before coding the next phase.

## 5.1. Should `approve brief` remain only a compound prompt intent or become a dedicated CLI command later?

Recommendation:

- keep it as a compound prompt intent for now
- consider a dedicated CLI command later if the three-step mapping keeps causing drift

## 5.2. Should `approve execution` remain separate from `start first feature`?

Recommendation:

- yes
- keep them separate for now

Reason:

- this keeps permission and launch distinct
- it reduces hidden automation
- it gives better control and easier debugging

## 5.3. Should `start next feature` remain explicit?

Recommendation:

- yes in the current cut

Reason:

- execution is still being stabilized
- explicit next-start commands make sequential orchestration easier to reason about

---

## 6. Phase End State

This phase is complete when:

- Maestro has a clean two-mode model
- `Grant` is fully specified
- brief approval is owner-facing and unambiguous
- features are seeded in deterministic order
- execution approval is separate from execution start
- first and next feature starts are deterministic
- live acceptance runs prove the behavior

At that point, Maestro is reference-ready up to orchestration launch and sequential feature start.
