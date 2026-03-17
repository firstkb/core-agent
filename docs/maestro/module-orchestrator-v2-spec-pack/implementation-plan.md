---
doc_status: proposal
doc_scope: future
doc_type: implementation_plan
canonical_for: module_orchestrator_v2_implementation
---

# Module Orchestrator V2 Phased Implementation Plan

Status: Implementation proposal. This document is the execution plan for building `module_orchestrator` V2 as a parallel control-plane track without patching the current Maestro stack in place.

This plan is intentionally designed so that:

- any model can take one phase and execute it;
- each phase has explicit status and acceptance gates;
- V2 can be proven on a bounded pilot before it replaces anything canonical;
- `.agent-cli v2` stays a reasonable state gateway and does not become an overbuilt orchestration platform too early.

---

## 1. Purpose

Build `module_orchestrator` V2 in phases.

Do not treat this as an incremental clean-up of the current Maestro package.
Treat it as a new control-plane model with:

- one lifecycle owner per module;
- CLI as the only mutable JSON writer;
- frozen-by-default Markdown artifacts;
- append-only attempts;
- unified stage handoff and review boundaries.

The plan is optimized for:

- correctness before convenience;
- one bounded pilot before broad rollout;
- additive implementation next to the current stack;
- explicit proofs instead of “looks good on paper”.

---

## 2. Evidence Base

This phased plan is justified by the current repository state.

### 2.1. The current CLI is validator-first, not state-first

Current repo evidence:

- `.agent-cli/package.json`
- `.agent-cli/bin/agent-stack.mjs`
- `.agent-cli/src/commands/`

Today the CLI is built around:

- `validate-input`
- `resolve-paths`
- `validate-artifacts`
- `validate-module`
- `render-runtimes`

That is a good baseline, but it is not yet a lifecycle state gateway.

### 2.2. The V2 spec is already richer than the first safe implementation

Current repo evidence:

- `docs/maestro/module-orchestrator-control-plane-v2-revised.md`
- `docs/maestro/module-orchestrator-v2-spec-pack/state-machine.md`
- `docs/maestro/module-orchestrator-v2-spec-pack/cli-command-spec.md`
- `docs/maestro/module-orchestrator-v2-spec-pack/json-schemas/*.json`

The spec bundle is strong enough to guide implementation, but its full surface is broader than what should be built in the first cut.

### 2.3. The main implementation risk is not architecture quality, but first-cut scope

The plan therefore assumes:

- keep the target model broad enough to be durable;
- keep the first executable cut narrow enough to prove on a real case;
- add edges only after the happy path is stable.

### 2.4. Review-backed constraints already established

These constraints are treated as implementation requirements, not optional nice-to-haves:

- `feature status` needs `active_attempt_ref`
- module pause/block state needs one structured context object
- `feature set-next-stage` must not double as `feature unblock`
- `feature seed` should remain a `brief_frozen` operation in the first cut
- CLI must not generate narrative content
- `open_questions` should not be a first-cut machine-state surface
- if `block` and `escalate_to_owner` are supported, recovery commands must exist too

---

## 3. Phase Status Model

Every phase in this plan must carry one of these statuses.

| Status | Meaning |
|---|---|
| `PLANNED` | Phase is defined but not ready to begin. |
| `READY` | Inputs are sufficient; implementation may begin. |
| `IN_PROGRESS` | Work is actively underway. |
| `BLOCKED` | Phase cannot proceed without a decision or dependency. |
| `DONE` | Deliverables and acceptance gates are satisfied. |

Status transition rules:

- a phase may move from `PLANNED` to `READY` only when its inputs are present;
- a phase may move from `READY` to `IN_PROGRESS` only when the previous required phase is `DONE`;
- a phase may move to `BLOCKED` from any non-terminal status;
- a phase may move to `DONE` only when all acceptance gates are met.

---

## 4. Phase Board

