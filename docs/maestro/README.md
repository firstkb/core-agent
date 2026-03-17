---
doc_status: canonical
doc_scope: current
---

# Maestro Usage Guide

Status: Canonical current-state usage guide.

## Purpose

`Maestro` is the module-level orchestrator for:

- clarifying module scope
- shaping the feature model
- creating the feature root pack
- dispatching the first downstream stage only after owner approval
- pulling control back into a Maestro review gate before any next-stage dispatch

Source of truth, in order:

- `.agents/skills/maestro/SKILL.md`
- `.agent-code/prompts/skills/maestro.md`
- `.agent-code/prompts/agents/module_orchestrator.md`
- `.agent-code/contracts/module_orchestrator/*`
- `.agent-code/templates/module_orchestrator/*`
- `.agent-cli/`

Supporting docs:

- [`status-model.md`](./status-model.md) - canonical
- [`adding-stage-agents.md`](./adding-stage-agents.md) - proposal
- [`issues-and-improvements.md`](./issues-and-improvements.md) - notes

## Operational Boundaries

Ordinary Maestro work should read only:

- the exact target module artifacts under `artifacts/{module}/`
- the exact target feature artifacts under `artifacts/{module}/{feature}/` when seeded
- the shared `module_orchestrator` contract/template package
- `.codex/config.toml` and `.codex/agents/research_codebase.toml` only when preparing native Research dispatch

Ordinary Maestro work should not read:

- `.agent-code/render/`
- `.agent-code/registry/`
- `.agent-code/config.json`
- `.agent-cli/src/`
- `.agent-cli/test/`
- `.cursor/`
- `.agents/skills/`
- artifact folders for other modules unless the owner explicitly asks

Validation commands are enforcement gates. Ordinary Maestro runs should execute `validate-module`, but should not inspect `.agent-cli/src/module-validation.mjs` unless the owner explicitly asks to debug validator behavior.

## Core Rules

- The user may talk to `Maestro` in Russian.
- Persisted artifacts under `artifacts/{module}/` and `artifacts/{module}/{feature}/` must stay in English.
- `Maestro` must not guess owner decisions.
- `Maestro` must not seed features without explicit owner approval.
- `Maestro` must not launch downstream work without explicit owner approval.
- `Maestro` seeds only the feature root pack:
  - `README.md`
  - `status.json`
  - `maestro-packet.md`
- Downstream agents create their own stage directories on first write.
- After any change to module-root or feature-root Maestro artifacts, run:

```bash
node .agent-cli/bin/agent-stack.mjs validate-module module_orchestrator --module "<module>" --write-status
```

- Do not report completion unless that command succeeds.

## Main Flow

Current intended lifecycle:

1. Start `Maestro` in `discuss`.
2. Close briefing and confirm the feature model.
3. Owner approves `seed_features`.
4. `Maestro` creates only the feature root pack.
5. Owner approves `launch_orchestration`.
6. `Maestro` dispatches the first downstream stage.
7. The downstream stage completes.
8. `Maestro` moves the feature and module into a review gate.
9. Only after that review may the next stage be considered.

The first real loop implemented in the model is:

`seed_features -> research -> Maestro review gate`

## Research Dispatch

For the current first loop, `Maestro` should dispatch Research through the native downstream role `research_codebase`.

Use these files as the dispatch contract:

- `.codex/config.toml`
- `.codex/agents/research_codebase.toml`

Normal dispatch should not reread `.agents/skills/charlie/SKILL.md` or `.agent-code/prompts/agents/research_codebase.md` just to restate Charlie's job.
Those files remain the source of truth for Charlie itself, but the orchestration handoff should stay minimal:

- module
- feature
- task or seeded feature objective
- artifact directory and exact artifact paths
- explicit scope limits

If native downstream dispatch is unavailable, inline fallback is still allowed.
When that happens, the downstream artifact pair must record `execution_mode = inline` and `agent_profile = null`, and the fallback should be called out explicitly in the chat response.

## Validator

Dedicated Maestro validation command:

```bash
node .agent-cli/bin/agent-stack.mjs validate-module module_orchestrator --module "<module>"
```

Optional write-back:

```bash
node .agent-cli/bin/agent-stack.mjs validate-module module_orchestrator --module "<module>" --write-status
```

What it validates:

