---
doc_status: proposal
doc_scope: future
---

# Adding Stage Agents To Maestro

Status: Proposal document. It describes a future-state extension pattern and is not yet part of the current binding architecture.

## Goal

This guide explains how to extend the current loop beyond `research` without rebuilding the orchestration model each time.

Current real loop:

`seed_features -> research -> Maestro review gate`

The extension strategy is:

`Maestro dispatch -> stage agent work -> Maestro review gate`

That same shape should be reused for `design`, `planning`, `implementation`, and later stages.

## Non-Negotiable Design Rules

- Downstream agents own only their own stage directory.
- `Maestro` owns module-root and feature-root orchestration state.
- A downstream stage may recommend the next agent, but it must not silently dispatch the next stage itself.
- Every stage completion returns through a Maestro review gate.
- The module validator must understand the new stage before the stage is considered production-ready.

## Current Extension Points

### 1. Stage Agent Package

Add the stage package in the shared layer first:

- `.agent-code/contracts/<stage>/`
- `.agent-code/templates/<stage>/`
- `.agent-code/prompts/agents/<stage>.md`
- `.agent-code/registry/agents.json`
- `.agent-code/render/`

Then generate the runtime adapters that the stage needs:

- `.cursor/agents/<stage>.md`
- `.codex/agents/<stage>.toml`
- `.agents/skills/<nickname>/SKILL.md` when the stage also has a human-facing skill

If the stage needs machine validation like `research`, give it a dedicated CLI target or validator path.

### 1a. Stage Dispatch Contract

Every stage must define a small dispatch contract that `Maestro` can use without rereading the full stage package during ordinary launch.

At minimum, define:

- stage name
- native role/profile name
- artifact directory
- minimal normalized inputs
- fallback behavior when native downstream dispatch is unavailable

Current example:

- stage: `research`
- role/profile: `research_codebase`
- artifact directory: `artifacts/{module}/{feature}/research/`

That lets `Maestro` dispatch the stage with a bounded handoff instead of loading the full downstream package into its own context.

### 2. Feature-Root Stage Directory

The stage writes only inside:

- `artifacts/{module}/{feature}/{stage}/`

For example:

- `artifacts/{module}/{feature}/design/`
- `artifacts/{module}/{feature}/planning/`

### 3. Maestro Validator Registry

Extend:

- `.agent-cli/src/module-validation.mjs`

Specifically, update `STAGE_VALIDATORS` so the module validator knows how to validate the current stage artifacts.

Current example:

```js
const STAGE_VALIDATORS = {
  research: { target: "research_codebase" }
};
```

When `design` gets a validator, add it there.

### 4. Maestro Source-Of-Truth Docs

Keep these files aligned:

- `.agents/skills/maestro/SKILL.md`
- `.agent-code/prompts/skills/maestro.md`
- `.agent-code/prompts/agents/module_orchestrator.md`
- `.codex/agents/module_orchestrator.toml`
- `.codex/agents/research_codebase.toml`
- `docs/maestro/README.md`
- `docs/maestro/status-model.md`

## Expected Lifecycle For A New Stage

Using `design` as the example:

1. Research completes.
2. Feature moves to `status = awaiting_review`, `current_stage = research`, `next_stage = design`, `gate = awaiting_maestro_review`.
3. Module moves to `status = awaiting_stage_review`.
4. Owner and/or Maestro accepts Research.
5. Feature moves to `status = queued`, `current_stage = research`, `next_stage = design`, `gate = awaiting_owner_approval` or `approved_for_dispatch`.
6. Owner explicitly approves dispatch for the next stage.
7. `Maestro` dispatches `design`.
8. Feature moves to `status = active`, `current_stage = design`, `next_stage = planning`, `gate = in_progress`.
9. `design` completes.
10. Feature returns to `awaiting_review` again.

That pattern should stay identical for later stages.

## Minimal Implementation Checklist

Before a new stage is considered ready:

1. Create the stage agent package and templates.
2. Decide the stage artifact pair and status schema.
3. Make the stage write only inside its own stage directory.
4. Extend the Maestro validator so it can validate that stage.
5. Document the expected `current_stage`, `next_stage`, and `gate` transitions.
6. Add tests for:
   - a valid stage-in-progress fixture
   - a valid stage-awaiting-review fixture
   - at least one broken fixture

## What Not To Do

- Do not add stage-specific booleans like `approved_for_design`, `approved_for_planning`, `approved_for_implementation`.
- Do not let feature seeding imply downstream approval.
- Do not skip the review gate and auto-chain stages.
- Do not make the module validator depend on undocumented heuristics.

## Current Recommendation

Keep the next extension small:

- implement the review/accept/re-dispatch path around `research`
- then add `design`
- only after that add `planning`

That keeps the control-plane stable while the agent set grows.