| Phase | Title | Status | Primary outcome |
|---|---|---|---|
| `Phase 0` | Spec Alignment | `READY` | V2 spec pack is internally consistent and implementation-safe. |
| `Phase 1` | Minimal CLI Kernel | `PLANNED` | `.agent-cli v2` can drive one happy-path lifecycle loop. |
| `Phase 2` | Bounded Pilot | `PLANNED` | One real module run proves the V2 loop end-to-end. |
| `Phase 3` | Recovery Paths | `PLANNED` | Block, owner escalation, and recovery become legal lifecycle paths. |
| `Phase 4` | Revisioning And Amendments | `PLANNED` | Brief and packet amendments become explicit and versioned. |
| `Phase 5` | Prompt / Runtime Integration And Rollout | `PLANNED` | V2 gets model-facing prompts, templates, and controlled runtime adoption. |

---

## 5. Global Constraints

These constraints apply to every phase.

### 5.1. Do not mutate the current canonical Maestro contract in place

The current canonical stack remains the operational baseline until V2 is proven.

### 5.2. V2 must be additive first

The first V2 implementation should coexist with the current CLI and current docs.
Do not do a big-bang replacement.

### 5.3. CLI remains a state gateway

CLI may:

- validate transitions
- write JSON state
- allocate ids
- create skeleton files

CLI must not:

- write semantic narrative prose
- replace owner approval
- decide decomposition quality
- silently chain lifecycle transitions

### 5.4. First pilot is intentionally narrow

The first executable loop should prove only:

`discussion -> brief approval -> brief freeze -> feature seed -> execution approval -> stage start -> handoff -> review`

### 5.5. Do not add new JSON contract families in the first cut

The first cut must stay within these four:

- module status
- feature status
- stage handoff
- stage review

---

## 6. Phase 0: Spec Alignment

**Status:** `READY`

### 6.1. Goal

Make the V2 spec pack internally consistent before any implementation begins.

This phase is complete only when:

- the revised proposal
- the state machine
- the CLI spec
- the JSON schemas

all describe the same first-cut system.

### 6.2. Entry Criteria

- `docs/maestro/module-orchestrator-control-plane-v2-revised.md` exists
- `docs/maestro/module-orchestrator-v2-spec-pack/` exists
- no code implementation has started yet for `.agent-cli v2`

### 6.3. Files In Scope

- `docs/maestro/module-orchestrator-control-plane-v2-revised.md`
- `docs/maestro/module-orchestrator-v2-spec-pack/README.md`
- `docs/maestro/module-orchestrator-v2-spec-pack/state-machine.md`
- `docs/maestro/module-orchestrator-v2-spec-pack/cli-command-spec.md`
- `docs/maestro/module-orchestrator-v2-spec-pack/json-schemas/module-status.schema.json`
- `docs/maestro/module-orchestrator-v2-spec-pack/json-schemas/feature-status.schema.json`
- `docs/maestro/module-orchestrator-v2-spec-pack/json-schemas/stage-handoff.schema.json`
- `docs/maestro/module-orchestrator-v2-spec-pack/json-schemas/stage-review.schema.json`

### 6.4. Required Changes

1. Add `active_attempt_ref` to feature state.

Required outcome:

- `phase = stage_in_progress` implies `active_attempt_ref != null`
- `phase = awaiting_stage_review` implies `active_attempt_ref = null`

2. Replace scattered module pause semantics with one structured object.

Recommended shape:

```json
"attention_required": {
  "kind": "owner_decision" | "module_blocked" | null,
  "reason_code": "owner_decision_required" | "dependency_missing" | null,
  "message": "human-readable explanation",
  "source_feature_id": "restore-executable-npm-test",
  "source_stage": "research",
  "source_attempt_ref": "artifacts/.../attempt-001/handoff.json",
  "source_review_ref": "artifacts/.../attempt-001/review.json"
}
```

3. Remove `open_questions` from first-cut machine state.

First-cut policy:

- unresolved questions live in `brief.md`
- `status.json` should not manage question lists yet

4. Synchronize seeding policy.

First-cut rule:

- `feature seed` is allowed only while module phase is `brief_frozen`

5. Remove `feature set-next-stage` from `blocked`.

First-cut rule:

- blocked recovery must be a distinct lifecycle path

6. Remove narrative generation from CLI behavior.

First-cut rule:

- CLI may scaffold `report.md`
- CLI may copy a supplied report
- CLI may not synthesize narrative content from JSON summary fields

7. Narrow the first pilot’s legal review decisions.

First-cut rule:

- `stage review` supports only `accept` and `revise`
- `block` and `escalate_to_owner` move to `Phase 3`

