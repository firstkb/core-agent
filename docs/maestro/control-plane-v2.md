---
doc_status: proposal
doc_scope: future
---

# Module Orchestrator Control Plane V2

Status: Proposal document. It describes a future-state replacement path for the current Maestro orchestration model and is not part of the current binding architecture.

Этот документ фиксирует новый архитектурный подход для `module_orchestrator`.
Его цель не "улучшить текущий Maestro по мелочам", а описать отдельную replacement-модель:

- control-plane first
- state gateway CLI
- frozen-by-default artifacts
- один владелец жизненного цикла модуля

---

## 1. Goal

Построить новый orchestration stack, в котором:

- `module_orchestrator` владеет жизненным циклом модуля;
- `CLI` является единственным легальным способом изменять machine state;
- Markdown используется как human-readable knowledge и frozen packets;
- JSON используется как runtime truth;
- downstream agents производят stage handoff artifacts, но не двигают lifecycle сами.

Эта модель должна заменить текущий multi-file, validator-heavy, prompt-driven orchestration path, а не эволюционно латать его бесконечно.

---

## 2. Executive Summary

Целевая модель:

- `module_orchestrator` принимает owner request и ведет discussion loop.
- Во время discussion существует ровно один живой human-document: `brief.md`.
- Состояние модуля и feature меняется только через `CLI` lifecycle commands.
- После owner approval brief превращается в frozen execution packet.
- После freeze narrative artifacts больше не редактируются молча.
- Downstream stages создают write-once handoff outputs.
- `module_orchestrator` принимает stage review decision.
- Owner approves only business decisions, scope changes, and execution entry.

Короткая формула:

`module_orchestrator` = lifecycle owner  
`CLI` = state gateway  
`Markdown` = frozen knowledge  
`JSON` = runtime truth

---

## 3. Why Replace Instead Of Patch

Новая модель сознательно уходит от следующих свойств текущего подхода:

- много одновременно живущих narrative documents в discuss phase;
- ручное или prompt-driven редактирование machine state;
- повторение одного и того же смысла в нескольких JSON-полях;
- validator-first workflow вместо state-first workflow;
- смешение readiness recommendation, technical review, and owner approval;
- соблазн расширять stack новыми агентами до стабилизации первого loop.

Вместо этого новая модель делает ставку на:

- минимальный mutable surface;
- жесткую границу между human documents и machine state;
- lifecycle transitions как typed CLI operations;
- frozen artifacts with explicit revisioning instead of silent rewrites.

---

## 4. Non-Negotiable Design Principles

### 4.1. Single Lifecycle Owner

`module_orchestrator` является единственным владельцем module lifecycle.

Он:

- принимает request;
- ведет discussion;
- готовит brief;
- freeze-ит execution packet;
- seed-ит features;
- dispatch-ит downstream stages;
- принимает stage handoff;
- пишет stage review decision;
- запрашивает owner approval на нужных границах;
- закрывает module.

Он не делает глубокий research или implementation сам.

### 4.2. One Live Brief During Discussion

В discussion существует только один mutable human-document:

- `brief.md`

Он должен быть строго структурированным рабочим документом, а не произвольным текстом.

Recommended sections:

- goal
- scope
- non-goals
- constraints
- acceptance signals
- open questions
- proposed feature decomposition

### 4.3. JSON Changes Only Through CLI

Агенты не редактируют `status.json` руками.

Правильная модель:

1. агент принимает семантическое решение;
2. агент вызывает CLI lifecycle command;
3. CLI валидирует transition;
4. CLI записывает новый JSON state.

### 4.4. Frozen-By-Default Markdown

Markdown documents являются frozen-by-default:

- mutable only during explicitly allowed drafting phases;
- write-once after freeze;
- versioned when amended.

Если после freeze требования меняются, создается не silent edit, а:

- `brief.v2.md`
- `packet.v2.md`
- or addendum artifact

а active revision выбирается через state.

### 4.5. Downstream Agents Produce Handoffs, Not State Transitions

Stage agents:

- выполняют только stage work;
- создают handoff artifacts;
- не двигают module lifecycle сами;
- не approve-ят следующий stage;
- не запускают downstream chain автоматически.

### 4.6. Approval Must Stay Human

Нельзя смешивать:

1. readiness recommendation;
2. technical acceptance of stage output;
3. business approval / scope approval.

Правильное разделение:

- helper/reviewer может дать readiness recommendation;
- `module_orchestrator` может принять technical review decision;
- owner делает business approval and execution approval.

---

## 5. Roles And Responsibilities

### 5.1. `module_orchestrator`

Primary responsibilities:

- owner-facing discussion
- brief maintenance
- feature decomposition
- feature seeding
- downstream dispatch
- stage review
- lifecycle ownership

### 5.2. `brief_reviewer` Helper Mode

В первой версии это должен быть helper-mode or helper-skill, а не отдельный permanent system agent.

Its job:

- find ambiguity
- detect contradictions
- test acceptance quality
- surface assumptions
- return readiness recommendation: `ready`, `revise`, or `blocked`

It must not approve the brief on behalf of the owner.