- module-root `status.json` schema
- module-root artifact paths and file presence
- `README.md` frontmatter vs `status.json`
- feature-root pack presence when the feature has already been seeded
- feature-root `status.json` schema
- stage artifact validity for the current downstream stage
- rollup counts and review-gate invariants

## Module Artifacts

`Maestro` always owns:

- `artifacts/{module}/README.md`
- `artifacts/{module}/status.json`

It may also maintain:

- `artifacts/{module}/request.md`
- `artifacts/{module}/maestro-brief.md`
- `artifacts/{module}/feature-index.md`
- `artifacts/{module}/global-constraints.md`
- `artifacts/{module}/glossary.md`
- `artifacts/{module}/dependency-map.md`
- `artifacts/{module}/execution-order.md`
- `artifacts/{module}/status-board.md`

## Feature Root Pack

After seeding, each feature should contain only:

- `artifacts/{module}/{feature}/README.md`
- `artifacts/{module}/{feature}/status.json`
- `artifacts/{module}/{feature}/maestro-packet.md`

No empty `research/`, `design/`, `planning/`, `implementation/`, `documentation/`, or `evidence/` directories should be created during seeding.

## How To Start A New Module

Use `$maestro` only once per fresh thread:

```text
$maestro
module: research-avatar-service
task: Преврати platform/packages/research-avatar-service в небольшой execution-ready модуль. Сначала только discuss mode. Не запускай feature seeding, пока не закроем вопросы.
mode: discuss
```

## How To Continue The Same Thread

Do not call `$maestro` again in the same thread.

Just continue normally:

```text
Продолжаем текущий discuss.

Отвечаю на owner questions:
- execution target = package-scoped execution target
- local fixture adapters are acceptable for the first cut
- delete stays in the first minimal feature

Обнови module artifacts и скажи, готов ли модуль к feature seeding.
```

## How To Close Briefing

When the owner decisions are closed:

```text
Все owner decisions подтверждены.

Сделай следующее:
- обнови module artifacts
- закрой briefing
- зафиксируй final feature model
- переведи модуль в ready_for_feature_seeding = true, если blocking questions закрыты
- feature seeding пока не запускай
```

Expected result:

- `status = ready_to_seed` or `awaiting_feature_approval`
- `readiness.ready_for_feature_seeding = true`
- `readiness.open_questions_blocking = false`
- `summary.open_questions_count = 0`
- `summary.blockers_count = 0`
- `approvals.feature_seeding_received = false`
- `decomposition.features` contains the confirmed feature set

## How To Approve Feature Seeding

Minimal form:

```text
Approve feature seeding.
```

Strict form:

```text
Approve feature seeding.
Enter seed_features mode and create the confirmed feature root artifacts only. Do not launch orchestration yet.
```

Expected result:

- feature root pack exists for every confirmed feature
- feature status starts at `current_stage = seeded`
- feature status starts at `gate = awaiting_owner_approval`
- module status moves to `seeded` or `awaiting_orchestration_approval`
- approval is tracked as a gate, not as an open question or blocker

## How To Approve Orchestration Launch

Minimal form:

```text
Approve orchestration launch.
```

Strict form:

```text
Approve orchestration launch.
Enter launch_orchestration mode and start the first downstream stage from the seeded features.
```

For the current implementation model, that means:

- dispatch `research` through `research_codebase`
- do not silently continue into `design`
- wait for a Maestro review gate after Research completes

## How To Review Stage Output

When the current downstream stage is done, `Maestro` should move the module to a review gate instead of auto-launching the next stage.

Typical owner instruction:

```text
Review the research output.
Update the module and feature statuses.
Do not launch design yet.
```

If changes are needed:

```text
Research is not accepted.
Request changes and keep the feature in the current stage until the issues are resolved.
```

If the stage is accepted:

```text
Research is accepted.
Update the feature and module state so the next stage can be considered, but do not dispatch anything without a new approval.
```

## Current Scope Of The Orchestrator

What is already formalized:

- discuss-mode briefing
- feature seeding
- separate launch approval
- feature-root state model
- `research` as the first downstream stage in the real loop
- Maestro review gate after Research
- dedicated module validator

What is intentionally not auto-implemented yet:

- `design`, `planning`, `implementation`, `documentation`, and `evidence` dispatch
- multi-stage automatic chaining
- automatic migration of older artifact runs

Use [`adding-stage-agents.md`](./adding-stage-agents.md) before extending the loop to the next agent.