### 6.5. Out Of Scope

- any `.agent-cli` code implementation
- prompt rewrites
- runtime adapter changes
- new stage agents

### 6.6. Deliverables

- updated V2 revised proposal
- updated state machine
- updated CLI spec
- updated four JSON schemas
- updated examples inside schemas/specs

### 6.7. Acceptance Evidence

This phase is `DONE` only when:

- all four JSON schemas can be read as a coherent first-cut control plane
- no state machine transition contradicts the CLI spec
- no CLI command references a field absent from the schemas
- no schema permits a state forbidden by the state machine
- first-cut pilot scope is explicitly limited to `accept|revise`

### 6.8. Handoff Prompt For A Model

Use this prompt when assigning `Phase 0` to a model:

```text
Implement Phase 0 of Module Orchestrator V2.

Goal:
- align the V2 proposal, state machine, CLI spec, and four JSON schemas
- do not implement code
- do not patch the current canonical Maestro docs

Files in scope:
- docs/maestro/module-orchestrator-control-plane-v2-revised.md
- docs/maestro/module-orchestrator-v2-spec-pack/state-machine.md
- docs/maestro/module-orchestrator-v2-spec-pack/cli-command-spec.md
- docs/maestro/module-orchestrator-v2-spec-pack/json-schemas/*.json

Required outcomes:
- add active_attempt_ref
- add a structured module attention_required object
- remove open_questions from first cut
- restrict feature seed to brief_frozen
- forbid feature set-next-stage from blocked
- remove CLI narrative generation
- limit first pilot stage review to accept|revise

Do not implement CLI code.
Do not add new JSON contract families.
Return only after the spec pack is internally consistent.
```

### 6.9. Example Post-Phase-0 Feature Status

```json
{
  "schema_version": 1,
  "module_id": "avatar-service-test-execution-v2-pilot",
  "feature_id": "restore-executable-npm-test",
  "phase": "stage_in_progress",
  "current_stage": "research",
  "next_recommended_stage": null,
  "packet": {
    "working_path": "artifacts/avatar-service-test-execution-v2-pilot/features/restore-executable-npm-test/packet.md",
    "active_revision": "artifacts/avatar-service-test-execution-v2-pilot/features/restore-executable-npm-test/revisions/packet.v1.md",
    "frozen": true
  },
  "active_attempt_ref": "artifacts/avatar-service-test-execution-v2-pilot/features/restore-executable-npm-test/stages/research/attempts/attempt-001",
  "latest_submitted_handoff_ref": null,
  "latest_accepted_review_ref": null,
  "blocked_reason": null,
  "updated_at": "2026-03-17T00:00:00Z"
}
```

---

## 7. Phase 1: Minimal CLI Kernel

**Status:** `PLANNED`

### 7.1. Goal

Implement the smallest useful `.agent-cli v2` kernel that can execute one bounded happy-path lifecycle loop.

This is not the phase for:

- full recovery
- full amendment support
- rich helper workflows
- replacing the current validator commands

### 7.2. Entry Criteria

- `Phase 0` is `DONE`
- V2 first-cut state machine is frozen for implementation

### 7.3. Implementation Strategy

Keep the current CLI intact and add V2 behavior next to it.

Recommended rule:

- legacy commands stay supported exactly as they are;
- V2 enters as additive command scopes.

### 7.4. Recommended CLI Surface For First Cut

Implement only these commands:

- `module init`
- `module submit-for-brief-approval`
- `module record-owner-approval`
- `module freeze-brief`
- `feature seed`
- `feature set-next-stage`
- `module prepare-execution`
- `stage start`
- `stage submit-handoff`
- `stage review`

First-cut `stage review` legal decisions:

- `accept`
- `revise`

### 7.5. Files In Scope

Recommended code layout:

