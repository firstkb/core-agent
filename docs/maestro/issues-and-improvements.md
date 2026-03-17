---
doc_status: notes
doc_scope: backlog
---

# Maestro Issues And Improvements

Status: Notes/backlog document. It captures open issues and ideas; it is not a binding contract.

Use this file to capture candidate improvements, design questions, and known orchestration problems before they are promoted into implementation work.

## Entry Template

- `id`: short stable identifier, for example `MSTR-001`
- `date`: YYYY-MM-DD
- `area`: orchestration area or stage boundary
- `type`: `issue` | `improvement` | `question`
- `status`: `open` | `under_review` | `accepted` | `rejected` | `implemented`
- `summary`: one-sentence label
- `problem`: concrete failure mode or gap
- `proposal`: suggested direction or experiment
- `notes`: optional links, examples, or constraints

## Backlog

### MSTR-001

- `date`: `2026-03-15`
- `area`: `research -> maestro feedback`
- `type`: `improvement`
- `status`: `open`
- `summary`: Design a feedback loop from `research` back into `Maestro` before the next stage starts.
- `problem`: After `Charlie` finishes `research`, open questions can still remain in `artifacts/<module>/<feature>/research/README.md` and `status.json`. Today the orchestration model can continue toward the next downstream stage without forcing `Maestro` to re-evaluate those unresolved questions.
- `proposal`: Add a module-level review gate where `Maestro` reads downstream `research/status.json`, distinguishes blocking vs non-blocking open questions, and moves the module or feature into an explicit review state such as `awaiting_owner_review`, `awaiting_design_decisions`, or `ready_for_design` instead of launching the next stage blindly.
- `notes`: Keep this separate from `seed_features` and `launch_orchestration`; the gap appears after downstream execution begins, not during module briefing.

### MSTR-002

- `date`: `2026-03-17`
- `area`: `codex launch_orchestration`
- `type`: `improvement`
- `status`: `open`
- `summary`: Make Codex wait-first on downstream research instead of validating the launch transition too early.
- `problem`: In Codex, `Maestro` currently tends to spawn `research_codebase`, immediately write the in-progress launch transition, run `validate-module`, observe that downstream research artifacts do not exist yet, and then perform an extra wait/reconcile/revalidate loop. This produces visible noise and makes the launch flow look less disciplined than Cursor even when the final state is correct.
- `proposal`: Treat `launch_orchestration` as a two-phase flow in Codex: (1) prepare bounded handoff and spawn exactly one `research_codebase` sub-agent, then wait; (2) after research artifacts exist, move the module/feature directly into the review gate and run a single `validate-module`. If an in-progress state must still be persisted for control-plane honesty, skip module validation until the downstream artifact pair exists.
- `notes`: The current behavior is encouraged by the combination of "write the canonical in-progress launch transition immediately" in `.agent-code/prompts/agents/module_orchestrator.md` and "validate after any module-root or feature-root change" in the shared Maestro prompts. Cursor UX appears cleaner because the platform interaction effectively collapses `spawn -> wait -> finalize` into one user-visible block.

### MSTR-003

- `date`: `2026-03-17`
- `area`: `codex state-transition edits`
- `type`: `improvement`
- `status`: `open`
- `summary`: Reduce launch and review-gate churn by limiting Codex state transitions to status-bearing artifacts.
- `problem`: During Codex `launch_orchestration`, `Maestro` often rewrites multiple narrative files (`README.md`, `request.md`, `maestro-brief.md`, `feature-index.md`, `maestro-packet.md`) for what is primarily a machine-state transition. This creates noisy edit logs and makes the run appear busier than Cursor, even when the semantic change is only "research started" or "research completed, waiting for review."
- `proposal`: Define a narrow artifact-touch policy for orchestration state transitions. On launch, update only `artifacts/<module>/status.json` and `artifacts/<module>/<feature>/status.json` unless a human-readable summary materially changes. On downstream completion, update the two status files first, then optionally refresh narrative artifacts only when summary text or open questions actually changed.
- `notes`: This should be documented as a runtime policy, not as a validator-driven requirement. The goal is to preserve control-plane honesty while making the user-visible edit stream smaller and easier to follow.

### MSTR-004

- `date`: `2026-03-17`
- `area`: `codex runtime tuning`
- `type`: `improvement`
- `status`: `open`
- `summary`: Tune Codex Maestro for lower launch verbosity and fewer self-initiated reconciliation steps.
- `problem`: `module_orchestrator` currently runs in Codex with `codex_reasoning_effort = "high"` from `.agent-code/registry/agents.json`. Combined with strict transition and validation instructions, this pushes Codex toward extra intermediate reads, repeated self-checking, and verbose narration compared to Cursor.
- `proposal`: Lower Codex Maestro to `codex_reasoning_effort = "medium"` and add an explicit log-budget policy for `launch_orchestration`: one update before spawn, one short waiting update while the sub-agent runs, and one completion update after the review-gate transition is written. Avoid narrating validator internals or intermediate file-alignment fixes unless validation actually fails.
- `notes`: This is a UX optimization rather than a control-plane change. It should be evaluated against the next side-by-side Cursor/Codex launch run to confirm that the tighter policy reduces noise without hiding real state transitions.