### 5.3. Downstream Stage Agents

Examples:

- `research_codebase`
- future design/implementation agents

Their job:

- execute only their stage
- create handoff artifacts
- return bounded outputs to `module_orchestrator`

### 5.4. Owner

Owner is responsible for:

- scope approval
- brief approval
- execution approval
- business-level decisions when review requires them

### 5.5. CLI

CLI owns:

- JSON scaffolding
- transition validation
- state persistence
- revision pointer updates
- filesystem skeleton creation when required

CLI does not own:

- decomposition decisions
- owner communication
- stage execution
- narrative reasoning

---

## 6. Lifecycle Model

### 6.1. Module Lifecycle

Recommended module phases:

- `discussion`
- `ready_for_brief_review`
- `ready_for_owner_approval`
- `brief_frozen`
- `ready_for_execution`
- `executing`
- `awaiting_owner_decision`
- `done`
- `blocked`
- `cancelled`

Interpretation:

- `discussion`: live clarification loop with mutable `brief.md`
- `ready_for_brief_review`: optional helper review can run
- `ready_for_owner_approval`: owner must approve the brief
- `brief_frozen`: execution packet is fixed and versioned
- `ready_for_execution`: features seeded, execution may be approved
- `executing`: at least one feature has an active stage
- `awaiting_owner_decision`: execution paused for owner decision
- `done`: module closed successfully
- `blocked`: lifecycle cannot continue without intervention
- `cancelled`: owner or system terminated the run

### 6.2. Feature Lifecycle

Recommended feature phases:

- `seeded`
- `approved`
- `research`
- `awaiting_stage_review`
- `implementation`
- `review`
- `done`
- `blocked`

This is intentionally coarse-grained.
Do not create stage-specific boolean fields such as `approved_for_research` or `approved_for_implementation`.

### 6.3. First Practical Loop

The first real loop should be:

`discussion -> brief review -> owner approval -> freeze -> feature seeding -> execution approval -> research -> stage review`

Do not design for many later stages before this first loop is stable.

---

## 7. Artifact Model

### 7.1. Module Level

Required:

- `brief.md`
- `status.json`
- `feature-index.md`

Optional, trigger-only:

- `architecture-note.md`
- `owner-decisions.md`
- `risk-note.md`

### 7.2. Feature Level

Required:

- `packet.md`
- `status.json`

### 7.3. Stage Level

Required:

- `handoff.json`
- `report.md`
- `review.json`
- `review.md`

### 7.4. Mutability Rules

Mutable:

- `brief.md` only before freeze
- module `status.json`
- feature `status.json`

Write-once after creation:

- `feature-index.md`
- `packet.md`
- `handoff.json`
- `report.md`
- `review.json`
- `review.md`

### 7.5. Suggested Directory Shape

Recommended V2 layout:

```text
artifacts/<module>/
  brief.md
  status.json
  feature-index.md
  features/
    <feature>/
      packet.md
      status.json
      stages/
        research/
          handoff.json
          report.md
          review.json
          review.md
```

This proposal intentionally separates:

- module-root narrative
- feature-root packets
- stage-level execution artifacts

so that stage outputs stop cluttering the feature root directly.

---

## 8. JSON Contracts

V2 should start with exactly four JSON contract types.
Do not add more until these four prove insufficient.

### 8.1. Module Status

Main module lifecycle state.

Example:

```json
{
  "schema_version": 1,
  "module_id": "avatar-service-test-execution",
  "phase": "discussion",
  "brief": {
    "path": "artifacts/avatar-service-test-execution/brief.md",
    "revision": 1,
    "frozen": false
  },
  "owner_approvals": {
    "brief": false,
    "execution": false
  },
  "open_questions": [],
  "features": [],
  "current_action": "awaiting_owner_input",
  "updated_at": "2026-03-17T00:00:00Z"
}
```

### 8.2. Feature Status

Main feature state.

Example:

```json
{
  "schema_version": 1,
  "module_id": "avatar-service-test-execution",
  "feature_id": "restore-executable-npm-test",
  "phase": "research",
  "packet": {
    "path": "artifacts/avatar-service-test-execution/features/restore-executable-npm-test/packet.md",
    "revision": 1
  },
  "latest_handoff": null,
  "latest_review": null,
  "blocked_reason": null,
  "updated_at": "2026-03-17T00:00:00Z"
}
```

### 8.3. Stage Handoff

Write-once downstream output.

Example:

```json
{
  "schema_version": 1,
  "module_id": "avatar-service-test-execution",
  "feature_id": "restore-executable-npm-test",
  "stage": "research",
  "agent": "research_codebase",
  "result": "ready_for_next_stage",
  "summary": "The root cause of the test failure is localized...",
  "evidence": [],
  "change_requests": [],
  "recommended_next_stage": "implementation"
}
```

### 8.4. Stage Review

Write-once `module_orchestrator` decision.

Example:

```json
{
  "schema_version": 1,
  "module_id": "avatar-service-test-execution",
  "feature_id": "restore-executable-npm-test",
  "reviewed_stage": "research",
  "decision": "accept",
  "reason": "Research is sufficient to proceed to implementation.",
  "requires_owner_input": false,
  "next_phase": "implementation"
}
```

