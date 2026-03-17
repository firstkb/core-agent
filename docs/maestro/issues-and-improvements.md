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