```text
.agent-cli/bin/agent-stack.mjs
.agent-cli/src/commands/module.mjs
.agent-cli/src/commands/feature.mjs
.agent-cli/src/commands/stage.mjs
.agent-cli/src/v2/lib/read-state.mjs
.agent-cli/src/v2/lib/write-state.mjs
.agent-cli/src/v2/lib/ids.mjs
.agent-cli/src/v2/lib/guards.mjs
.agent-cli/src/v2/lib/scaffold.mjs
.agent-cli/src/v2/lib/output.mjs
.agent-cli/src/v2/schemas/module-status.schema.json
.agent-cli/src/v2/schemas/feature-status.schema.json
.agent-cli/src/v2/schemas/stage-handoff.schema.json
.agent-cli/src/v2/schemas/stage-review.schema.json
.agent-cli/test/v2/module-lifecycle.test.mjs
.agent-cli/test/v2/stage-lifecycle.test.mjs
.agent-cli/test/v2/fixtures/
```

The exact file names may vary, but the implementation must preserve these separations:

- command handlers
- guard logic
- id allocation
- filesystem scaffolding
- JSON write helpers
- schema validation

### 7.6. Concrete Implementation Steps

1. Extend CLI entrypoint parsing.

Required result:

- existing single-word commands still work
- V2 supports `module`, `feature`, and `stage` scopes with subcommands

2. Add a V2 state read/write layer.

Required result:

- JSON writes happen through one helper path
- all writes stamp `updated_at`
- write-boundary validation is enforced

3. Add id allocation helpers.

Required result:

- `attempt-001`, `attempt-002`, ...
- no collisions
- append-only behavior guaranteed

4. Add filesystem scaffolding helpers.

Required result:

- create `brief.md`, `status.json`, `packet.md`
- create attempt directories
- create canonical artifact paths consistently

5. Implement the 10 first-cut commands.

6. Add tests for the happy path.

At minimum:

- module init
- brief approval + freeze
- feature seed + set-next-stage
- prepare execution
- stage start
- stage submit-handoff
- stage review `accept`
- stage review `revise`

### 7.7. Out Of Scope

- `module question add`
- `module question resolve`
- `module request-brief-review`
- `module record-brief-review`
- `module block`
- `module reopen`
- `module resolve-owner-decision`
- `module cancel`
- `feature unblock`
- amendment / revision rollover beyond `v1`

### 7.8. Deliverables

- additive V2 CLI parsing
- V2 state store helpers
- schema-backed write-boundary validation
- 10 first-cut commands
- tests and fixtures for the happy path

### 7.9. Acceptance Evidence

This phase is `DONE` only when:

- all legacy CLI commands still pass
- the 10 first-cut V2 commands work end-to-end
- no V2 command requires manual JSON editing
- `stage review --decision accept` and `--decision revise` work
- every state mutation is validated at write time
- the test suite includes at least one full happy-path fixture

### 7.10. Handoff Prompt For A Model

Use this prompt when assigning `Phase 1` to a model:

```text
Implement Phase 1 of Module Orchestrator V2.

Goal:
- build the minimal .agent-cli v2 kernel
- keep the current CLI working
- implement only the first-cut happy-path commands

Commands in scope:
- module init
- module submit-for-brief-approval
- module record-owner-approval
- module freeze-brief
- feature seed
- feature set-next-stage
- module prepare-execution
- stage start
- stage submit-handoff
- stage review (accept|revise only)

Constraints:
- no direct JSON patching
- no repository-wide validation on every mutation
- no block/escalate_to_owner flow yet
- no question-management commands
- no narrative generation by CLI

Required outputs:
- additive code in .agent-cli
- tests for the happy path
- fixture data for one bounded loop
```

### 7.11. Example Command Sequence

```text
agent-stack module init --module avatar-service-test-execution-v2-pilot --owner owner
agent-stack module submit-for-brief-approval --module avatar-service-test-execution-v2-pilot
agent-stack module record-owner-approval --module avatar-service-test-execution-v2-pilot --approval brief
agent-stack module freeze-brief --module avatar-service-test-execution-v2-pilot
agent-stack feature seed --module avatar-service-test-execution-v2-pilot --feature restore-executable-npm-test
agent-stack feature set-next-stage --module avatar-service-test-execution-v2-pilot --feature restore-executable-npm-test --stage research
agent-stack module prepare-execution --module avatar-service-test-execution-v2-pilot
agent-stack module record-owner-approval --module avatar-service-test-execution-v2-pilot --approval execution
agent-stack stage start --module avatar-service-test-execution-v2-pilot --feature restore-executable-npm-test --stage research --agent research_codebase
agent-stack stage submit-handoff --module avatar-service-test-execution-v2-pilot --feature restore-executable-npm-test --stage research --from handoff.json
agent-stack stage review --module avatar-service-test-execution-v2-pilot --feature restore-executable-npm-test --stage research --attempt attempt-001 --decision accept --next-stage implementation
```