### 8.5. Explicit Non-Goal

Do not introduce `task.json`, `run.json`, `queue.json`, `dispatch.json`, or other extra state files in the first cut unless a new responsibility appears that cannot be represented cleanly with the four contracts above.

---

## 9. CLI As State Gateway

### 9.1. Mental Model Shift

V2 CLI should be treated as:

`state gateway`

not:

`validator of everything at all times`

### 9.2. What CLI Must Do

- create initial JSON files from contract and inputs
- validate transition payloads on write
- apply legal lifecycle transitions
- create skeleton artifact directories
- update active document revision pointers
- reject illegal or contradictory state writes

### 9.3. What CLI Must Stop Doing

- validating the whole artifact universe on every small step
- encouraging agents to patch raw JSON directly
- exposing generic patch commands that can write arbitrary fields

### 9.4. Recommended Command Style

Prefer typed lifecycle commands:

```text
agent-cli module init --module avatar-service-test-execution --owner user
agent-cli module question add --module avatar-service-test-execution --text "Is E2E required or only unit/integration?"
agent-cli module freeze-brief --module avatar-service-test-execution
agent-cli feature create --module avatar-service-test-execution --feature restore-executable-npm-test
agent-cli stage start --module avatar-service-test-execution --feature restore-executable-npm-test --stage research --agent research_codebase
agent-cli stage handoff --module avatar-service-test-execution --feature restore-executable-npm-test --stage research --from handoff.json
agent-cli stage review --module avatar-service-test-execution --feature restore-executable-npm-test --stage research --decision accept
```

The CLI may later compress these commands internally, but the user-facing model should remain typed and lifecycle-specific.

### 9.5. Validation Boundary

Validation should happen:

- when state is created
- when state is changed
- when a transition is requested

Validation should not attempt to re-validate the whole repository on every normal state change.

---

## 10. Review And Approval Model

### 10.1. Brief Review

`brief_reviewer` returns one of:

- `ready`
- `revise`
- `blocked`

This is advisory, not binding.

### 10.2. Stage Review

`module_orchestrator` produces:

- `review.json`
- `review.md`

This is the technical control-plane decision for the completed stage.

### 10.3. Owner Approval

Owner approval is required for:

- scope acceptance
- brief acceptance
- execution entry
- any business decision escalated from review

No agent should be named `approver` unless it is explicitly limited to non-owner readiness recommendation.

---

## 11. Deliberate Breaks From Current Maestro

This proposal intentionally breaks with the current architecture in several ways.

### 11.1. Discuss Pack Collapse

Current direction:

- multiple module-root documents updated during briefing

V2 direction:

- one live `brief.md`

### 11.2. Validator-First To State-First

Current direction:

- broad validation pass after many edits

V2 direction:

- typed transition commands that validate on write boundary

### 11.3. Mutable Narrative To Frozen Narrative

Current direction:

- narrative documents may continue drifting through lifecycle changes

V2 direction:

- freeze, version, and reference revisions through state

### 11.4. Agent-Written State To CLI-Written State

Current direction:

- agents can effectively own the shape of `status.json`

V2 direction:

- agents declare intent, CLI writes the state

### 11.5. No Separate Execution Orchestrator Yet

V2 explicitly keeps one lifecycle owner:

- `module_orchestrator`

Do not split into:

- owner-facing Maestro
- background execution orchestrator

until parallel multi-feature execution creates real pressure for that split.

---

## 12. Phased Implementation Plan

### Phase 1. Freeze The V2 State Machine

Deliverables:

- module lifecycle states
- feature lifecycle states
- allowed transitions
- owner approval boundaries

### Phase 2. Define The Four JSON Schemas

Deliverables:

- module status schema
- feature status schema
- stage handoff schema
- stage review schema

Do not add new JSON contracts in this phase.

### Phase 3. Rebuild CLI As State Gateway

Deliverables:

- lifecycle-specific commands
- write-boundary validation
- revision pointer updates
- artifact skeleton generation

### Phase 4. Simplify The Artifact Set

Deliverables:

- `brief.md`
- `feature-index.md`
- `packet.md`
- stage `handoff/report/review`

Do not port the full current template set into V2 by default.

### Phase 5. Rewrite Prompts And Runtime Rules

Prompts must be rewritten against the V2 lifecycle, not adapted by patching the current Maestro package indefinitely.

### Phase 6. Run One Bounded Pilot

Use one bounded scenario, such as the avatar-service test-execution module, as the first V2 orchestration pilot.

Success criteria:

- one live brief in discussion
- JSON state only through CLI
- frozen packets after approval
- clean stage handoff and stage review
- no narrative drift

---

## 13. Recommendation

The architecture should move forward under this principle:

> do not keep improving the current Maestro stack indefinitely;
> define a new control-plane model, prove it on one bounded pilot,
> and only then decide whether to replace the current canonical stack.

This proposal recommends building V2 as a parallel architecture track first.

