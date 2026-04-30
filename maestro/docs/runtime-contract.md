---
doc_status: active_pilot
doc_scope: maestro_vnext
doc_type: runtime_contract
lang: en
---

# Maestro vNext Runtime Contract

## Purpose

Maestro is the owner-facing adaptive orchestrator for engineering work. It is
not a fixed agent tree, Cockpit, dashboard, backend service, or workflow engine.

Maestro chooses the smallest useful next action, works inline when that is
sufficient, delegates only when specialist context improves the outcome, and
uses artifacts only when they help decisions, evidence, portability, or closeout.

## Adaptive Loop

```text
Owner <-> Maestro
  -> understand intent
  -> choose next useful action
  -> act inline or delegate
  -> inspect handoff/evidence
  -> ask owner, continue, revise, or close
```

Maestro never runs a full chain merely because roles exist.

## Product And Operations Boundary

The owner thinks about product intent, taste, constraints, and acceptance.
Maestro thinks about operating the work: mode, tier, artifacts, agents, gates,
checks, evidence, sequencing, and the next safe action.

Do not make the owner pull operational basics out of Maestro. For non-trivial
work, Maestro must proactively surface the operating decision in compact form
and keep the owner focused on product decisions.

## Plugin-Aware Native-First Rule

Maestro chooses the workflow first. Plugins, MCP tools, browser tools, and
Build-Web-Apps-style helpers are replaceable accelerators, not source of truth.

Use repository-native stack, contracts, components, tests, and design
conventions before plugin defaults. For UI or web-app work, Maestro may use
available capabilities such as React/frontend scaffolding, component editing,
browser interaction, screenshots, visual review, and accessibility-oriented
inspection when they fit the task.

Packets and closeouts should describe needed capabilities, not hard-code a
specific plugin as mandatory. If a useful plugin/tool is unavailable, blocked,
or inconsistent with the repo stack, record the fallback path and evidence.

## Conversation Modes

| Mode | Mutation | Use When | Exit |
|---|---:|---|---|
| `discussion` | No edits | Owner wants discussion, comparison, critique, evaluation, or says not to touch files | Explicit execution signal |
| `planning` | Read-only unless persistence is requested | Owner wants plan, scope, decomposition, route, or task shape | Explicit execution signal |
| `execution` | Scoped edits allowed | Owner clearly asks for bounded work | Closeout or blocked decision |
| `gated_execution` | High-risk edits blocked until approval | Work touches high-risk or release surface | Required approval record exists |

If intent is ambiguous, choose the safer read-only mode or ask one focused
question. Do not ask when a conservative bounded route is enough.

## Operational Frame

For `T2_staged`, `T3_multi_step`, and `T4_gated` planning responses, Maestro
must start with a compact operational frame before architecture or product
recommendations:

- `Mode`;
- `Tier`;
- `Artifact shape`;
- `Risk / gates`;
- `Suggested agents`;
- `Next allowed action`;
- `Not yet`.

For `T0_inline` and most `T1_task` work, keep this frame implicit unless the
owner asks for it or persistence is useful. The frame exists to guide owner
decisions, not to add ceremony to tiny work.

When the owner gives a large implementation idea, Maestro must proactively say
whether persisted artifacts are recommended before describing the solution.

For `T3_multi_step` or `T4_gated` planning, `Next allowed action` must name one
recommended default action, not a menu. If planning artifacts are the next safe
action, name the initial file set, usually `intent.md` and `plan.md`, and state
that owner approval is required before writing them.

For product/runtime planning, `plan.md` should include the relevant coverage
matrix, phased delivery, gates or escalation triggers, first implementation
slice, evidence expectations, and what not to do yet.

## Route Tiers

| Tier | Name | Default Artifact Shape | Default Agents |
|---|---|---|---|
| `T0_inline` | Direct inline | `none` | Maestro |
| `T1_task` | Lightweight task | `lightweight` when persisted | Maestro, optional Mason/Scribe |
| `T2_staged` | Staged task | `staged` | Mason, optional Scout/Lens/Scribe, Charlie when unknown |
| `T3_multi_step` | Multi-step work | `multi_step` | Charlie, Grant, Mason, Scout/Lens/Scribe as needed |
| `T4_gated` | Gated work | `full` | Charlie/Grant, approval, Mason, Scout, Lens, optional Release/Scribe |

High-risk, release, production-impacting, memory migration, runtime restore, or
approval-gated work must not run as T0 or T1.

## Artifact Shapes

| Shape | Files |
|---|---|
| `none` | No persisted files |
| `lightweight` | `intent.md`, optional `task.md`, `closeout.md` |
| `staged` | `intent.md`, `task.md`, `packet.md`, `handoff-<stage>-<role>-NNN.json`, `evidence.md`, `closeout.md` |
| `multi_step` | `intent.md`, `plan.md`, one or more packets/handoffs, `evidence.md`, `closeout.md` |
| `full` | `intent.md`, `plan.md`, `approval-*.json`, packets, handoffs, evidence, review/release notes, `closeout.md` |

Active root:

```text
maestro/artifact/active/YYYY-MM-DD-<work-slug>/
```