### MSTR-005

- `date`: `2026-03-17`
- `area`: `review-gate state consistency`
- `type`: `issue`
- `status`: `open`
- `summary`: Make the closed review-gate state validator-clean in both Cursor and Codex runs.
- `problem`: The current `v4` side-by-side runs reach `status = awaiting_stage_review`, but the final module state still keeps readiness and/or handoff fields open in ways that violate the canonical closed review-gate invariants. As a result, `validate-module` fails on real run outputs even though the run appears complete to the user.
- `proposal`: Define one canonical post-research finalization step that sets every review-gate field deterministically before completion is reported. Either centralize that transition in shared runtime logic or document an exact field matrix that every runtime must apply after research completion. Treat `validate-module` success on the final review-gate state as mandatory, not advisory.
- `notes`: Observed in both `artifacts/research-avatar-service-test-execution-v4` and `artifacts/research-avatar-service-test-execution-codex-v4`. This should be fixed before adding later downstream stages.

### MSTR-006

- `date`: `2026-03-17`
- `area`: `cross-runtime acceptance`
- `type`: `improvement`
- `status`: `open`
- `summary`: Add end-to-end acceptance coverage for the canonical first loop across Cursor and Codex.
- `problem`: The current automated checks validate contracts, fixtures, and rendered adapters, but they do not guarantee that a real side-by-side run finishes in the same valid terminal state on both runtimes. The result is that infrastructure checks can pass while live run outputs still violate orchestration invariants.
- `proposal`: Introduce a small acceptance suite for the canonical `discuss -> seed_features -> research -> review gate` loop. The acceptance gate should verify that Cursor and Codex both produce: valid module and feature statuses, valid downstream research artifacts, a closed review gate, and the same next-step semantics. Use the current avatar-service bounded run as the initial golden scenario.
- `notes`: This should become the main regression gate before changing prompts, runtime tuning, or validator rules for the first orchestration loop.

### MSTR-007

- `date`: `2026-03-17`
- `area`: `shared dispatch contract`
- `type`: `improvement`
- `status`: `open`
- `summary`: Move downstream dispatch semantics out of platform-specific files and back into the shared source of truth.
- `problem`: The shared Maestro prompts currently rely on `.codex/config.toml` and `.codex/agents/research_codebase.toml` as part of the ordinary dispatch contract for the first research loop. This leaks platform-specific wiring into the shared orchestration model and weakens the claim that `.agent-code/` is the only source of truth.
- `proposal`: Define a small platform-neutral dispatch contract in `.agent-code/` that describes the downstream role, handoff shape, and runtime expectations. Then render Codex- and Cursor-specific bindings from that shared contract instead of teaching shared prompts to cite `.codex/*` directly.
- `notes`: The goal is not to remove runtime-specific configuration, but to keep the orchestration semantics platform-neutral and make `.codex/` and `.cursor/` remain thin adapters only.

### MSTR-008

- `date`: `2026-03-17`
- `area`: `narrative artifact lifecycle`
- `type`: `improvement`
- `status`: `open`
- `summary`: Prevent stale narrative artifacts from contradicting machine state after mode transitions.
- `problem`: Module narrative files such as `request.md`, `maestro-brief.md`, and feature packets can retain wording from earlier phases after seeding, launch, or review-gate transitions. This makes resumes harder and creates contradictions where `status.json` reflects the current phase but companion Markdown still reads like the run is in `discuss` or still awaiting approval.
- `proposal`: Define an explicit lifecycle policy for each narrative artifact. Either keep some files strictly immutable as request capture only, or require a narrow transition update block that is refreshed on phase changes. Add a lightweight consistency check so obvious contradictions between `status.json` and companion Markdown are caught before completion.
- `notes`: This is related to edit-churn reduction, but it is a separate quality issue: even a quiet runtime is still confusing if its companion artifacts are stale.

### MSTR-009

- `date`: `2026-03-17`
- `area`: `scope governance`
- `type`: `improvement`
- `status`: `open`
- `summary`: Freeze stack expansion until the first orchestration loop is stable, minimal, and cross-runtime consistent.
- `problem`: The current architecture is already fairly rich for a project that explicitly does not want heavy agent programming. If more stages, roles, or orchestration machinery are added before the first loop is stable, the stack risks becoming framework-first instead of workflow-first.
- `proposal`: Make "first-loop stability" an explicit governance gate. Do not add new downstream stages or new system agents until the baseline loop is low-noise, validator-clean, adapter-thin, and consistently reproducible on both Cursor and Codex. Track that gate in docs as an intentional constraint, not as an accidental slowdown.
- `notes`: This is a product and architecture discipline item rather than a runtime bug, but it is likely the highest-leverage way to keep the stack aligned with the original goal.