### 7.12. Example Module Status After `module init`

```json
{
  "schema_version": 1,
  "module_id": "avatar-service-test-execution-v2-pilot",
  "phase": "discussion",
  "brief": {
    "working_path": "artifacts/avatar-service-test-execution-v2-pilot/brief.md",
    "active_revision": null,
    "frozen": false
  },
  "owner_approvals": {
    "brief": false,
    "execution": false
  },
  "brief_review": {
    "status": "not_requested",
    "recommendation": null,
    "reviewed_revision": null
  },
  "features": [],
  "current_action": "awaiting_owner_input",
  "attention_required": {
    "kind": null,
    "reason_code": null,
    "message": null,
    "source_feature_id": null,
    "source_stage": null,
    "source_attempt_ref": null,
    "source_review_ref": null
  },
  "updated_at": "2026-03-17T00:00:00Z"
}
```

### 7.13. Example Stage Handoff Input

```json
{
  "schema_version": 1,
  "module_id": "avatar-service-test-execution-v2-pilot",
  "feature_id": "restore-executable-npm-test",
  "stage": "research",
  "attempt_id": "attempt-001",
  "agent_id": "research_codebase",
  "result": "ready_for_review",
  "summary": "The test failure is caused by .js import targets resolving into a TypeScript-only src tree.",
  "evidence_refs": [
    "platform/packages/research-avatar-service/package.json",
    "platform/packages/research-avatar-service/test/avatar_service.test.js"
  ],
  "produced_artifact_refs": [],
  "change_requests": [],
  "recommended_next_stage": "implementation",
  "created_at": "2026-03-17T00:00:00Z"
}
```

---

## 8. Phase 2: Bounded Pilot

**Status:** `PLANNED`

### 8.1. Goal

Prove the V2 control plane on one real bounded scenario before adding recovery edges or broad prompt integration.

### 8.2. Recommended Pilot Scenario

Use:

- module id: `avatar-service-test-execution-v2-pilot`
- feature id: `restore-executable-npm-test`
- stage: `research`

This keeps the pilot grounded in a real repository target while staying small.

### 8.3. Entry Criteria

- `Phase 1` is `DONE`
- first-cut CLI commands exist
- first-cut fixtures and tests pass

### 8.4. Pilot Strategy

The first pilot should prove the control plane before proving full model/runtime integration.

Recommended approach:

1. run the lifecycle with real CLI commands;
2. use a curated or manually prepared `handoff.json` for the first pass if needed;
3. prove artifact layout and state transitions;
4. only after that run a live stage agent against the same loop.

### 8.5. Files In Scope

- `.agent-cli/test/v2/fixtures/`
- `artifacts/avatar-service-test-execution-v2-pilot/`
- optional pilot notes under `docs/maestro/module-orchestrator-v2-spec-pack/`

### 8.6. Deliverables

- one bounded pilot module under `artifacts/`
- one full command transcript or reproducible command list
- final module status
- final feature status
- one submitted handoff
- one review

### 8.7. Acceptance Evidence

This phase is `DONE` only when:

- no manual JSON edits were needed
- all pilot JSON files were CLI-written
- all artifact paths are canonical
- feature attempt directory is append-only
- review binds to the exact handoff attempt
- final state is readable and non-contradictory

### 8.8. Handoff Prompt For A Model

```text
Run Phase 2 of Module Orchestrator V2.

Goal:
- prove the bounded pilot loop end-to-end
- do not add new commands
- do not broaden scope beyond one module, one feature, one research attempt

Pilot identifiers:
- module: avatar-service-test-execution-v2-pilot
- feature: restore-executable-npm-test
- stage: research

Use the implemented V2 CLI only.
Do not edit JSON by hand.
If a stage agent is not yet integrated, use a curated handoff.json fixture.

Return:
- exact command list used
- final artifact paths
- final module and feature phases
- any gaps discovered in the control plane
```

### 8.9. Example `brief.md` Template For The Pilot