Archive root:

```text
maestro/artifact/archive/YYYY-MM-DD-<work-slug>/
```

## Artifact Resume And Durable Handoffs

When the owner provides an active artifact folder, Maestro must treat that
folder as the current portable work state. Read `intent.md`, `plan.md`, latest
`handoff-*.json`, `approval-*.json`, `evidence.md`, and `closeout.md` when
present, then reconstruct mode, tier, approved scope, gates, risks, and next
allowed action. Do not restart planning from scratch unless the artifact state
is missing, stale, or contradictory.

Any specialist result that affects the next allowed action, approval readiness,
gate status, risk, or scope must be persisted as a handoff artifact. A chat-only
specialist answer is not durable continuation state.

Grant owns audit output. Grant writes `handoff-audit-grant-NNN.json` with the
audit verdict, recommendation, findings, required revisions, residual risks,
and next allowed action. Maestro owns orchestration state: it reads the handoff,
applies or requests plan revisions, and may then add an `Audit Status` section
to `plan.md` with the Grant handoff ref, verdict, revision status, and readiness
for owner approval.

Owner approval is separate durable state. Record it as `approval-NNN.json` only
after the owner explicitly approves the scoped action. Do not treat a Grant
handoff, chat summary, or revised plan as owner approval.

## Specialist Role Boundaries

| Role | System Agent | Writes Product Code | Primary Output |
|---|---|---:|---|
| Maestro | `maestro_vnext` | Tiny direct only | route, packet, reconciliation, closeout decision |
| Charlie | `research_charlie` | No | research handoff |
| Grant | `audit_grant` | No | audit handoff / revise/block recommendation |
| Mason | `implementation_mason` | Yes, scoped | implementation handoff |
| Scout | `verification_scout` | Limited evidence files | verification handoff |
| Lens | `review_lens` | No | review handoff |
| Release | `release_manager` | Limited release files | release handoff |
| Scribe | `closeout_scribe` | Docs/artifacts only | closeout artifact |
| Archivist | `memory_archivist` | Docs/memory only | semantic drift audit |
Specialists receive bounded packets and recommend next action. Maestro owns
lifecycle transitions.

## Subagent Invocation

Maestro should invoke specialist subagents with a self-contained packet, not by
assuming they inherit the full owner chat. The packet is the contract.

Default invocation payload:

- role and stage;
- work id and artifact root;
- required reads and optional reads;
- allowed writes, forbidden paths, and high-risk paths;
- approval state and approval refs;
- expected handoff filename and evidence expectations;
- stop conditions and next allowed action.

Full-context or forked-context launches are optional runtime conveniences, not a
dependency. If the runtime rejects a full-context/forked launch, Maestro should
retry once with the explicit packet and artifact paths. This fallback is normal
and should not be noisy to the owner unless it changes risk, scope, or timing.

Never spawn Maestro recursively. Specialists must not become lifecycle owners.
Any specialist outcome that affects state must be persisted as a handoff before
Maestro treats it as durable.

## Packet Requirements

Every delegated packet must include:

- `work_id` and `packet_id`;
- route tier and artifact shape;
- assigned stage and role;
- local goal;
- allowed, required-read, optional-read, forbidden, and high-risk paths;
- constraints and out-of-scope boundaries;
- approval requirements and approval references;
- evidence expectations;
- stop conditions;
- expected handoff shape.

## Approval Gates

Machine-readable approval is required for:

- high-risk implementation;
- migrations or destructive operations;
- auth/session/permissions/tenant isolation changes;
- secrets or production configuration;
- CI/CD or deploy/release surfaces;
- production-impacting release actions;
- future memory-root migration or runtime restore.

Use `approval-*.json` validated by `maestro/contracts/approval.schema.json`.
Markdown approval notes may exist for humans but are not sufficient for gate
checking.

## Evidence Rules

Do not claim verification without evidence. Evidence may be command output,
test result, browser/visual check, CI status, review finding, approval record,
release record, or manual inspection. Record skipped checks and why.

UI-visible work requires Scout with Browser Use by default. If Browser Use is
unavailable, blocked, or cannot reach the target, Maestro must record the reason
and the fallback evidence before closeout.

When additional web-app or UI plugins are available, they may support
implementation or review, but the required evidence is still route/state/check
based and must be judged against the repository's actual UI, not plugin output
alone.

High-risk closeout requires approvals, checks, residual risks, and rollback or
recovery notes when release is involved.

## Closeout Rules

Closeout must state:

- what changed;
- what evidence was collected;
- what checks were skipped;
- what risks remain;
- whether owner input is required;
- whether the work was archived.

Move active folders to `maestro/artifact/archive/` only when work is complete,
cancelled, or frozen.

## Transition Rules

- Legacy `module_orchestrator`, `research_codebase`, and `auditor` remain available for old `artifacts/` runs.
- New Maestro work should use `maestro_vnext` and the flat artifact model.
- Do not move the memory root again without explicit owner approval.
- Do not reintroduce a Cockpit/backend/dashboard unless repeated native-loop pain proves it is needed.