```md
# Module Brief

## Goal
Restore executable `npm test` for `platform/packages/research-avatar-service`.

## Scope
- Package-local only.
- Focus on the bounded test-execution failure.

## Non-Goals
- Cross-package tooling changes.
- Broader feature work outside test execution recovery.

## Constraints
- Keep the run isolated as a V2 pilot.
- Do not implement product code during the control-plane pilot.

## Acceptance Signals
- A research attempt can be started, submitted, and reviewed through CLI only.
- The resulting artifacts are coherent and append-only.

## Open Questions
- Which implementation path should follow research acceptance?

## Proposed Feature Decomposition
- `restore-executable-npm-test`
```

### 8.10. Example `packet.md` Template

```md
# Feature Packet

## Identity
- Module: avatar-service-test-execution-v2-pilot
- Feature: restore-executable-npm-test

## Mission
Determine the smallest package-local change set required to restore executable `npm test`.

## Scope In
- `platform/packages/research-avatar-service`
- test entrypoint
- source/import resolution mismatch

## Scope Out
- unrelated package changes
- broad tooling migration

## Expected Handoff
- one `handoff.json`
- one `report.md`
- bounded recommendation for next stage
```

---

## 9. Phase 3: Recovery Paths

**Status:** `PLANNED`

### 9.1. Goal

Add the first non-happy-path lifecycle transitions only after the bounded pilot is proven.

### 9.2. Entry Criteria

- `Phase 2` is `DONE`
- at least one pilot run completed without manual JSON edits

### 9.3. Commands In Scope

- `stage review --decision block`
- `stage review --decision escalate_to_owner`
- `feature unblock`
- `module resolve-owner-decision`
- optionally `module cancel`

### 9.4. Required State Additions

If not already present from `Phase 0`, finalize:

- module `attention_required`
- feature `blocked_reason`

### 9.5. Deliverables

- recovery-capable CLI surface
- tests for blocked and owner-decision flows
- fixtures for at least:
  - block -> unblock -> retry
  - escalate_to_owner -> resolve-owner-decision -> resume

### 9.6. Acceptance Evidence

This phase is `DONE` only when:

- blocked features can recover without manual file edits
- owner-decision gates preserve source feature/stage/attempt context
- retries allocate new attempt ids
- previous attempt directories remain intact

### 9.7. Handoff Prompt For A Model

```text
Implement Phase 3 of Module Orchestrator V2.

Goal:
- add recovery paths after the bounded happy path has already been proven

Commands in scope:
- stage review (block, escalate_to_owner)
- feature unblock
- module resolve-owner-decision

Constraints:
- retries are append-only
- no manual JSON edits
- preserve all prior attempt artifacts
- do not add amendment/versioning flows yet
```

### 9.8. Example `stage review` Escalation

```json
{
  "schema_version": 1,
  "module_id": "avatar-service-test-execution-v2-pilot",
  "feature_id": "restore-executable-npm-test",
  "reviewed_stage": "research",
  "attempt_id": "attempt-001",
  "reviewed_handoff_ref": "artifacts/avatar-service-test-execution-v2-pilot/features/restore-executable-npm-test/stages/research/attempts/attempt-001/handoff.json",
  "decision": "escalate_to_owner",
  "reason": "Research identified two viable implementation paths and owner policy is required.",
  "requires_owner_input": true,
  "next_stage": null,
  "reviewed_at": "2026-03-17T00:00:00Z"
}
```

---

## 10. Phase 4: Revisioning And Amendments

**Status:** `PLANNED`

### 10.1. Goal

Make frozen artifacts explicitly amendable through versioned revisions rather than silent edits.

### 10.2. Entry Criteria

- `Phase 3` is `DONE`
- at least one real amendment use case exists

### 10.3. Scope

Add explicit support for:

- `brief.v2.md`
- `packet.v2.md`
- active revision pointer updates
- addendum path if needed

### 10.4. Deliverables

- revision allocation rules
- amendment commands or controlled workflows
- tests for amendment without history loss

### 10.5. Acceptance Evidence

This phase is `DONE` only when:

- no frozen brief or packet is silently edited
- active revision pointers update correctly
- older revisions remain intact and readable

### 10.6. Handoff Prompt For A Model

```text
Implement Phase 4 of Module Orchestrator V2.

Goal:
- add explicit amendment/versioning for frozen brief and packet artifacts

Constraints:
- preserve append-only history
- do not break the already proven happy path
- do not reintroduce mutable narrative drift
```

---

## 11. Phase 5: Prompt / Runtime Integration And Controlled Rollout

**Status:** `PLANNED`

### 11.1. Goal

Wire V2 into model-facing prompts, templates, and runtime adapters only after the control plane is already proven.

### 11.2. Entry Criteria

- `Phase 2` is `DONE`
- ideally `Phase 3` is also `DONE` if non-happy-path rollout is desired

### 11.3. Strategy

Do this in parallel.

Do not overwrite the current canonical `module_orchestrator` package immediately.

Recommended direction:

- create a V2-specific source-of-truth namespace under `.agent-code/`
- keep V1 and V2 side by side until one bounded V2 run is accepted

Suggested V2 source layout:

```text
.agent-code/v2/contracts/
.agent-code/v2/templates/
.agent-code/v2/prompts/
.agent-code/v2/render/
```

### 11.4. Deliverables

- V2 prompt package for `module_orchestrator`
- V2 templates for `brief.md`, `packet.md`, `report.md`, `review.md`
- V2 runtime wrappers/adapters
- one live model-driven V2 run

### 11.5. Acceptance Evidence

This phase is `DONE` only when:

- a model can execute the bounded V2 pilot from prompts and CLI alone
- no manual JSON surgery is needed
- the current canonical stack remains usable and unaffected
- rollout decision can be made from evidence, not speculation

### 11.6. Handoff Prompt For A Model

```text
Implement Phase 5 of Module Orchestrator V2.

Goal:
- wire the already proven V2 control plane into prompts, templates, and runtime adapters
- do not replace the current canonical Maestro runtime yet

Requirements:
- use the V2 state machine and V2 CLI contracts as the source of truth
- keep V1 and V2 parallel
- prove one live bounded run through model prompts plus CLI
```

---

## 12. Minimal Prompt Templates For Handoffs

These prompts are intentionally short so another model can pick up a phase without re-reading the whole history.

### 12.1. Spec Editor Prompt

```text
Work only on the V2 spec pack.
Do not implement code.
Make the revised proposal, state machine, CLI spec, and four JSON schemas internally consistent.
```

### 12.2. CLI Kernel Implementer Prompt

```text
Build the additive .agent-cli v2 kernel for the first happy-path loop only.
Keep legacy commands working.
Do not implement recovery or amendment flows yet.
```

### 12.3. Pilot Operator Prompt

```text
Run the bounded V2 pilot with one module, one feature, and one research attempt.
Use CLI-written JSON only.
Return the exact command list and final states.
```

### 12.4. Prompt Integration Prompt

```text
Add V2 prompts and templates in parallel with the current stack.
Do not replace the canonical Maestro runtime until the V2 pilot is accepted.
```

---

## 13. Phase Completion Checklist

Every phase handoff should report:

- phase id
- phase status before work
- phase status after work
- files changed
- deliverables completed
- acceptance gates passed
- blockers or follow-up risks

Recommended report shape:

```json
{
  "phase_id": "phase-1",
  "phase_title": "Minimal CLI Kernel",
  "status_before": "READY",
  "status_after": "DONE",
  "files_changed": [
    ".agent-cli/bin/agent-stack.mjs",
    ".agent-cli/src/commands/module.mjs",
    ".agent-cli/test/v2/module-lifecycle.test.mjs"
  ],
  "deliverables_completed": [
    "CLI subcommand parsing",
    "10 first-cut commands",
    "happy-path tests"
  ],
  "acceptance_gates_passed": [
    "legacy CLI unchanged",
    "write-boundary validation enforced",
    "happy-path fixture passes"
  ],
  "blockers": [],
  "risks": [
    "owner-decision recovery path still deferred to phase 3"
  ]
}
```

---

## 14. Recommendation

The safest and highest-leverage implementation sequence is:

1. align the spec;
2. build only the minimal kernel;
3. prove one bounded loop;
4. add recovery;
5. add revisioning;
6. integrate prompts and runtime.

Do not invert this order.

V2 will become a good control plane only if it is proven as a narrow system before it is expanded into a broad one.
